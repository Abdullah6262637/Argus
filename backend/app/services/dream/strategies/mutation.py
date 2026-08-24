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

class MutationStrategy(DreamStrategy):
    """Takes source episodes and mutates one or more variables."""
    
    @property
    def method(self) -> GenerationMethod:
        return GenerationMethod.MUTATION

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
                prompt = f"Mutate one or more variables in these episodes and predict outcome: {json.dumps(context.source_episodes)}"
                response = await llm_call(prompt)
                dream.outcome = f"Mutated: {response}"
                dream.modified_variables = {"llm_mutation": True}
                dream.assumptions = ["Mutated variable behaves predictably"]
            else:
                dream.modified_variables = {"timing": "delayed", "parameter_x": "increased"}
                dream.assumptions = ["Timing delays cause linear outcome shifts"]
                dream.actions = ["Mutated action"]
                dream.observations = ["Mutated observation"]
                dream.outcome = "Template mutated outcome."

            dream.status = DreamStatus.GENERATED
            return [dream]
        except Exception as e:
            logger.error(f"MutationStrategy generation failed: {e}")
            error_dream = self._make_dream(context, parent, agent_id)
            error_dream.status = DreamStatus.ERROR
            error_dream.error_message = str(e)
            return [error_dream]
