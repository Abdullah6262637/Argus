"""Tests for Dream Generation strategies."""
from __future__ import annotations

import pytest

from app.services.dream.models import (
    DreamContext,
    DreamObject,
    DreamStatus,
    EpistemicState,
    GenerationMethod,
)
from app.services.dream.strategies.replay import ReplayStrategy
from app.services.dream.strategies.mutation import MutationStrategy
from app.services.dream.strategies.counterfactual import CounterfactualStrategy
from app.services.dream.strategies.fusion import FusionStrategy
from app.services.dream.strategies.inversion import InversionStrategy
from app.services.dream.strategies.analogy import AnalogyStrategy
from app.services.dream.strategies.base import StrategyRegistry


def _make_test_context(episode_count: int = 1) -> DreamContext:
    """Create a test context with sample episodes."""
    episodes = []
    for i in range(episode_count):
        episodes.append({
            "id": f"ep-{i}",
            "content": f"User asked to deploy app version {i}. Agent ran tests, found 2 failures, fixed them, deployed successfully.",
            "actions": ["run_tests", "fix_bug", "deploy"],
            "outcome": "success" if i % 2 == 0 else "failure",
            "tools_used": ["shell_exec", "file_write", "git_push"],
            "domain": "devops",
            "error": None if i % 2 == 0 else "TimeoutError during deploy",
        })
    return DreamContext(source_episodes=episodes)


class TestReplayStrategy:
    """Replay strategy tests."""

    @pytest.mark.asyncio
    async def test_replay_generates_dream(self):
        strategy = ReplayStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.REPLAY for d in dreams)
        assert all(d.status == DreamStatus.GENERATED for d in dreams)

    @pytest.mark.asyncio
    async def test_replay_sets_correct_epistemic_state(self):
        strategy = ReplayStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert all(d.epistemic_state == EpistemicState.SYNTHETIC for d in dreams)

    def test_replay_method_property(self):
        assert ReplayStrategy().method == GenerationMethod.REPLAY


class TestMutationStrategy:
    """Mutation strategy tests."""

    @pytest.mark.asyncio
    async def test_mutation_generates_dream(self):
        strategy = MutationStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.MUTATION for d in dreams)

    @pytest.mark.asyncio
    async def test_mutation_records_modified_variables(self):
        strategy = MutationStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        for dream in dreams:
            assert dream.modified_variables is not None

    def test_mutation_method_property(self):
        assert MutationStrategy().method == GenerationMethod.MUTATION


class TestCounterfactualStrategy:
    """Counterfactual strategy tests."""

    @pytest.mark.asyncio
    async def test_counterfactual_generates_dream(self):
        strategy = CounterfactualStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.COUNTERFACTUAL for d in dreams)

    @pytest.mark.asyncio
    async def test_counterfactual_sets_correct_epistemic_state(self):
        strategy = CounterfactualStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert all(d.epistemic_state == EpistemicState.COUNTERFACTUAL for d in dreams)

    @pytest.mark.asyncio
    async def test_counterfactual_records_assumptions(self):
        strategy = CounterfactualStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        for dream in dreams:
            assert len(dream.assumptions) > 0

    def test_counterfactual_method_property(self):
        assert CounterfactualStrategy().method == GenerationMethod.COUNTERFACTUAL


class TestFusionStrategy:
    """Fusion strategy tests."""

    @pytest.mark.asyncio
    async def test_fusion_requires_multiple_episodes(self):
        strategy = FusionStrategy()
        ctx = _make_test_context(episode_count=2)
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.FUSION for d in dreams)

    @pytest.mark.asyncio
    async def test_fusion_sets_fused_epistemic_state(self):
        strategy = FusionStrategy()
        ctx = _make_test_context(episode_count=2)
        dreams = await strategy.generate(ctx)
        assert all(d.epistemic_state == EpistemicState.FUSED for d in dreams)

    def test_fusion_method_property(self):
        assert FusionStrategy().method == GenerationMethod.FUSION


class TestInversionStrategy:
    """Inversion strategy tests."""

    @pytest.mark.asyncio
    async def test_inversion_generates_dream(self):
        strategy = InversionStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.INVERSION for d in dreams)

    def test_inversion_method_property(self):
        assert InversionStrategy().method == GenerationMethod.INVERSION


class TestAnalogyStrategy:
    """Analogy strategy tests."""

    @pytest.mark.asyncio
    async def test_analogy_generates_dream(self):
        strategy = AnalogyStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert len(dreams) >= 1
        assert all(d.generation_method == GenerationMethod.ANALOGY for d in dreams)

    @pytest.mark.asyncio
    async def test_analogy_sets_analogical_epistemic_state(self):
        strategy = AnalogyStrategy()
        ctx = _make_test_context()
        dreams = await strategy.generate(ctx)
        assert all(d.epistemic_state == EpistemicState.ANALOGICAL for d in dreams)

    def test_analogy_method_property(self):
        assert AnalogyStrategy().method == GenerationMethod.ANALOGY


class TestStrategyRegistry:
    """Strategy registry tests."""

    def test_register_and_get(self):
        registry = StrategyRegistry()
        strategy = ReplayStrategy()
        registry.register(strategy)
        assert registry.get(GenerationMethod.REPLAY) is strategy

    def test_get_nonexistent_returns_none(self):
        registry = StrategyRegistry()
        assert registry.get(GenerationMethod.REPLAY) is None

    def test_all_returns_registered(self):
        registry = StrategyRegistry()
        registry.register(ReplayStrategy())
        registry.register(MutationStrategy())
        assert len(registry.all()) == 2

    def test_available_methods(self):
        registry = StrategyRegistry()
        registry.register(ReplayStrategy())
        registry.register(CounterfactualStrategy())
        methods = registry.available_methods()
        assert GenerationMethod.REPLAY in methods
        assert GenerationMethod.COUNTERFACTUAL in methods

    def test_register_all_strategies(self):
        """All 6 strategies can be registered without conflict."""
        registry = StrategyRegistry()
        for cls in [ReplayStrategy, MutationStrategy, CounterfactualStrategy,
                    FusionStrategy, InversionStrategy, AnalogyStrategy]:
            registry.register(cls())
        assert len(registry.all()) == 6
        assert len(registry.available_methods()) == 6
