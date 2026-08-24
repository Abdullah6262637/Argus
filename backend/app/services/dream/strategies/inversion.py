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

class InversionStrategy(DreamStrategy):
    """Takes a failed strategy and inverts it (opposite approach)."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.INVERSION

    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        try:
            dream = self._make_dream(context, parent, agent_id)
            dream.epistemic_state = EpistemicState.SPECULATIVE
            
            if llm_call and context.source_episodes:
                prompt = f"Take this failed strategy/episode and invert the approach: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Inverted: {response}"
                dream.assumptions = ["The opposite approach will yield a different, perhaps successful, outcome"]
                dream.modified_variables = {"approach": "inverted", "polarity": "reversed"}
            else:
                dream.modified_variables = {"direction": "opposite"}
                dream.assumptions = ["Doing the exact opposite avoids the failure mode"]
                dream.actions = ["Inverted action"]
                dream.observations = ["Inverted observation"]
                dream.outcome = "Template inverted outcome."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"InversionStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
