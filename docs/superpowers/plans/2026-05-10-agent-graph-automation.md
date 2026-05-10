# Agent 图谱自动化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有站点新增一套基于 PydanticAI 的图谱提案引擎、GitHub PR 自动化、Cloudflare 审批入口与 Supabase 执行器。

**Architecture:** 在仓库内新增一个独立的 Python 自动化子项目，负责读取内容与图谱上下文、输出 proposal JSON、创建 PR、在 merge 后执行落库。审批入口单独放在 `workers/approval-worker`，通过轻量 HTTP API 接收微信桥转发的批准命令并调用 GitHub merge API。

**Tech Stack:** Python 3.11+, PydanticAI, Supabase REST, GitHub Actions, Cloudflare Workers, TypeScript

---

## File Structure

- Create: `automation/agent_graph/pyproject.toml`
- Create: `automation/agent_graph/src/agent_graph/__init__.py`
- Create: `automation/agent_graph/src/agent_graph/config.py`
- Create: `automation/agent_graph/src/agent_graph/models.py`
- Create: `automation/agent_graph/src/agent_graph/context_loader.py`
- Create: `automation/agent_graph/src/agent_graph/prompts.py`
- Create: `automation/agent_graph/src/agent_graph/service.py`
- Create: `automation/agent_graph/src/agent_graph/proposal_io.py`
- Create: `automation/agent_graph/src/agent_graph/github_client.py`
- Create: `automation/agent_graph/src/agent_graph/executor.py`
- Create: `automation/agent_graph/src/agent_graph/cli.py`
- Create: `automation/agent_graph/tests/test_models.py`
- Create: `automation/agent_graph/tests/test_executor.py`
- Create: `.github/workflows/graph-proposal.yml`
- Create: `.github/workflows/graph-apply.yml`
- Create: `workers/approval-worker/package.json`
- Create: `workers/approval-worker/tsconfig.json`
- Create: `workers/approval-worker/wrangler.toml`
- Create: `workers/approval-worker/src/index.ts`
- Create: `docs/agent-ops/README.md`

### Task 1: 搭建 Python 自动化子项目

**Files:**
- Create: `automation/agent_graph/pyproject.toml`
- Create: `automation/agent_graph/src/agent_graph/__init__.py`
- Create: `automation/agent_graph/src/agent_graph/config.py`
- Create: `automation/agent_graph/src/agent_graph/models.py`
- Test: `automation/agent_graph/tests/test_models.py`

- [ ] **Step 1: 写 proposal schema 的失败测试**

```python
from pydantic import ValidationError

from agent_graph.models import GraphProposal, GraphOperation


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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /workspace/automation/agent_graph && python -m pytest tests/test_models.py -v`  
Expected: FAIL，因为 `agent_graph.models` 尚不存在。

- [ ] **Step 3: 写最小实现**

```python
from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


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
    evidence_quotes: list[str]
    requires_manual_review: bool


class GraphProposal(BaseModel):
    proposal_id: str
    source_refs: list[str]
    summary: str
    risk_level: RiskLevel
    wechat_message: str
    operations: list[GraphOperation]
```

- [ ] **Step 4: 写配置对象**

```python
from pydantic import BaseModel, Field


class AgentGraphSettings(BaseModel):
    supabase_url: str
    supabase_service_role_key: str
    github_repository: str
    github_token: str
    proposal_dir: str = Field(default="proposals")
    protected_node_ids: list[str] = Field(default_factory=lambda: ["ME"])
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd /workspace/automation/agent_graph && python -m pytest tests/test_models.py -v`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add automation/agent_graph/pyproject.toml automation/agent_graph/src/agent_graph/__init__.py automation/agent_graph/src/agent_graph/config.py automation/agent_graph/src/agent_graph/models.py automation/agent_graph/tests/test_models.py
git commit -m "feat: add graph proposal schema"
```

### Task 2: 实现上下文读取、Agent 服务与 proposal 写盘

**Files:**
- Create: `automation/agent_graph/src/agent_graph/context_loader.py`
- Create: `automation/agent_graph/src/agent_graph/prompts.py`
- Create: `automation/agent_graph/src/agent_graph/service.py`
- Create: `automation/agent_graph/src/agent_graph/proposal_io.py`
- Create: `automation/agent_graph/src/agent_graph/cli.py`
- Modify: `automation/agent_graph/src/agent_graph/models.py`

- [ ] **Step 1: 补一个上下文快照构造测试**

```python
from agent_graph.models import ArticleSnapshot, GraphContextSnapshot


def test_graph_context_snapshot_keeps_articles_nodes_and_edges() -> None:
    snapshot = GraphContextSnapshot(
        articles=[
            ArticleSnapshot(
                source_type="post",
                source_id="post-1",
                title="自治与秩序",
                slug="autonomy-order",
                content="自治不是空洞口号。",
                tags=["自治"],
            )
        ],
        nodes=[{"id": "ME", "label": "tinchak0207"}],
        edges=[{"source": "ME", "target": "AI"}],
    )

    assert snapshot.articles[0].slug == "autonomy-order"
    assert snapshot.nodes[0]["id"] == "ME"
