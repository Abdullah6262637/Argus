import logging
import json
from typing import Any, List, Optional

from app.services.dream.models import (
    DreamContext,
    DreamObject,
    DreamStatus,
    EpistemicState,
    GenerationMethod,
)
from app.services.dream.strategies.base import DreamStrategy

logger = logging.getLogger(__name__)

class AnalogyStrategy(DreamStrategy):
    """Finds similar patterns across different domains/experiences."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.ANALOGY

    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        try:
            dream = self._make_dream(context, parent, agent_id)
            dream.epistemic_state = EpistemicState.ANALOGICAL
            
            if llm_call and context.source_episodes:
                prompt = f"Find analogous patterns for these episodes from another domain and transfer insights: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Analogy: {response}"
                dream.assumptions = ["Rules from the analogous domain apply here"]
                dream.modified_variables = {"domain": "transferred"}
            else:
                dream.modified_variables = {"domain": "analogous_domain"}
                dream.assumptions = ["Isomorphic structural properties hold between domains"]
                dream.actions = ["Analogous action"]
                dream.observations = ["Analogous observation"]
                dream.outcome = "Template analogous outcome."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"AnalogyStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
