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

class CounterfactualStrategy(DreamStrategy):
    """Generates counterfactual scenarios from source episodes."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.COUNTERFACTUAL

    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        try:
            dream = self._make_dream(context, parent, agent_id)
            dream.epistemic_state = EpistemicState.COUNTERFACTUAL
            
            if llm_call and context.source_episodes:
                prompt = f"Generate a counterfactual scenario ('What if X had not happened?') for these episodes: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Counterfactual: {response}"
                dream.modified_variables = {"event_occurred": False}
                dream.assumptions = ["The alternate timeline follows logical rules"]
            else:
                dream.modified_variables = {"critical_event": "omitted"}
                dream.assumptions = ["Omission of critical event changes outcome entirely"]
                dream.actions = ["Alternative action taken"]
                dream.observations = ["Alternative observation seen"]
                dream.outcome = "Template counterfactual outcome."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"CounterfactualStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
