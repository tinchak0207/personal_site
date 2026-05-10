from pydantic import ValidationError

from agent_graph.models import GraphOperation, GraphProposal


def test_graph_proposal_accepts_create_node_operation() -> None:
    proposal = GraphProposal(
        proposal_id="graph-2026-05-10-030000",
        source_refs=["post:test-slug"],
        summary="发现 1 个候选节点",
        risk_level="low",
        wechat_message="已提交候选关系。",
        operations=[
            GraphOperation(
                type="create_node",
                target_id="node-autonomy",
                payload={"label": "自治", "address": "/concepts/autonomy"},
                confidence=0.92,
                reason="新文章引入稳定概念",
                evidence_quotes=["自治并不是自由放任。"],
                requires_manual_review=False,
            )
        ],
    )

    assert proposal.operations[0].type == "create_node"
    assert proposal.operations[0].confidence == 0.92


def test_graph_operation_rejects_invalid_confidence() -> None:
    try:
        GraphOperation(
            type="create_edge",
            target_id="edge-a-b",
            payload={"source": "A", "target": "B"},
            confidence=1.5,
            reason="bad",
            evidence_quotes=["x"],
            requires_manual_review=True,
        )
    except ValidationError:
        assert True
    else:
        assert False, "expected ValidationError"
