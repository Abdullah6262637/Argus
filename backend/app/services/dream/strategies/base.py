"""Dream Engine — Strategy base interface.

Every generation strategy implements this interface.
Strategies are plugins: the engine discovers them by registration,
not by hard-coding into one giant function.
"""
from __future__ import annotations

import abc
from typing import Any, Dict, List, Optional

from app.services.dream.models import (
    DreamContext,
    DreamObject,
    EpistemicState,
    GenerationMethod,
)


class DreamStrategy(abc.ABC):
    """Abstract base for dream generation strategies.

    Each strategy takes a DreamContext and produces one or more
    DreamObject instances. The strategy MUST:
    - Set `generation_method` on every produced dream
    - Set `epistemic_state` appropriately (never VERIFIED)
    - Record `modified_variables` for counterfactuals/mutations
    - Record `assumptions` explicitly
    """

    @property
    @abc.abstractmethod
    def method(self) -> GenerationMethod:
        """The generation method this strategy implements."""

    @property
    def name(self) -> str:
        """Human-readable name for logging."""
        return self.method.value

    @abc.abstractmethod
    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        """Generate one or more dreams from the given context.

        Args:
            context: Bounded context with source episodes, knowledge, etc.
            parent: Parent dream for recursive dreaming (None for root).
            llm_call: Async callable for LLM inference (prompt → response).
            agent_id: Agent ID for provenance tracking.

        Returns:
            List of generated DreamObjects. May be empty if generation
            produces nothing worthwhile.
        """

    def _make_dream(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        agent_id: Optional[str] = None,
    ) -> DreamObject:
        """Helper to create a base DreamObject with correct provenance."""
        depth = (parent.depth + 1) if parent else 0
        source_ids = (
            parent.source_episode_ids
            if parent
            else [ep.get("id", "") for ep in context.source_episodes if ep.get("id")]
        )
        epistemic = self._default_epistemic_state()
        return DreamObject(
            parent_dream_id=parent.dream_id if parent else None,
            source_episode_ids=source_ids,
            generation_method=self.method,
            context=context,
            epistemic_state=epistemic,
            depth=depth,
            agent_id=agent_id,
        )

    def _default_epistemic_state(self) -> EpistemicState:
        """Return the default epistemic state for this strategy type."""
        mapping: Dict[GenerationMethod, EpistemicState] = {
            GenerationMethod.REPLAY: EpistemicState.SYNTHETIC,
            GenerationMethod.MUTATION: EpistemicState.SPECULATIVE,
            GenerationMethod.COUNTERFACTUAL: EpistemicState.COUNTERFACTUAL,
            GenerationMethod.FUSION: EpistemicState.FUSED,
            GenerationMethod.INVERSION: EpistemicState.SPECULATIVE,
            GenerationMethod.ANALOGY: EpistemicState.ANALOGICAL,
        }
        return mapping.get(self.method, EpistemicState.SYNTHETIC)


class StrategyRegistry:
    """Registry of available dream generation strategies."""

    def __init__(self) -> None:
        self._strategies: Dict[GenerationMethod, DreamStrategy] = {}

    def register(self, strategy: DreamStrategy) -> None:
        """Register a strategy. Overwrites if method already registered."""
        self._strategies[strategy.method] = strategy

    def get(self, method: GenerationMethod) -> Optional[DreamStrategy]:
        """Get a strategy by its generation method."""
        return self._strategies.get(method)

    def all(self) -> List[DreamStrategy]:
        """Return all registered strategies."""
        return list(self._strategies.values())

    def available_methods(self) -> List[GenerationMethod]:
        """Return all available generation methods."""
        return list(self._strategies.keys())
