from __future__ import annotations

import logging
from typing import Any, Callable, Dict, List, Optional

from app.services.dream.models import DreamObject, DreamStatus
from app.services.dream.limits import DEFAULT_LIMITS
from app.services.dream.strategies.base import StrategyRegistry

from app.services.dream.scheduler import DreamScheduler
from app.services.dream.context import DreamContextBuilder
from app.services.dream.critic import DreamCritic
from app.services.dream.deduplication import DreamDeduplicator
from app.services.dream.recursion import RecursionManager

logger = logging.getLogger(__name__)

class DreamEngine:
    """Main orchestrator for the Argus Recursive Dream Engine."""
    
    def __init__(self, registry: StrategyRegistry):
        self.registry = registry
        self.scheduler = DreamScheduler()
        self.context_builder = DreamContextBuilder()
        self.critic = DreamCritic()
        self.deduplicator = DreamDeduplicator()
        
    async def run_cycle(
        self,
        episodes: List[Dict[str, Any]],
        knowledge: List[Dict[str, Any]],
        contradictions: List[Dict[str, Any]],
        llm_call: Optional[Callable] = None,
        agent_id: Optional[str] = None
    ) -> List[DreamObject]:
        """Execute a full dreaming cycle."""
        logger.info(f"Starting dream cycle for agent {agent_id}")
        
        recursion = RecursionManager()
        all_generated_dreams: List[DreamObject] = []
        candidates: List[DreamObject] = []
        
        # 1. Schedule top episodes
        selected_episodes = self.scheduler.select_episodes(
            episodes,
            limit=DEFAULT_LIMITS.max_episodes_to_consider
        )
        
        if not selected_episodes:
            logger.info("No episodes selected for dreaming.")
            return []
            
        available_strats = [m.value for m in self.registry.available_methods()]
        
        # 2. Build context
        context = self.context_builder.build(
            episodes=selected_episodes,
            knowledge=knowledge,
            contradictions=contradictions,
            strategies=available_strats,
            constraints=["preserve reality"]
        )
        
        # Base BFS queue
        queue: List[Optional[DreamObject]] = [None]  # None represents root context
        
        while queue and not recursion.should_terminate():
            current_parent = queue.pop(0)
            
            # Select strategies to try
            strategies = self.registry.all()
            
            for strategy in strategies:
                if recursion.should_terminate():
                    break
                    
                if current_parent and not recursion.can_recurse(current_parent):
                    continue
                
                try:
                    # 3. Generate
                    dreams = await strategy.generate(
                        context=context,
                        parent=current_parent,
                        llm_call=llm_call,
                        agent_id=agent_id
                    )
                    
                    for d in dreams:
                        d.status = DreamStatus.GENERATED
                        
                        # 4. Critique
                        d.score = self.critic.evaluate(d, llm_call)
                        d.status = DreamStatus.EVALUATED
                        
                        recursion.track(d)
                        all_generated_dreams.append(d)
                        
                        # Only branch off high-value dreams
                        if d.score.composite_value >= DEFAULT_LIMITS.min_composite_value:
                            d.status = DreamStatus.CANDIDATE
                            candidates.append(d)
                            queue.append(d)
                        else:
                            d.status = DreamStatus.REJECTED
                            
                except Exception as e:
                    logger.error(f"Strategy {strategy.name} failed: {e}")
                    
        # 5. Deduplicate candidates
        deduplicated = self.deduplicator.deduplicate(
            candidates,
            threshold=DEFAULT_LIMITS.dedup_similarity_threshold
        )
        
        for d in deduplicated:
            d.status = DreamStatus.CANDIDATE
            
        logger.info(f"Cycle complete. Generated {len(all_generated_dreams)} dreams, "
                    f"yielded {len(deduplicated)} candidates.")
                    
        return deduplicated