```

- [ ] **Step 2: 扩展模型并实现上下文读取器**

```python
class ArticleSnapshot(BaseModel):
    source_type: Literal["post", "project", "external_link"]
    source_id: str
    title: str
    slug: str | None = None
    content: str = ""
    tags: list[str] = Field(default_factory=list)


class GraphContextSnapshot(BaseModel):
    articles: list[ArticleSnapshot]
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
```

```python
import requests

from agent_graph.models import ArticleSnapshot, GraphContextSnapshot


def build_context_snapshot(base_url: str, service_key: str) -> GraphContextSnapshot:
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }
    posts = requests.get(f"{base_url}/rest/v1/posts?select=id,title,slug,content,tags", headers=headers, timeout=30).json()
    nodes = requests.get(f"{base_url}/rest/v1/graph_nodes?select=id,label,address,group_type,radius", headers=headers, timeout=30).json()
    edges = requests.get(f"{base_url}/rest/v1/graph_links?select=id,source,target", headers=headers, timeout=30).json()

    articles = [
        ArticleSnapshot(
            source_type="post",
            source_id=row["id"],
            title=row["title"],
            slug=row.get("slug"),
            content=row.get("content") or "",
            tags=row.get("tags") or [],
        )
        for row in posts
    ]

    return GraphContextSnapshot(articles=articles, nodes=nodes, edges=edges)
```

- [ ] **Step 3: 写最小 Agent 服务**

```python
from pydantic_ai import Agent

from agent_graph.models import GraphProposal
from agent_graph.prompts import SYSTEM_PROMPT


proposal_agent = Agent(
    "openai:gpt-4.1-mini",
    output_type=GraphProposal,
    system_prompt=SYSTEM_PROMPT,
)
```

```python
from datetime import UTC, datetime
from pathlib import Path

from agent_graph.models import GraphProposal


