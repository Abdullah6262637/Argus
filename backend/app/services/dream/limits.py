"""Dream Engine — Resource limits and configuration constants.

All limits are hard-enforced. The engine MUST respect these to prevent:
- Recursive explosion
- Compute starvation
- Memory exhaustion
- Self-confirmation loops
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DreamLimits:
    """Immutable resource limits for dream generation."""

    # Recursion limits
    max_depth: int = 3
    max_branches_per_dream: int = 3
    max_dreams_per_cycle: int = 10

    # Token/compute limits
    max_tokens_per_dream: int = 2000
    max_tokens_per_cycle: int = 15000
    max_time_per_dream_ms: float = 30_000.0   # 30 seconds
    max_time_per_cycle_ms: float = 300_000.0   # 5 minutes

    # Quality thresholds
    min_novelty_threshold: float = 0.2
    min_utility_threshold: float = 0.2
    min_plausibility_threshold: float = 0.3
    min_composite_value: float = 0.1

    # Diminishing returns
    diminishing_return_threshold: float = 0.05
    consecutive_low_value_limit: int = 3

    # Deduplication
    dedup_similarity_threshold: float = 0.85

    # Scheduler
    max_episodes_to_consider: int = 50
    min_priority_score: float = 0.1

    # Context
    max_context_episodes: int = 5
    max_context_knowledge_items: int = 10
    max_context_contradictions: int = 5


# Default singleton instance
DEFAULT_LIMITS = DreamLimits()
