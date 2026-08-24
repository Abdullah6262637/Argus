from __future__ import annotations

import logging
from typing import List, Set

from app.services.dream.models import DreamObject

logger = logging.getLogger(__name__)

class DreamDeduplicator:
    """Finds and clusters semantically similar dreams."""
    
    def deduplicate(self, dreams: List[DreamObject], threshold: float) -> List[DreamObject]:
        """Group similar dreams and return a representative set."""
        if not dreams:
            return []
            
        representatives: List[DreamObject] = []
        
        for dream in dreams:
            is_duplicate = False
            for rep in representatives:
                if self._is_similar(dream, rep, threshold):
                    is_duplicate = True
                    # Cluster them, keep rep as the main one
                    dream.cluster_id = rep.dream_id
                    rep.cluster_id = rep.dream_id # Ensure rep has cluster ID set
                    break
            
            if not is_duplicate:
                representatives.append(dream)
                
        return representatives
        
    def _is_similar(self, a: DreamObject, b: DreamObject, threshold: float) -> bool:
        """Check semantic and structural similarity."""
        # Structural check
        if a.generation_method != b.generation_method:
            return False
            
        a_vars = set(a.modified_variables.keys())
        b_vars = set(b.modified_variables.keys())
        if a_vars != b_vars:
            # If they modify different variables, they aren't duplicates
            if a_vars or b_vars:
                return False
                
        # Semantic text similarity via basic Jaccard index
        a_text = set(" ".join(a.actions + a.observations + [a.outcome]).lower().split())
        b_text = set(" ".join(b.actions + b.observations + [b.outcome]).lower().split())
        
        if not a_text and not b_text:
            return True
        if not a_text or not b_text:
            return False
            
        intersection = len(a_text.intersection(b_text))
        union = len(a_text.union(b_text))
        
        similarity = intersection / union
        return similarity >= threshold
