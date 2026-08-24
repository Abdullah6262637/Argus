"""Tests for Dream Engine models and data structures."""
from __future__ import annotations

import pytest
from datetime import UTC, datetime

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


class TestDreamScore:
    """DreamScore composite value computation."""

    def test_default_score_composite_is_zero(self):
        score = DreamScore()
        assert score.composite_value == 0.0

    def test_high_quality_score(self):
        score = DreamScore(
            novelty=0.9, utility=0.9, plausibility=0.9,
            evidence_quality=0.9, compute_cost=0.1,
        )
        assert score.composite_value > 5.0

    def test_compute_cost_penalizes_composite(self):
        low_cost = DreamScore(
            novelty=0.5, utility=0.5, plausibility=0.5,
            evidence_quality=0.5, compute_cost=0.1,
        )
        high_cost = DreamScore(
            novelty=0.5, utility=0.5, plausibility=0.5,
            evidence_quality=0.5, compute_cost=0.9,
        )
        assert low_cost.composite_value > high_cost.composite_value

    def test_risk_penalizes_composite(self):
        safe = DreamScore(novelty=0.5, utility=0.5, plausibility=0.5, compute_cost=0.5)
        risky = DreamScore(
            novelty=0.5, utility=0.5, plausibility=0.5,
            risk=0.9, compute_cost=0.5,
        )
        assert safe.composite_value > risky.composite_value

    def test_contradiction_penalizes_composite(self):
        clean = DreamScore(novelty=0.5, utility=0.5, plausibility=0.5, compute_cost=0.5)
        contradictory = DreamScore(
            novelty=0.5, utility=0.5, plausibility=0.5,
            contradiction=0.9, compute_cost=0.5,
        )
        assert clean.composite_value > contradictory.composite_value

    def test_composite_value_never_negative(self):
        terrible = DreamScore(
            risk=1.0, contradiction=1.0, uncertainty=1.0, compute_cost=1.0,
        )
        assert terrible.composite_value >= 0.0


class TestSchedulerSignals:
    """SchedulerSignals priority computation."""

    def test_default_signals_zero_priority(self):
        signals = SchedulerSignals()
        assert signals.composite_priority == 0.0

    def test_high_surprise_failure_boosts_priority(self):
        signals = SchedulerSignals(surprise=1.0, failure=1.0, contradiction=1.0)
        assert signals.composite_priority > 0.3

    def test_all_max_signals(self):
        signals = SchedulerSignals(
            surprise=1.0, failure=1.0, uncertainty=1.0, novelty=1.0,
            contradiction=1.0, importance=1.0, knowledge_gap=1.0,
            transfer_potential=1.0, recency=1.0, expected_info_gain=1.0,
        )
        assert signals.composite_priority == pytest.approx(1.0)


class TestDreamObject:
    """DreamObject creation, serialization, and epistemic invariants."""

    def test_default_dream_has_synthetic_state(self):
        dream = DreamObject()
        assert dream.epistemic_state == EpistemicState.SYNTHETIC

    def test_default_dream_has_pending_status(self):
        dream = DreamObject()
        assert dream.status == DreamStatus.PENDING

    def test_dream_id_is_unique(self):
        d1 = DreamObject()
        d2 = DreamObject()
        assert d1.dream_id != d2.dream_id

    def test_serialization_roundtrip(self):
        dream = DreamObject(
            source_episode_ids=["ep-1", "ep-2"],
            generation_method=GenerationMethod.COUNTERFACTUAL,
            assumptions=["API was available"],
            modified_variables={"tool": "curl"},
            actions=["call API"],
            observations=["200 OK"],
            outcome="success",
            epistemic_state=EpistemicState.COUNTERFACTUAL,
            depth=2,
            agent_id="agent-007",
        )
        dream.score = DreamScore(novelty=0.8, utility=0.6)
        dream.status = DreamStatus.EVALUATED

        data = dream.to_dict()
        restored = DreamObject.from_dict(data)

        assert restored.dream_id == dream.dream_id
        assert restored.source_episode_ids == ["ep-1", "ep-2"]
        assert restored.generation_method == GenerationMethod.COUNTERFACTUAL
        assert restored.epistemic_state == EpistemicState.COUNTERFACTUAL
        assert restored.assumptions == ["API was available"]
        assert restored.modified_variables == {"tool": "curl"}
        assert restored.depth == 2
        assert restored.status == DreamStatus.EVALUATED
        assert restored.score.novelty == pytest.approx(0.8)

    def test_dream_created_at_has_utc_timezone(self):
        dream = DreamObject()
        assert dream.created_at.tzinfo is not None


class TestDreamContext:
    """DreamContext source labeling."""

    def test_label_source_tracks_epistemic_state(self):
        ctx = DreamContext()
        ctx.label_source("ep-1", "verified")
        ctx.label_source("ep-2", "speculative")
        assert ctx.epistemic_states["ep-1"] == "verified"
        assert ctx.epistemic_states["ep-2"] == "speculative"


class TestDreamLimits:
    """DreamLimits immutability and defaults."""

    def test_default_limits_exist(self):
        assert DEFAULT_LIMITS.max_depth == 3
        assert DEFAULT_LIMITS.max_dreams_per_cycle == 10
        assert DEFAULT_LIMITS.max_tokens_per_dream == 2000

    def test_limits_are_frozen(self):
        with pytest.raises(AttributeError):
            DEFAULT_LIMITS.max_depth = 99  # type: ignore[misc]

    def test_custom_limits(self):
        custom = DreamLimits(max_depth=7, max_dreams_per_cycle=50)
        assert custom.max_depth == 7
        assert custom.max_dreams_per_cycle == 50


class TestEpistemicStateExhaustion:
    """Verify that no epistemic state maps to 'verified' or 'promoted'."""

    def test_no_verified_state_exists(self):
        for state in EpistemicState:
            assert "verified" not in state.value.lower()
            assert "promoted" not in state.value.lower()
            assert "supported" not in state.value.lower()

    def test_all_states_are_non_authoritative(self):
        non_authoritative = {"synthetic", "speculative", "counterfactual", "analogical", "fused"}
        actual = {s.value for s in EpistemicState}
        assert actual == non_authoritative


class TestDreamStatusExhaustion:
    """Verify promotion states don't exist in DreamStatus."""

    def test_no_promoted_status(self):
        for status in DreamStatus:
            assert "promoted" not in status.value.lower()
            assert "verified" not in status.value.lower()
            assert "supported" not in status.value.lower()
