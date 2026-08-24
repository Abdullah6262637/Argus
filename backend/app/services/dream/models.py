"""Dream Engine — Data models, enums, and type definitions.

Every dream maintains durable identity, provenance, and epistemic state.
A dream is NEVER an authoritative fact. Its classification remains
explicitly synthetic/speculative.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class DreamStatus(str, Enum):
    """Lifecycle states for a dream."""
    PENDING = "pending"          # Scheduled but not yet generated
    GENERATING = "generating"    # Currently being generated
    GENERATED = "generated"      # Generation complete, awaiting critique
    EVALUATED = "evaluated"      # Critic scores assigned
    CLUSTERED = "clustered"      # Grouped with semantically similar dreams
    CANDIDATE = "candidate"      # Promoted to candidate hypothesis
    REJECTED = "rejected"        # Failed critic thresholds
    CANCELLED = "cancelled"      # Cancelled due to resource limits
    ERROR = "error"              # Generation failed with error


class EpistemicState(str, Enum):
    """Epistemic classification — strict separation from verified knowledge."""
    SYNTHETIC = "synthetic"          # Machine-generated, no real-world evidence
    SPECULATIVE = "speculative"      # Based on real data but with assumptions
    COUNTERFACTUAL = "counterfactual" # Explicitly alternative to observed reality
    ANALOGICAL = "analogical"        # Transferred from another domain
    FUSED = "fused"                  # Combined from multiple sources


class GenerationMethod(str, Enum):
    """How the dream was generated."""
    REPLAY = "replay"
    MUTATION = "mutation"
    COUNTERFACTUAL = "counterfactual"
    FUSION = "fusion"
    INVERSION = "inversion"
    ANALOGY = "analogy"


@dataclass
class DreamScore:
    """Multi-dimensional evaluation scores for a dream."""
    novelty: float = 0.0           # How new/unexpected is this insight?
    utility: float = 0.0           # How useful would this be if true?
    plausibility: float = 0.0      # How likely is this to be correct?
    uncertainty: float = 1.0       # How uncertain are we?
    risk: float = 0.0              # What's the risk of acting on this?
    contradiction: float = 0.0     # Does it contradict known facts?
    evidence_quality: float = 0.0  # Quality of source evidence
    compute_cost: float = 0.0      # Normalized compute cost (0-1)

    @property
    def composite_value(self) -> float:
        """Compute validated_discovery / compute metric.

        Higher is better. Optimizes for discovery-per-compute,
        not raw dream count.
        """
        raw_value = (
            self.novelty * 0.25
            + self.utility * 0.30
            + self.plausibility * 0.25
            + self.evidence_quality * 0.20
        )
        risk_penalty = self.risk * 0.3
        contradiction_penalty = self.contradiction * 0.4
        uncertainty_discount = 1.0 - (self.uncertainty * 0.2)
        adjusted = (raw_value - risk_penalty - contradiction_penalty) * uncertainty_discount
        cost_divisor = max(self.compute_cost, 0.01)
        return max(adjusted / cost_divisor, 0.0)


@dataclass
class SchedulerSignals:
    """Signals used by the Dream Scheduler to prioritize memories."""
    surprise: float = 0.0          # How unexpected was the outcome?
    failure: float = 0.0           # Did the experience fail?
    uncertainty: float = 0.0       # How uncertain is the outcome?
    novelty: float = 0.0           # How new is this type of experience?
    contradiction: float = 0.0     # Does it conflict with existing knowledge?
    importance: float = 0.0        # How important is the domain?
    knowledge_gap: float = 0.0     # Does it reveal missing knowledge?
    transfer_potential: float = 0.0 # Can insights transfer to other domains?
    recency: float = 0.0           # How recent is the experience?
    expected_info_gain: float = 0.0 # Expected information gain from dreaming

    @property
    def composite_priority(self) -> float:
        """Weighted priority score for dream scheduling."""
        return (
            self.surprise * 0.15
            + self.failure * 0.15
            + self.uncertainty * 0.10
            + self.novelty * 0.10
            + self.contradiction * 0.15
            + self.importance * 0.10
            + self.knowledge_gap * 0.10
            + self.transfer_potential * 0.05
            + self.recency * 0.05
            + self.expected_info_gain * 0.05
        )


@dataclass
class DreamContext:
    """Bounded context provided to dream generation strategies."""
    source_episodes: List[Dict[str, Any]] = field(default_factory=list)
    semantic_knowledge: List[Dict[str, Any]] = field(default_factory=list)
    contradictions: List[Dict[str, Any]] = field(default_factory=list)
    applicable_strategies: List[str] = field(default_factory=list)
    known_constraints: List[str] = field(default_factory=list)
    provenance: Dict[str, Any] = field(default_factory=dict)
    epistemic_states: Dict[str, str] = field(default_factory=dict)

    def label_source(self, source_id: str, label: str) -> None:
        """Explicitly label a source's epistemic state."""
        self.epistemic_states[source_id] = label


