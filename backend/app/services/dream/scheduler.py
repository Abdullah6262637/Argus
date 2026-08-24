from __future__ import annotations

import logging
from typing import Dict, List

from app.services.dream.models import SchedulerSignals
from app.services.dream.limits import DEFAULT_LIMITS

logger = logging.getLogger(__name__)

class DreamScheduler:
    """Scores and prioritizes memory episodes for dreaming."""
    
    def score_episode(self, episode: Dict) -> SchedulerSignals:
        """Score a memory episode using heuristic signals."""
        signals = SchedulerSignals()
        
        # Example heuristic scoring based on simple content properties
        # This is purely deterministic. No LLM calls.
        content = str(episode.get("content", "")).lower()
        metadata = episode.get("metadata", {})
        
        # Surprise/Failure/Uncertainty detection
        if any(w in content for w in ["unexpected", "surprised", "suddenly"]):
            signals.surprise = 0.8
        if any(w in content for w in ["failed", "error", "mistake", "crash"]):
            signals.failure = 0.9
        if any(w in content for w in ["maybe", "unsure", "unclear", "unknown"]):
            signals.uncertainty = 0.7
            
        # Importance from metadata or text
        importance_score = float(metadata.get("importance", 0.0))
        if importance_score > 0:
            signals.importance = min(1.0, importance_score)
        elif any(w in content for w in ["critical", "crucial", "important"]):
            signals.importance = 0.8
            
        # Contradiction hints
        if any(w in content for w in ["but", "however", "contradicts", "despite"]):
            signals.contradiction = 0.6
            
        # Knowledge gap / transfer potential
        if "why" in content or "how" in content:
            signals.knowledge_gap = 0.5
        if "similar to" in content or "like" in content:
            signals.transfer_potential = 0.6
            
        # Novelty based on simple length or metadata novelty flags
        signals.novelty = float(metadata.get("novelty", 0.3))
        
        return signals

    def select_episodes(self, episodes: List[Dict], limit: int) -> List[Dict]:
        """Select top episodes by composite priority."""
        scored_episodes = []
        for ep in episodes:
            signals = self.score_episode(ep)
            priority = signals.composite_priority
            if priority >= DEFAULT_LIMITS.min_priority_score:
                scored_episodes.append((priority, ep))
                
        # Sort descending by priority
        scored_episodes.sort(key=lambda x: x[0], reverse=True)
        return [ep for _, ep in scored_episodes[:limit]]
