from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel, Field, ValidationError


class AgentGraphSettings(BaseModel):
    supabase_url: str
    supabase_service_role_key: str
    github_repository: str = ""
    github_token: str = ""
    model_name: str = Field(default="openai:gpt-4.1-mini")
    proposal_dir: str = Field(default="/workspace/proposals")
    protected_node_ids: list[str] = Field(default_factory=lambda: ["ME"])


@lru_cache(maxsize=1)
def get_settings() -> AgentGraphSettings:
    data = {
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_service_role_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        "github_repository": os.getenv("GITHUB_REPOSITORY", ""),
        "github_token": os.getenv("GITHUB_TOKEN", ""),
        "model_name": os.getenv("AGENT_GRAPH_MODEL", "openai:gpt-4.1-mini"),
        "proposal_dir": os.getenv("PROPOSAL_DIR", "/workspace/proposals"),
        "protected_node_ids": [value for value in os.getenv("PROTECTED_NODE_IDS", "ME").split(",") if value],
    }
    try:
        return AgentGraphSettings.model_validate(data)
    except ValidationError as exc:
        raise RuntimeError(f"Invalid agent graph settings: {exc}") from exc
