# Agent 图谱自动化设计与工作顺序

## 1. 目标

建立一条可审计、可回滚、低运维成本的自动化链路：

`文章变更 -> Agent 分析 -> 生成图谱提案 -> 自动创建 PR -> 微信通知 -> 你回复批准 -> 自动 merge -> 执行器落库到 Supabase`

系统目标不是让 Agent 直接改数据库，而是先把图谱变更收敛成结构化提案，并通过 Git PR 作为唯一审批闸门。

## 2. 总体方案

采用以下组合：

- `PydanticAI`：负责分析文章、读取图谱上下文、输出结构化 proposal
- `GitHub Actions`：负责定时触发、生成 proposal、提交分支、创建 PR
- `Cloudflare Worker`：负责轻量审批 API、GitHub merge 触发、回调校验
- `Clawbot / agent-wechat`：负责微信消息入口和回传
- `Supabase`：作为图谱最终状态存储
- `Git + PR`：作为审计轨和人工批准边界

最终采用双轨：

- `Git` 保存提案、审批记录、变更摘要
- `Supabase` 保存生效后的图谱状态

## 3. 微信接入边界

当前微信入口主要依赖 `Clawbot` 生态能力，但其运行前提必须明确：

- 微信桥不适合部署在纯 serverless 免费平台
- 需要一台你自己的常驻机器运行 Clawbot 或 agent-wechat
- 该机器必须支持自启动
- 该机器重启后，微信桥应自动恢复服务进程
- 微信账号需保持登录状态

因此，本方案中的“全免费”解释为：

- 云上部分尽量使用免费额度
- 微信桥运行在你自有常驻机器上

## 4. 自启动要求

本地常驻机必须满足以下要求：

- 系统启动后自动启动微信桥服务
- 服务异常退出后自动拉起
- 机器断电重启后无需手工重新运行进程
- 登录态和配置文件持久化保存

推荐做法：

- Linux：`systemd` 管理 Clawbot 进程
- Docker 部署时：`restart: unless-stopped`
- 配置与登录态单独挂载到持久目录

第一版设计里，自启动是硬要求，不作为后补优化。

## 5. Agent 职责

Agent 只负责“提出可执行建议”，不直接写数据库。

输入包括：

- 新增、修改、删除的文章
- 当前图谱邻域
- 历史相关文章摘要
- 核心节点保护名单
- 规则约束与风险阈值

输出包括：

- 本次 proposal 的摘要
- 操作列表
- 每条操作的理由
- 证据引用
- 风险级别
- 微信通知文案

## 6. Proposal 结构

Proposal 是系统的核心中间层，第一版应为结构化 JSON 文件。

建议结构：

```json
{
  "proposal_id": "graph-2026-05-10-030000",
  "source_refs": ["post:slug-a", "post:slug-b"],
  "summary": "基于新文章发现 2 个候选节点与 3 条高置信关系",
  "risk_level": "medium",
  "wechat_message": "昨晚整理时，发现一条旧线索重新发光，已提交候选引力线等待你确认。",
  "operations": [
    {
      "type": "create_node",
      "target_id": "node-xxx",
      "payload": {
        "label": "自治",
        "address": "/concepts/autonomy"
      },
      "confidence": 0.92,
      "reason": "文章明确引入了稳定新概念，且与既有节点不重复",
      "evidence_quotes": [
        "……"
      ],
      "requires_manual_review": false
    }
  ]
}
```

## 7. 允许与禁止的变更

第一版允许自动进入 PR 的变更：

- 新增候选节点
- 新增候选边
- 修改边权重
- 对低置信旧边提出删除建议
- 更新关联理由和摘要

第一版禁止自动直接执行的高风险变更：

- 删除核心节点
- 节点合并
- 批量级联删除
- 改写核心节点定义

这些高风险操作只能进入 PR，不能绕过审批。

## 8. PR 流程

工作流如下：

1. GitHub Actions 触发 Agent 分析
2. Agent 输出 proposal JSON
3. Workflow 创建分支并提交 proposal 文件
4. Workflow 自动创建 PR
5. PR 描述包含变更摘要、证据、风险说明
6. 通知服务将 PR 摘要发到微信
7. 你在微信中发送批准命令
8. 审批服务校验后调用 GitHub API merge PR
9. merge 后执行器读取 proposal 并落库

## 9. 微信审批协议

第一版不建议只靠单独一个 `√`。

推荐审批口令：

- `√ PR-123`
- `批准 PR-123`

原因：

- 可避免多个待审批 PR 时误操作
- 日志与审计更清晰
- 回放和补偿更容易

如果未来你坚持只发单独一个 `√`，则系统必须额外限制：

- 任意时刻仅允许一个待审批 proposal

## 10. 免费部署策略

推荐部署方式：

- `GitHub Actions`：跑定时分析和自动 PR
- `Cloudflare Worker`：跑审批 API 和轻量 webhook
- `本地常驻机`：跑 Clawbot / agent-wechat
- `Supabase`：存图谱最终状态

成本边界：

- GitHub Actions 在公开仓库中标准 runner 可免费；私有仓库受免费分钟额度限制
- Cloudflare Workers 有免费计划
- 本地常驻机不产生额外云主机费用，但需要你自己提供机器和网络

## 11. 你必须手做的事

### 11.1 基础设施

- 准备一台常驻机器
- 确保该机器可长期联网
- 允许该机器开机自启动服务

### 11.2 微信侧

- 准备一个专用微信号
- 用该账号登录 Clawbot / agent-wechat
- 接受它长期维持登录态

### 11.3 密钥

你需要自行准备并保存这些密钥：

- 模型 API Key
- GitHub Token 或 GitHub App 凭据
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Cloudflare 部署凭据

### 11.4 运行边界

- 确认是否使用公开仓库
- 确认审批命令格式采用 `√ PR-编号`
- 确认本地机器用于持久运行微信桥

## 12. 我接下来要实现的代码

第一批实现范围：

- `agent/`：PydanticAI agent、schema、prompt、上下文读取
- `executor/`：proposal 校验与落库执行器
- `.github/workflows/`：生成 proposal PR、merge 后执行
- `workers/`：Cloudflare Worker 审批接口
- `docs/`：工作顺序与部署说明

## 13. 工作顺序

```md
1. 写 proposal schema
2. 写 agent 主流程
3. 写 GitHub Actions 自动 PR
4. 写 Cloudflare Worker 审批 API
5. 写 merge 后执行器
6. 写 Clawbot webhook 对接接口
7. 最后补本地自启动说明和 systemd 模板
```

## 14. MVP 验收标准

满足以下条件即视为第一版可用：

- 发布或更新文章后可生成 proposal PR
- PR 中能看到结构化图谱变更和理由
- 微信收到待审批通知
- 你回复 `√ PR-编号` 后可自动 merge
- merge 后 proposal 能正确写入 Supabase
- 本地微信桥在机器重启后自动恢复运行

## 15. 当前决策结论

本项目确认采用以下路径：

- Agent 方案：`PydanticAI`
- 审批边界：`Git PR`
- 微信入口：`Clawbot`
- 部署策略：`云上免费额度 + 本地常驻机`
- 自启动：`必须支持`