def write_proposal(base_dir: str, proposal: GraphProposal) -> Path:
    proposal_dir = Path(base_dir)
    proposal_dir.mkdir(parents=True, exist_ok=True)
    path = proposal_dir / f"{proposal.proposal_id}.json"
    path.write_text(proposal.model_dump_json(indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path


def build_proposal_id() -> str:
    return datetime.now(UTC).strftime("graph-%Y-%m-%d-%H%M%S")
```

- [ ] **Step 4: 写 CLI 入口**

```python
import argparse

from agent_graph.config import AgentGraphSettings
from agent_graph.context_loader import build_context_snapshot


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="proposals")
    args = parser.parse_args()
    settings = AgentGraphSettings.model_validate_json("{}")
    snapshot = build_context_snapshot(settings.supabase_url, settings.supabase_service_role_key)
    print(f"loaded {len(snapshot.articles)} articles")
```

- [ ] **Step 5: 运行最小冒烟检查**

Run: `cd /workspace/automation/agent_graph && python -m agent_graph.cli --output-dir /tmp/proposals`  
Expected: 输出已加载的文章数量，且无 import error。

- [ ] **Step 6: Commit**

```bash
git add automation/agent_graph/src/agent_graph/context_loader.py automation/agent_graph/src/agent_graph/prompts.py automation/agent_graph/src/agent_graph/service.py automation/agent_graph/src/agent_graph/proposal_io.py automation/agent_graph/src/agent_graph/cli.py automation/agent_graph/src/agent_graph/models.py
git commit -m "feat: add agent context loading and proposal generation"
```

### Task 3: 实现 proposal 执行器与 Supabase 落库

**Files:**
- Create: `automation/agent_graph/src/agent_graph/executor.py`
- Test: `automation/agent_graph/tests/test_executor.py`

- [ ] **Step 1: 写执行器测试**

```python
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
```

- [ ] **Step 2: 写最小执行器**

```python
from collections.abc import Iterable

from agent_graph.models import GraphOperation, GraphProposal


def split_operations(operations: Iterable[GraphOperation]) -> tuple[list[GraphOperation], list[GraphOperation]]:
    node_ops: list[GraphOperation] = []
    edge_ops: list[GraphOperation] = []
    for operation in operations:
        if operation.type.endswith("node"):
            node_ops.append(operation)
        else:
            edge_ops.append(operation)
    return node_ops, edge_ops
```

```python
import requests


def apply_proposal(base_url: str, service_key: str, proposal: GraphProposal) -> None:
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    node_ops, edge_ops = split_operations(proposal.operations)

    for op in node_ops:
        if op.type == "create_node":
            requests.post(f"{base_url}/rest/v1/graph_nodes", headers=headers, json=op.payload, timeout=30).raise_for_status()
        elif op.type == "update_node":
            requests.patch(
                f"{base_url}/rest/v1/graph_nodes?id=eq.{op.payload['id']}",
                headers=headers,
                json=op.payload,
                timeout=30,
            ).raise_for_status()

    for op in edge_ops:
        if op.type == "create_edge":
            requests.post(f"{base_url}/rest/v1/graph_links", headers=headers, json=op.payload, timeout=30).raise_for_status()
```

- [ ] **Step 3: 运行测试**

Run: `cd /workspace/automation/agent_graph && python -m pytest tests/test_executor.py -v`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add automation/agent_graph/src/agent_graph/executor.py automation/agent_graph/tests/test_executor.py
git commit -m "feat: add proposal executor"
```

### Task 4: 接 GitHub Actions 自动创建 proposal PR 与 merge 后执行

**Files:**
- Create: `.github/workflows/graph-proposal.yml`
- Create: `.github/workflows/graph-apply.yml`
- Modify: `automation/agent_graph/src/agent_graph/cli.py`
- Create: `automation/agent_graph/src/agent_graph/github_client.py`

- [ ] **Step 1: 给 CLI 增加两种命令**

```python
subparsers = parser.add_subparsers(dest="command", required=True)
subparsers.add_parser("generate-proposal")
subparsers.add_parser("apply-proposal")
```

- [ ] **Step 2: 写 proposal workflow**

```yaml
name: Generate Graph Proposal

on:
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * *"

jobs:
  propose:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install agent dependencies
        run: |
          cd automation/agent_graph
          python -m pip install -e .
      - name: Generate proposal
        run: |
          cd automation/agent_graph
          python -m agent_graph.cli generate-proposal --output-dir ../../proposals
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v7
        with:
          commit-message: "feat: add graph proposal"
          title: "feat: graph proposal"
          body: "Automated graph proposal generated by agent_graph."
          branch: "agent/graph-proposal"
```

- [ ] **Step 3: 写 merge 后 apply workflow**

```yaml
name: Apply Approved Graph Proposal

on:
  push:
    branches: ["main", "master"]
    paths:
      - "proposals/*.json"

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install agent dependencies
        run: |
          cd automation/agent_graph
          python -m pip install -e .
      - name: Apply latest proposal
        run: |
          cd automation/agent_graph
          python -m agent_graph.cli apply-proposal --proposal ../..//proposals/latest.json
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- [ ] **Step 4: 验证 workflow 语法**

Run: `npx prettier -c .github/workflows/graph-proposal.yml .github/workflows/graph-apply.yml`  
Expected: `All matched files use Prettier code style!`

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/graph-proposal.yml .github/workflows/graph-apply.yml automation/agent_graph/src/agent_graph/cli.py automation/agent_graph/src/agent_graph/github_client.py
git commit -m "feat: automate proposal PR and apply workflow"
```

### Task 5: 实现 Cloudflare 审批入口与微信桥对接协议

**Files:**
- Create: `workers/approval-worker/package.json`
- Create: `workers/approval-worker/tsconfig.json`
- Create: `workers/approval-worker/wrangler.toml`
- Create: `workers/approval-worker/src/index.ts`
- Create: `docs/agent-ops/README.md`

- [ ] **Step 1: 写 Worker 最小路由**

```ts
export interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPOSITORY: string;
  APPROVAL_SHARED_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true });
    }
    return new Response("Not Found", { status: 404 });
  },
};
```

- [ ] **Step 2: 写审批命令解析**

```ts
function parseApprovalCommand(text: string): string | null {
  const normalized = text.trim();
  const match = normalized.match(/^(?:√|批准)\s+PR-(\d+)$/i);
  return match ? match[1] : null;
}
```

- [ ] **Step 3: 写 GitHub merge 调用**

```ts
async function mergePullRequest(env: Env, pullNumber: string): Promise<Response> {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/pulls/${pullNumber}/merge`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "agent-graph-approval-worker",
    },
    body: JSON.stringify({ merge_method: "squash" }),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 4: 写 README，明确微信桥转发格式与自启动**

```md
# Agent Ops

## WeChat bridge expectations

- Clawbot 把收到的文本消息转发到 Worker 的 `/approve` 端点
- 消息正文必须为 `√ PR-123` 或 `批准 PR-123`
- 本地微信桥必须以 systemd 或 Docker restart policy 自启动
```

- [ ] **Step 5: 运行 Worker 本地检查**

Run: `cd /workspace/workers/approval-worker && npm install && npm run check`  
Expected: TypeScript 编译通过。

- [ ] **Step 6: Commit**

```bash
git add workers/approval-worker/package.json workers/approval-worker/tsconfig.json workers/approval-worker/wrangler.toml workers/approval-worker/src/index.ts docs/agent-ops/README.md
git commit -m "feat: add approval worker"
```

## Self-Review

- Spec coverage:
  - Agent 提案输出：Task 1-2
  - PR 审批链路：Task 4-5
  - Supabase 落库：Task 3
  - Clawbot 自启动要求：Task 5 + 部署文档
- Placeholder scan:
  - 无 `TODO`、`TBD`、`similar to`
- Type consistency:
  - `GraphProposal` / `GraphOperation` / `GraphContextSnapshot` 命名在任务中保持一致
