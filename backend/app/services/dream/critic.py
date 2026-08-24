from __future__ import annotations

import logging
from typing import Any, Callable, Optional

from app.services.dream.models import DreamObject, DreamScore

logger = logging.getLogger(__name__)

class DreamCritic:
    """Evaluates dreams for quality and viability."""
    
    def evaluate(self, dream: DreamObject, llm_call: Optional[Callable] = None) -> DreamScore:
        """Score a dream, optionally using an LLM."""
        if llm_call:
            return self._evaluate_with_llm(dream, llm_call)
        return self._evaluate_heuristic(dream)
        
    def _evaluate_heuristic(self, dream: DreamObject) -> DreamScore:
        """Fast, deterministic heuristic evaluation."""
        score = DreamScore()
        
        # Basic heuristic logic based on dream properties
        content = " ".join(dream.actions + dream.observations + [dream.outcome]).lower()
        
        if dream.modified_variables:
            score.novelty = 0.5 + (0.1 * min(len(dream.modified_variables), 5))
            score.plausibility = max(0.1, 0.8 - (0.1 * len(dream.modified_variables)))
        else:
            score.novelty = 0.2
            score.plausibility = 0.9
            
        if "success" in content or "solved" in content:
            score.utility = 0.7
            
        if "danger" in content or "risk" in content or "fail" in content:
            score.risk = 0.6
            
        if "impossible" in content or "contradicts" in content:
            score.contradiction = 0.8
            
        score.evidence_quality = 0.5 if dream.source_episode_ids else 0.1
        score.compute_cost = min(1.0, dream.generation_tokens / 2000.0) if dream.generation_tokens else 0.1
        
        # Adjust uncertainty based on depth
        score.uncertainty = min(1.0, 0.2 + (0.15 * dream.depth))
        
        return score

    def _evaluate_with_llm(self, dream: DreamObject, llm_call: Callable) -> DreamScore:
        """Evaluate using LLM. Implementation left simple for MVP."""
        # For this implementation, we just use heuristics. A real implementation
        # would format a prompt, call the LLM, and parse the scores.
        logger.info("LLM evaluation requested, but falling back to heuristic for MVP.")
        return self._evaluate_heuristic(dream)
