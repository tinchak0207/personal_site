from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


OperationType = Literal[
    "create_node",
    "update_node",
    "delete_node",
    "create_edge",
    "delete_edge",
    "reweight_edge",
]


class GraphOperation(BaseModel):
    type: OperationType
    target_id: str
    payload: dict[str, Any]
    confidence: float = Field(ge=0.0, le=1.0)
    reason: str
    evidence_quotes: list[str] = Field(default_factory=list)
    requires_manual_review: bool = False


class GraphProposal(BaseModel):
    proposal_id: str
    source_refs: list[str] = Field(default_factory=list)
    summary: str
    risk_level: RiskLevel
    wechat_message: str
    operations: list[GraphOperation] = Field(default_factory=list)


class ArticleSnapshot(BaseModel):
    source_type: Literal["post", "project", "external_link"]
    source_id: str
    title: str
    slug: str | None = None
    content: str = ""
    tags: list[str] = Field(default_factory=list)


class GraphContextSnapshot(BaseModel):
    articles: list[ArticleSnapshot] = Field(default_factory=list)
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class GenerationResult(BaseModel):
    proposal: GraphProposal
    prompt_excerpt: str


class ApprovalCommand(BaseModel):
    raw_text: str
    pull_number: int | None = None

    @model_validator(mode="after")
    def validate_pull_number(self) -> "ApprovalCommand":
        if self.pull_number is not None and self.pull_number <= 0:
            raise ValueError("pull_number must be positive")
        return self
