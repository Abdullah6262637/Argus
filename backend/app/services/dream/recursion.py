from __future__ import annotations

import logging

from app.services.dream.models import DreamObject
from app.services.dream.limits import DEFAULT_LIMITS

logger = logging.getLogger(__name__)

class RecursionManager:
    """Tracks cycle state and enforces limits to prevent explosions."""
    
    def __init__(self) -> None:
        self.dreams_this_cycle: int = 0
        self.tokens_this_cycle: int = 0
        self.time_ms_this_cycle: float = 0.0
        self.low_value_count: int = 0
        
    def can_recurse(self, dream: DreamObject) -> bool:
        """Check if we can branch from this dream."""
        if dream.depth >= DEFAULT_LIMITS.max_depth:
            return False
        if dream.branch_index >= DEFAULT_LIMITS.max_branches_per_dream:
            return False
        if self.dreams_this_cycle >= DEFAULT_LIMITS.max_dreams_per_cycle:
            return False
        if self.tokens_this_cycle >= DEFAULT_LIMITS.max_tokens_per_cycle:
            return False
        if self.time_ms_this_cycle >= DEFAULT_LIMITS.max_time_per_cycle_ms:
            return False
            
        return True
        
    def track(self, dream: DreamObject) -> None:
        """Register a dream in the cycle state."""
        self.dreams_this_cycle += 1
        self.tokens_this_cycle += dream.generation_tokens
        self.time_ms_this_cycle += dream.generation_time_ms
        
        # Track diminishing returns
        if dream.score.composite_value < DEFAULT_LIMITS.diminishing_return_threshold:
            self.low_value_count += 1
        else:
            self.low_value_count = 0
            
    def should_terminate(self) -> bool:
        """Check if the entire cycle should terminate early."""
        if self.dreams_this_cycle >= DEFAULT_LIMITS.max_dreams_per_cycle:
            return True
        if self.tokens_this_cycle >= DEFAULT_LIMITS.max_tokens_per_cycle:
            return True
        if self.time_ms_this_cycle >= DEFAULT_LIMITS.max_time_per_cycle_ms:
            return True
        if self.low_value_count >= DEFAULT_LIMITS.consecutive_low_value_limit:
            return True
            
        return False
