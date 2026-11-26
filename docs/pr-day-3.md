# PR：前端 · 第三天 CopilotKit Agent 对话入口

标题：`feat(frontend): 增加 CopilotKit Agent 对话入口`

---

## 目标

在第二天的 React + TypeScript 登录与记账页面上，接入 **CopilotKit** 聊天面板，
通过 **CopilotKit Runtime** 把 AG-UI 请求转给 Python 后端 Agent，
并保持原有登录状态与记账功能完全可用。

配套后端仓库：<https://github.com/fan-beijing/intern-day-2-backend>（分支 `feat/agent-chat`）

## 主要改动

```
src/agent/AgentPanel.tsx   聊天面板：Provider + CopilotChat，带「新建对话」
src/pages/LedgerPage.tsx   登录后的页面挂载 AgentPanel
server/runtime.mjs         CopilotKit Runtime（Express），按请求透传 Authorization
compose.yaml               web + runtime 两个服务，加入共享网络
Dockerfile                 多阶段构建：web(Vite) / runtime(Node)
.npmrc                     容器内依赖走镜像源
.env.example               补 Runtime 相关变量（只写占位值）
docs/screenshots/06-agent-chat.png  三轮对话截图
```

## Agent 标识对应关系

- 前端 `AgentPanel` 里 `AGENT_ID = 'xuelu-ledger-assistant'`
- Runtime 用同一个 `AGENT_ID` 注册给前端
- 后端 `app/routers/agent.py` 的 `AGENT_NAME = "xuelu-ledger-assistant"`

三处必须一致；可用 `AGENT_ID` 环境变量覆盖，但前后端要同时改。

## Runtime 拓扑与三个地址

| 服务 | 位置 | 浏览器访问 | 容器内 | 作用 |
| --- | --- | --- | --- | --- |
| web（Vite） | 本仓库 | `http://localhost:5173` | `web:5173` | 页面 + 把 `/api/copilotkit` 代理给 runtime |
| runtime（Express） | 本仓库 | 经 5173 同源代理 | `runtime:4000` | 把 AG-UI 请求转给 Python |
| api（FastAPI） | 另一个仓库 | `http://localhost:8000` | 共享网络内 `api:8000` | Agent 与账目接口 |

**Vite 不是 Runtime**：`vite.config.ts` 里只有 `proxy` 转发，
AG-UI 协议实现、会话管理都在 runtime 进程里。

## 启动步骤

```bash
# 共享网络只需建一次（两个仓库都引用它）
docker network create intern-day-shared

# 先后端
cd intern-day-2-backend && docker compose up -d --build

# 再前端
cd intern-day-2-frontend && docker compose up -d --build
```

打开 <http://localhost:5173>，用 `.env` 里的账号登录，页面下方即「雪庐小账房」面板。

## 认证如何传递

- 浏览器：`CopilotKitProvider` 的 `headers` 在**每次请求时**现取 localStorage 里的令牌，
  加 `Authorization: Bearer ...`。退出登录后取不到值，请求自然被拒。
- Runtime：按**该请求**的 Authorization 构造 `HttpAgent`，原样转发；
  **不持有、不缓存任何用户凭证**，也不是「拿一个管理员 token 替所有人调用」。
  Runtime 自己先挡一道无令牌请求，只是减少无意义连接，真正的信任边界在 Python。
- 模型密钥完全不经过前端与 Runtime。

## 错误处理

分两条路径，缺一不可：

- **建流前失败**（未登录 / 令牌失效）→ HTTP `401`，清状态、提示重新登录。
- **建流后失败**（模型错误等）→ HTTP 仍是 `200`，错误在 SSE 的 `RUN_ERROR` 事件里，
  需要结束 loading 并提示重试。

只判断状态码会导致「模型报错时页面永远转圈」。

## 会话行为

- 历史由浏览器持有，后端不落库；**刷新页面清空对话**。
- 「新建对话」换新 `threadId`，旧消息不再显示。
- 退出登录后组件卸载、令牌清除；旧令牌请求 `/agent` 返回 401。
- `threadId` 只是会话分组标签，**不是凭证**。

## 实际版本

| 包 | 版本 |
| --- | --- |
| @copilotkit/react-core | 1.90.2（`/v2` 子路径） |
| @copilotkit/react-ui | 1.90.2（`/v2` 子路径） |
| @copilotkit/runtime | 1.90.2（`/v2`、`/v2/express`） |
| @ag-ui/client | 1.0.5 |
| react | 19.3.1 |
| vite | 8.3.8 |
| typescript | 7.0.2 |

`pnpm-lock.yaml` 已提交。前后端都用 single-route 模式
（前端 `useSingleEndpoint`、Runtime 与后端一致），两边必须一致。

## 验证记录

| 检查项 | 结果 |
| --- | --- |
| 原有登录功能 | 登录 → `/ledger` → 刷新保持 → 退出，全部正常 |
| 面板渲染 | 登录后「雪庐小账房」面板、输入框、发送按钮正常出现 |
| 发送与流式 | 回复逐字出现，Network 中响应为 `text/event-stream` |
| 多轮上下文 | 轮1「我叫阿雪」→ 轮2 正确复述「阿雪」 |
| 空输入 | 空内容时发送按钮禁用，无法提交 |
| 未登录 | 未登录无法进入 `/ledger`，直接调接口 401 |
| 退出后 | 令牌清除，再发送提示重新登录 |
| 类型检查 | `pnpm build`（含 `tsc -b`）通过 |
| 容器构建 | web 与 runtime 两个 target 均构建成功 |
| 从零复现 | 清空网络与卷后按 README 重建，全流程可复现 |

> 流式与工具项是在后端仓库 `compose.mock.yaml` 的本地 Mock 模型下验证的，
> 验证协议与链路，不代表真实模型能力。真实模型因账户额度未完成，详见后端 PR。

## 原理说明与交互图

在后端仓库（两个仓库不重复维护）：

- 原理说明：`docs/day-3-agent-learning.md`
- 交互图：`docs/diagrams/day-3-agent-interaction.png`
- 复盘：`docs/day-3-retrospective.md`

## 已知问题与未完成项

1. **真实模型对话未完成**：后端账户余额为 0（`Insufficient Balance`），
   需要在后端 `.env` 换有效密钥后复验。
2. **`host.docker.internal` 不可靠**：本机 Windows + Docker Desktop 环境下，
   容器经该地址访问宿主机时 `Authorization` 头会丢失（实测同一令牌走它 401、
   走 Docker 网关 200）。因此改用共享网络 + 服务名 `api:8000`。
3. **容器内依赖走镜像源**：本机访问 npm 官方源被代理拦截，`.npmrc` 指向 npmmirror；
   `--frozen-lockfile` 的完整性校验仍生效。
4. **前端用 Vite 开发服务器演示**：不是生产构建产物，容器里跑的是 `pnpm dev`。
5. **刷新丢历史**：会话历史只在浏览器内存中，README 已写清。

## 敏感信息检查

- 截图里密码框为空、令牌不以明文出现。
- `.env` 在 `.gitignore`；`.npmrc` 不含任何凭据，只有镜像地址。
- `git ls-files` 核对过，未提交 `node_modules/`、`dist/`、真实密钥。
