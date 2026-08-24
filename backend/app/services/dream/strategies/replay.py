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

class ReplayStrategy(DreamStrategy):
    """Replays source episodes as-is with minimal transformation."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.REPLAY

    async def generate(
        self,
        context: DreamContext,
        parent: Optional[DreamObject] = None,
        llm_call: Optional[Any] = None,
        agent_id: Optional[str] = None,
    ) -> List[DreamObject]:
        try:
            dream = self._make_dream(context, parent, agent_id)
            dream.epistemic_state = EpistemicState.SYNTHETIC
            dream.assumptions = ["Replayed episode exactly as it occurred"]
            
            if llm_call and context.source_episodes:
                prompt = f"Replay and extract key actions, observations, and outcome from these episodes: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Replay: {response}"
                dream.actions = ["Extracted actions via LLM"]
                dream.observations = ["Extracted observations via LLM"]
            else:
                dream.actions = [str(ep.get("action", "")) for ep in context.source_episodes]
                dream.observations = [str(ep.get("observation", "")) for ep in context.source_episodes]
                dream.outcome = "Replayed source episodes exactly as they occurred."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"ReplayStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
