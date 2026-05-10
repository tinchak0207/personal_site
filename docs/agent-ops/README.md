# Agent Ops

## Worker env

- `GITHUB_TOKEN`: 用于 merge PR 的 GitHub token
- `GITHUB_REPOSITORY`: 格式为 `owner/repo`
- `APPROVAL_SHARED_SECRET`: Clawbot 转发审批消息时附带的共享密钥

## Approval API

### Health

`GET /health`

### Approve

`POST /approve`

```json
{
  "text": "√ PR-123",
  "sharedSecret": "<shared-secret>"
}
```

允许的审批命令：

- `√ PR-123`
- `批准 PR-123`

## Clawbot integration

- Clawbot 负责读取微信消息并转发到 Worker 的 `/approve`
- Clawbot 主进程必须在你的 Linux 常驻机器上运行
- 推荐 Docker Compose + `systemd`
- 登录态目录必须持久化保存，避免机器重启后丢失会话

## Linux 自启动

仓库里已经放了可作为起点的 systemd 模板：

- `ops/systemd/clawbot-agent-wechat.service`
- `ops/systemd/clawbot-agent-wechat.env.example`

建议部署目录：`/opt/clawbot-agent-wechat`

### 建议步骤

1. 把 Clawbot / agent-wechat 相关部署文件放到 `/opt/clawbot-agent-wechat`
2. 复制环境变量模板并填好真实值
3. 把 systemd 模板安装到 `/etc/systemd/system/clawbot-agent-wechat.service`
4. 确保机器上有 `clawbot` 用户；如果没有，就把 service 文件里的 `User=clawbot` 改成你的实际运行用户
5. 执行以下命令启用自启动

```bash
sudo systemctl daemon-reload
sudo systemctl enable clawbot-agent-wechat.service
sudo systemctl start clawbot-agent-wechat.service
sudo systemctl status clawbot-agent-wechat.service
```

### 运行要求

- 机器重启后自动拉起
- 进程异常退出后自动重启
- Docker volume 或宿主目录持久化保存登录态
- 微信专用号保持登录
