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

class FusionStrategy(DreamStrategy):
    """Combines two or more apparently unrelated episodes."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.FUSION

    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        try:
            dream = self._make_dream(context, parent, agent_id)
            dream.epistemic_state = EpistemicState.FUSED
            dream.assumptions = ["Connections exist between these episodes"]
            
            if llm_call and len(context.source_episodes) >= 2:
                prompt = f"Combine these apparently unrelated episodes and find connections: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Fused: {response}"
                dream.actions = ["Synthesized fused action"]
                dream.observations = ["Synthesized fused observation"]
            else:
                dream.actions = ["Template fusion action"]
                dream.observations = ["Template fusion observation"]
                dream.outcome = "Template fused outcome from multiple episodes."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"FusionStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