@dataclass
class DreamObject:
    """Core dream entity with durable identity and full provenance.

    A dream is NEVER an authoritative fact.
    """
    dream_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_dream_id: Optional[str] = None
    source_episode_ids: List[str] = field(default_factory=list)
    generation_method: GenerationMethod = GenerationMethod.REPLAY
    context: DreamContext = field(default_factory=DreamContext)
    assumptions: List[str] = field(default_factory=list)
    modified_variables: Dict[str, Any] = field(default_factory=dict)
    actions: List[str] = field(default_factory=list)
    observations: List[str] = field(default_factory=list)
    outcome: str = ""
    score: DreamScore = field(default_factory=DreamScore)
    status: DreamStatus = DreamStatus.PENDING
    epistemic_state: EpistemicState = EpistemicState.SYNTHETIC
    depth: int = 0
    branch_index: int = 0
    generation_tokens: int = 0
    generation_time_ms: float = 0.0
    error_message: Optional[str] = None
    cluster_id: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    agent_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary for persistence."""
        return {
            "dream_id": self.dream_id,
            "parent_dream_id": self.parent_dream_id,
            "source_episode_ids": self.source_episode_ids,
            "generation_method": self.generation_method.value,
            "assumptions": self.assumptions,
            "modified_variables": self.modified_variables,
            "actions": self.actions,
            "observations": self.observations,
            "outcome": self.outcome,
            "score": {
                "novelty": self.score.novelty,
                "utility": self.score.utility,
                "plausibility": self.score.plausibility,
                "uncertainty": self.score.uncertainty,
                "risk": self.score.risk,
                "contradiction": self.score.contradiction,
                "evidence_quality": self.score.evidence_quality,
                "compute_cost": self.score.compute_cost,
                "composite_value": self.score.composite_value,
            },
            "status": self.status.value,
            "epistemic_state": self.epistemic_state.value,
            "depth": self.depth,
            "branch_index": self.branch_index,
            "generation_tokens": self.generation_tokens,
            "generation_time_ms": self.generation_time_ms,
            "error_message": self.error_message,
            "cluster_id": self.cluster_id,
            "created_at": self.created_at.isoformat(),
            "agent_id": self.agent_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DreamObject":
        """Deserialize from dictionary."""
        score_data = data.get("score", {})
        score = DreamScore(
            novelty=score_data.get("novelty", 0.0),
            utility=score_data.get("utility", 0.0),
            plausibility=score_data.get("plausibility", 0.0),
            uncertainty=score_data.get("uncertainty", 1.0),
            risk=score_data.get("risk", 0.0),
            contradiction=score_data.get("contradiction", 0.0),
            evidence_quality=score_data.get("evidence_quality", 0.0),
            compute_cost=score_data.get("compute_cost", 0.0),
        )
        created_at_raw = data.get("created_at")
        created_at = (
            datetime.fromisoformat(created_at_raw)
            if isinstance(created_at_raw, str)
            else datetime.now(UTC)
        )
        return cls(
            dream_id=data.get("dream_id", str(uuid.uuid4())),
            parent_dream_id=data.get("parent_dream_id"),
            source_episode_ids=data.get("source_episode_ids", []),
            generation_method=GenerationMethod(data.get("generation_method", "replay")),
            assumptions=data.get("assumptions", []),
            modified_variables=data.get("modified_variables", {}),
            actions=data.get("actions", []),
            observations=data.get("observations", []),
            outcome=data.get("outcome", ""),
            score=score,
            status=DreamStatus(data.get("status", "pending")),
            epistemic_state=EpistemicState(data.get("epistemic_state", "synthetic")),
            depth=data.get("depth", 0),
            branch_index=data.get("branch_index", 0),
            generation_tokens=data.get("generation_tokens", 0),
            generation_time_ms=data.get("generation_time_ms", 0.0),
            error_message=data.get("error_message"),
            cluster_id=data.get("cluster_id"),
            created_at=created_at,
            agent_id=data.get("agent_id"),
        )
