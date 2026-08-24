from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.services.dream.models import DreamContext
from app.services.dream.limits import DEFAULT_LIMITS

logger = logging.getLogger(__name__)

class DreamContextBuilder:
    """Builds the context bounds for a dream generation cycle."""
    
    def build(
        self,
        episodes: List[Dict[str, Any]],
        knowledge: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
        strategies: List[str],
        constraints: List[str]
    ) -> DreamContext:
        """Construct a bounded context from various sources."""
        # Respect limits
        bounded_episodes = episodes[:DEFAULT_LIMITS.max_context_episodes]
        bounded_knowledge = knowledge[:DEFAULT_LIMITS.max_context_knowledge_items]
        bounded_contradictions = contradictions[:DEFAULT_LIMITS.max_context_contradictions]
        
        context = DreamContext(
            source_episodes=bounded_episodes,
            semantic_knowledge=bounded_knowledge,
            contradictions=bounded_contradictions,
            applicable_strategies=strategies,
            known_constraints=constraints
        )
        
        # Explicitly label epistemic state
        for ep in bounded_episodes:
            ep_id = ep.get("id")
            if ep_id:
                # Episodes are typically observed facts or earlier memories
                label = ep.get("epistemic_state", "observed")
                context.label_source(ep_id, label)
                
        for kn in bounded_knowledge:
            kn_id = kn.get("id")
            if kn_id:
                label = kn.get("epistemic_state", "verified_fact")
                context.label_source(kn_id, label)
                
        for cn in bounded_contradictions:
            cn_id = cn.get("id")
            if cn_id:
                context.label_source(cn_id, "contradiction")
                
        return context
