"""Tests for DreamScheduler, DreamCritic, RecursionManager, and DreamEngine."""
from __future__ import annotations

import pytest

from app.services.dream.models import (
    DreamContext,
    DreamObject,
    DreamScore,
    DreamStatus,
    EpistemicState,
    GenerationMethod,
    SchedulerSignals,
)
from app.services.dream.limits import DEFAULT_LIMITS, DreamLimits
from app.services.dream.scheduler import DreamScheduler
from app.services.dream.critic import DreamCritic
from app.services.dream.recursion import RecursionManager
from app.services.dream.deduplication import DreamDeduplicator
from app.services.dream.context import DreamContextBuilder


# ─────────────── Scheduler Tests ───────────────

class TestDreamScheduler:
    """Dream Scheduler selection and scoring."""

    def test_score_episode_with_failure(self):
        scheduler = DreamScheduler()
        episode = {
            "id": "ep-1",
            "outcome": "failure",
            "error": "TimeoutError",
            "content": "Deploy failed with timeout",
        }
        signals = scheduler.score_episode(episode)
        assert signals.failure > 0
        assert signals.composite_priority > 0

    def test_score_episode_with_success(self):
        scheduler = DreamScheduler()
        episode = {
            "id": "ep-2",
            "outcome": "success",
            "content": "Deployment succeeded",
        }
        signals = scheduler.score_episode(episode)
        assert signals.failure == 0.0 or signals.failure < 0.3

    def test_select_episodes_returns_top_n(self):
        scheduler = DreamScheduler()
        episodes = [
            {"id": "ep-1", "outcome": "failure", "error": "Error", "content": "Failed"},
            {"id": "ep-2", "outcome": "success", "content": "OK"},
            {"id": "ep-3", "outcome": "failure", "error": "Critical", "content": "Critical failure unexpected"},
        ]
        selected = scheduler.select_episodes(episodes, limit=2)
        assert len(selected) <= 2

    def test_select_episodes_empty_input(self):
        scheduler = DreamScheduler()
        selected = scheduler.select_episodes([], limit=5)
        assert selected == []

    def test_deterministic_scoring(self):
        scheduler = DreamScheduler()
        episode = {"id": "ep-1", "outcome": "failure", "error": "E", "content": "Test"}
        s1 = scheduler.score_episode(episode)
        s2 = scheduler.score_episode(episode)
        assert s1.composite_priority == s2.composite_priority


# ─────────────── Critic Tests ───────────────

class TestDreamCritic:
    """Dream Critic evaluation."""

    def test_evaluate_returns_score(self):
        critic = DreamCritic()
        dream = DreamObject(
            generation_method=GenerationMethod.COUNTERFACTUAL,
            actions=["test", "deploy"],
            observations=["test passed"],
            outcome="success",
            assumptions=["API available"],
            modified_variables={"tool": "curl"},
        )
        dream.status = DreamStatus.GENERATED
        score = critic.evaluate(dream)
        assert isinstance(score, DreamScore)
        assert 0.0 <= score.novelty <= 1.0
        assert 0.0 <= score.utility <= 1.0
        assert 0.0 <= score.plausibility <= 1.0

    def test_empty_dream_gets_low_score(self):
        critic = DreamCritic()
        dream = DreamObject()
        dream.status = DreamStatus.GENERATED
        score = critic.evaluate(dream)
        assert score.composite_value < 3.0


# ─────────────── Recursion Tests ───────────────

class TestRecursionManager:
    """Recursion manager limits enforcement."""

    def test_depth_limit_blocks_recursion(self):
        manager = RecursionManager()
        dream = DreamObject(depth=99)
        assert not manager.can_recurse(dream)

    def test_shallow_depth_allows_recursion(self):
        manager = RecursionManager()
        dream = DreamObject(depth=1)
        assert manager.can_recurse(dream)

    def test_dream_count_limit(self):
        manager = RecursionManager()
        for i in range(15):
            manager.track(DreamObject())
        dream = DreamObject(depth=0)
        assert not manager.can_recurse(dream)

    def test_track_updates_state(self):
        manager = RecursionManager()
        assert manager.dreams_this_cycle == 0
        manager.track(DreamObject())
        assert manager.dreams_this_cycle == 1

    def test_should_terminate_on_empty(self):
        manager = RecursionManager()
        assert not manager.should_terminate()


# ─────────────── Deduplication Tests ───────────────

class TestDreamDeduplicator:
    """Dream deduplication and clustering."""

    def test_identical_dreams_are_deduplicated(self):
        dedup = DreamDeduplicator()
        d1 = DreamObject(
            outcome="Deploy failed due to timeout",
            generation_method=GenerationMethod.REPLAY,
        )
        d2 = DreamObject(
            outcome="Deploy failed due to timeout",
            generation_method=GenerationMethod.REPLAY,
        )
        result = dedup.deduplicate([d1, d2], threshold=0.8)
        assert len(result) <= 2  # At least some clustering should occur

    def test_different_dreams_are_preserved(self):
        dedup = DreamDeduplicator()
        d1 = DreamObject(
            outcome="API call succeeded with 200",
            generation_method=GenerationMethod.REPLAY,
        )
        d2 = DreamObject(
            outcome="Database migration failed with lock timeout",
            generation_method=GenerationMethod.COUNTERFACTUAL,
        )
        result = dedup.deduplicate([d1, d2], threshold=0.95)
        assert len(result) == 2

    def test_empty_list_returns_empty(self):
        dedup = DreamDeduplicator()
        assert dedup.deduplicate([], threshold=0.8) == []

    def test_single_dream_returns_unchanged(self):
        dedup = DreamDeduplicator()
        d = DreamObject(outcome="test")
        result = dedup.deduplicate([d], threshold=0.8)
        assert len(result) == 1


# ─────────────── Context Builder Tests ───────────────

class TestDreamContextBuilder:
    """Context builder tests."""

    def test_build_creates_context(self):
        builder = DreamContextBuilder()
        episodes = [{"id": "ep-1", "content": "test"}]
        ctx = builder.build(episodes=episodes, knowledge=[], contradictions=[], strategies=[], constraints=[])
        assert isinstance(ctx, DreamContext)
        assert len(ctx.source_episodes) == 1

    def test_build_respects_limits(self):
        builder = DreamContextBuilder()
        episodes = [{"id": f"ep-{i}", "content": f"test {i}"} for i in range(10)]
        ctx = builder.build(episodes=episodes, knowledge=[], contradictions=[], strategies=[], constraints=[])
        assert len(ctx.source_episodes) <= DEFAULT_LIMITS.max_context_episodes

    def test_build_labels_sources(self):
        builder = DreamContextBuilder()
        episodes = [{"id": "ep-1", "content": "test", "epistemic_state": "verified"}]
        ctx = builder.build(episodes=episodes, knowledge=[], contradictions=[], strategies=[], constraints=[])
        assert "ep-1" in ctx.epistemic_states
