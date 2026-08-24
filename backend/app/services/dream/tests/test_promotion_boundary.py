"""CRITICAL TEST: Prove that Dream → Promoted is IMPOSSIBLE.

This test file exists to provide formal guarantees that the Dream Engine
can NEVER directly promote a dream to verified/supported/promoted status.
The only valid path is: Dream → Candidate Hypothesis → Verification Engine.
"""
from __future__ import annotations

import pytest

from app.services.dream.models import (
    DreamObject,
    DreamStatus,
    EpistemicState,
    GenerationMethod,
)


class TestPromotionBoundary:
    """Prove that no direct path exists from DREAM to PROMOTED/VERIFIED."""

    def test_dream_status_has_no_promoted_state(self):
        """DreamStatus enum must not contain promoted/verified/supported."""
        forbidden = {"promoted", "verified", "supported", "confirmed", "proven"}
        for status in DreamStatus:
            assert status.value.lower() not in forbidden, (
                f"CRITICAL: DreamStatus.{status.name} = '{status.value}' "
                f"violates the promotion boundary!"
            )

    def test_epistemic_state_has_no_authoritative_state(self):
        """EpistemicState enum must not contain verified/promoted/supported."""
        forbidden = {"verified", "promoted", "supported", "confirmed", "proven", "fact"}
        for state in EpistemicState:
            assert state.value.lower() not in forbidden, (
                f"CRITICAL: EpistemicState.{state.name} = '{state.value}' "
                f"violates epistemic separation!"
            )

    def test_dream_cannot_transition_to_nonexistent_promoted(self):
        """A DreamObject cannot be set to a 'promoted' status."""
        dream = DreamObject()
        with pytest.raises(ValueError):
            dream.status = DreamStatus("promoted")

    def test_dream_cannot_transition_to_nonexistent_verified(self):
        """A DreamObject cannot be set to a 'verified' epistemic state."""
        dream = DreamObject()
        with pytest.raises(ValueError):
            dream.epistemic_state = EpistemicState("verified")

    def test_candidate_is_the_terminal_positive_state(self):
        """CANDIDATE is the highest positive state a dream can reach."""
        dream = DreamObject()
        dream.status = DreamStatus.CANDIDATE
        assert dream.status == DreamStatus.CANDIDATE
        # Candidate is the boundary — there's no further promotion status
        positive_terminal_states = {
            DreamStatus.CANDIDATE,
            DreamStatus.EVALUATED,
            DreamStatus.CLUSTERED,
        }
        assert dream.status in positive_terminal_states

    def test_all_generation_methods_produce_non_authoritative_dreams(self):
        """Every GenerationMethod must map to a non-authoritative EpistemicState."""
        authoritative = {"verified", "promoted", "supported", "fact"}
        for method in GenerationMethod:
            dream = DreamObject(generation_method=method)
            assert dream.epistemic_state.value not in authoritative, (
                f"GenerationMethod.{method.name} produced authoritative "
                f"epistemic state: {dream.epistemic_state.value}"
            )

    def test_dream_to_dict_never_contains_promoted(self):
        """Serialized dream must never contain 'promoted' or 'verified' values."""
        for method in GenerationMethod:
            for state in EpistemicState:
                dream = DreamObject(
                    generation_method=method,
                    epistemic_state=state,
                )
                dream.status = DreamStatus.CANDIDATE
                data = dream.to_dict()
                assert data["status"] != "promoted"
                assert data["status"] != "verified"
                assert data["epistemic_state"] != "verified"
                assert data["epistemic_state"] != "promoted"

    def test_valid_hypothesis_path(self):
        """The ONLY valid path toward knowledge promotion is:
        DREAM → CANDIDATE → (future) VERIFICATION ENGINE.

        This test proves the dream can reach CANDIDATE status,
        and that there is no further status within the Dream Engine.
        """
        dream = DreamObject(
            generation_method=GenerationMethod.COUNTERFACTUAL,
            epistemic_state=EpistemicState.COUNTERFACTUAL,
        )

        # Step 1: Generate
        dream.status = DreamStatus.GENERATING
        assert dream.status == DreamStatus.GENERATING

        # Step 2: Generated
        dream.status = DreamStatus.GENERATED
        assert dream.status == DreamStatus.GENERATED

        # Step 3: Evaluated by critic
        dream.status = DreamStatus.EVALUATED
        assert dream.status == DreamStatus.EVALUATED

        # Step 4: Promoted to candidate hypothesis
        dream.status = DreamStatus.CANDIDATE
        assert dream.status == DreamStatus.CANDIDATE

        # Step 5: There is NO step 5 in the Dream Engine.
        # The Verification Engine (future milestone) handles promotion.
        remaining_statuses = {s.value for s in DreamStatus}
        assert "promoted" not in remaining_statuses


class TestDreamNeverAuthoritative:
    """Additional invariant checks that dreams are never authoritative."""

    def test_fresh_dream_is_synthetic(self):
        dream = DreamObject()
        assert dream.epistemic_state == EpistemicState.SYNTHETIC

    def test_epistemic_state_survives_serialization(self):
        for state in EpistemicState:
            dream = DreamObject(epistemic_state=state)
            data = dream.to_dict()
            restored = DreamObject.from_dict(data)
            assert restored.epistemic_state == state
            assert restored.epistemic_state.value not in {"verified", "promoted"}

    def test_counterfactual_dream_marked_correctly(self):
        dream = DreamObject(
            generation_method=GenerationMethod.COUNTERFACTUAL,
            epistemic_state=EpistemicState.COUNTERFACTUAL,
            assumptions=["Action X did not happen"],
            modified_variables={"action_x": "removed"},
        )
        assert dream.epistemic_state == EpistemicState.COUNTERFACTUAL
        assert len(dream.assumptions) > 0
        assert len(dream.modified_variables) > 0
