from __future__ import annotations

from collections.abc import Iterable

import requests

from .models import GraphOperation, GraphProposal


def split_operations(operations: Iterable[GraphOperation]) -> tuple[list[GraphOperation], list[GraphOperation]]:
    node_ops: list[GraphOperation] = []
    edge_ops: list[GraphOperation] = []
    for operation in operations:
        if operation.type.endswith("node"):
            node_ops.append(operation)
        else:
            edge_ops.append(operation)
    return node_ops, edge_ops


def _headers(service_key: str) -> dict[str, str]:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }


def apply_proposal(base_url: str, service_key: str, proposal: GraphProposal) -> None:
    base = base_url.rstrip("/")
    headers = _headers(service_key)
    node_ops, edge_ops = split_operations(proposal.operations)

    for op in node_ops:
        if op.type == "create_node":
            response = requests.post(f"{base}/rest/v1/graph_nodes", headers=headers, json=op.payload, timeout=30)
            response.raise_for_status()
        elif op.type == "update_node":
            node_id = op.payload["id"]
            response = requests.patch(f"{base}/rest/v1/graph_nodes?id=eq.{node_id}", headers=headers, json=op.payload, timeout=30)
            response.raise_for_status()
        elif op.type == "delete_node":
            node_id = op.payload["id"]
            response = requests.delete(f"{base}/rest/v1/graph_nodes?id=eq.{node_id}", headers=headers, timeout=30)
            response.raise_for_status()

    for op in edge_ops:
        if op.type == "create_edge":
            response = requests.post(f"{base}/rest/v1/graph_links", headers=headers, json=op.payload, timeout=30)
            response.raise_for_status()
        elif op.type == "delete_edge":
            source = op.payload["source"]
            target = op.payload["target"]
            response = requests.delete(
                f"{base}/rest/v1/graph_links?source=eq.{source}&target=eq.{target}",
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
