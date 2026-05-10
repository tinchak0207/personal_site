from __future__ import annotations

import json
from datetime import UTC, datetime

from pydantic_ai import Agent

from .models import GenerationResult, GraphContextSnapshot, GraphOperation, GraphProposal, RiskLevel
from .prompts import SYSTEM_PROMPT, build_generation_prompt


def build_proposal_id() -> str:
    return datetime.now(UTC).strftime("graph-%Y-%m-%d-%H%M%S")


def build_agent(model_name: str) -> Agent[None, GraphProposal]:
    return Agent(
        model_name,
        output_type=GraphProposal,
        system_prompt=SYSTEM_PROMPT,
    )


def _fallback_proposal(snapshot: GraphContextSnapshot) -> GraphProposal:
    article_refs = [f"{article.source_type}:{article.slug or article.source_id}" for article in snapshot.articles[:3]]
    return GraphProposal(
        proposal_id=build_proposal_id(),
        source_refs=article_refs,
        summary="未发现足够明确的新图谱变更，生成空提案供后续 workflow 使用。",
        risk_level=RiskLevel.low,
        wechat_message="昨晚整理了一轮，没有发现需要立即写入的强关系。",
        operations=[],
    )


def generate_proposal(snapshot: GraphContextSnapshot, model_name: str | None = None) -> GenerationResult:
    if not snapshot.articles:
        proposal = _fallback_proposal(snapshot)
        return GenerationResult(proposal=proposal, prompt_excerpt="empty snapshot")

    prompt = build_generation_prompt(snapshot.model_dump_json(indent=2, ensure_ascii=False))

    agent = build_agent(model_name or "openai:gpt-4.1-mini")

    try:
        result = agent.run_sync(prompt)
        proposal = result.output
        if not proposal.proposal_id:
            proposal.proposal_id = build_proposal_id()
        return GenerationResult(proposal=proposal, prompt_excerpt=prompt[:500])
    except Exception:
        proposal = _fallback_proposal(snapshot)
        if snapshot.articles:
            first = snapshot.articles[0]
            snippet = (first.content or first.title)[:160]
            proposal.operations = [
                GraphOperation(
                    type="create_node",
                    target_id=f"candidate-{(first.slug or first.source_id).replace(' ', '-')}"[:80],
                    payload={
                        "id": f"AUTO_{(first.slug or first.source_id).replace('-', '_').upper()}"[:48],
                        "label": first.title[:80],
                        "address": f"AUTO_{(first.slug or first.source_id).replace('-', '_').upper()}"[:80],
                        "group_type": "node",
                        "radius": 5,
                    },
                    confidence=0.35,
                    reason="LLM 当前不可用，保留一条低置信候选节点作为人工后续调整入口。",
                    evidence_quotes=[snippet] if snippet else [],
                    requires_manual_review=True,
                )
            ]
            proposal.summary = "LLM 不可用，生成了一个低置信候选节点提案。"
            proposal.risk_level = RiskLevel.medium
        return GenerationResult(proposal=proposal, prompt_excerpt=prompt[:500])
