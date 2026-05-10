from agent_graph.executor import split_operations
from agent_graph.models import GraphOperation


def test_split_operations_groups_node_and_edge_changes() -> None:
    operations = [
        GraphOperation(
            type="create_node",
            target_id="node-a",
            payload={"id": "A", "label": "A", "address": "/a"},
            confidence=0.9,
            reason="node",
            evidence_quotes=["A"],
            requires_manual_review=False,
        ),
        GraphOperation(
            type="create_edge",
            target_id="edge-a-b",
            payload={"source": "A", "target": "B"},
            confidence=0.8,
            reason="edge",
            evidence_quotes=["B"],
            requires_manual_review=False,
        ),
    ]

    node_ops, edge_ops = split_operations(operations)
    assert len(node_ops) == 1
    assert len(edge_ops) == 1
