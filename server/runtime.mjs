/**
 * CopilotKit Runtime（前端仓库内的轻量 Node 服务）。
 *
 * 为什么需要它：浏览器侧的 CopilotKit 只负责 UI 与协议，它需要一个 Runtime 把
 * AG-UI 请求转给真正的 Agent。Vite 开发服务器只是静态资源 + HMR，不具备这个能力。
 *
 * 这条链路把「谁在问」原样传下去：
 *   浏览器 (Authorization: Bearer <登录令牌>)
 *     → Runtime（本服务，按请求取出该 header）
 *     → Python 后端 POST /agent（AG-UI，FastAPI 校验令牌）
 * 因此 Runtime 自己不持有任何用户凭证，也不是特权代理。
 */

import { createHash } from 'node:crypto'

import express from 'express'
import { CopilotRuntime } from '@copilotkit/runtime/v2'
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express'
import { HttpAgent } from '@ag-ui/client'

const PORT = Number(process.env.RUNTIME_PORT ?? 4000)
const BASE_PATH = process.env.RUNTIME_BASE_PATH ?? '/api/copilotkit'
const AGENT_ID = process.env.AGENT_ID ?? 'xuelu-ledger-assistant'
const BACKEND_AGENT_URL = process.env.BACKEND_AGENT_URL ?? 'http://localhost:8000/agent'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)

const runtime = new CopilotRuntime({
  // 每个请求单独构造 Agent：Authorization 就是这次浏览器请求带来的那一个，
  // 不同用户各用各的令牌，不存在「Runtime 拿一个管理员凭证替所有人调用」。
  agents: ({ request }) => {
    const authorization = request.headers.get('authorization') ?? ''
    return {
      [AGENT_ID]: new HttpAgent({
        url: BACKEND_AGENT_URL,
        headers: authorization ? { Authorization: authorization } : {},
      }),
    }
  },
  // Runtime 侧还要区分「谁在列出/清空历史会话」。这里用登录令牌的摘要做身份键：
  // 不保存原始令牌，也不跨用户共享；真正的用户身份仍以 Python 后端的校验为准。
  identifyUser: (request) => {
    const authorization = request.headers.get('authorization') ?? ''
    if (!authorization.startsWith('Bearer ')) return null
    const id = createHash('sha256').update(authorization).digest('hex').slice(0, 16)
    return { id: `session-${id}` }
  },
  // 默认 "owner"：会话 id 本身就是访问凭证，未识别的调用方不能列举别人的会话。
  threads: { access: 'owner' },
})

const app = express()
app.disable('x-powered-by')

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', backendAgentUrl: BACKEND_AGENT_URL, agentId: AGENT_ID })
})

// 没有登录令牌就不放行：这里先挡一次，避免建立无意义的到后端的连接。
// 真正的鉴权仍在 Python 后端（401），Runtime 不是信任边界。
app.use(BASE_PATH, (req, res, next) => {
  const authorization = req.headers.authorization ?? ''
  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json({ error: '缺少登录凭证，请重新登录' })
    return
  }
  next()
})

app.use(
  createCopilotExpressHandler({
    runtime,
    basePath: BASE_PATH,
    // 与前端 <CopilotKitProvider useSingleEndpoint> 对应：所有操作都发到同一个
    // POST /api/copilotkit，用 JSON 信封区分动作。两边模式必须一致，否则会 404。
    mode: 'single-route',
    cors: { origin: ALLOWED_ORIGINS, credentials: true },
    // 本练习不启用 CopilotKit 的托管 Channels，避免后台再起长连接。
    activateChannels: false,
  }),
)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[runtime] 监听 0.0.0.0:${PORT}${BASE_PATH} → ${BACKEND_AGENT_URL}`)
  console.log(`[runtime] Agent id = ${AGENT_ID}`)
})
