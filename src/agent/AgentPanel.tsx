import { useCallback, useState } from 'react'

import { CopilotChat, CopilotKitProvider } from '@copilotkit/react-core/v2'
import '@copilotkit/react-ui/v2/styles.css'

import { getToken } from '../api/client'

/** 必须与 Runtime 里注册的 agent 键一致（server/runtime.mjs 的 AGENT_ID）。 */
const AGENT_ID = 'xuelu-ledger-assistant'

/**
 * Runtime 与本页面同源：生产/容器里由 Vite 代理到 runtime 服务，
 * 浏览器不需要知道 Runtime 的真实端口，也就不用处理跨域与预检。
 */
const RUNTIME_URL = '/api/copilotkit'

export default function AgentPanel() {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID())
  const [error, setError] = useState('')

  // 每次请求现取令牌：退出登录后这里拿不到值，后续请求会因缺少 Authorization 被拒。
  const headers = useCallback(() => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const handleError = useCallback((event: { error: Error }) => {
    const message = event.error?.message ?? ''
    if (/401|unauthor/i.test(message)) {
      setError('登录状态已失效，请重新登录后再使用助手。')
      return
    }
    setError('助手暂时无法回复，请稍后重试。')
  }, [])

  return (
    <section className="paper-card panel agent-panel">
      <div className="agent-panel-head">
        <div>
          <h2 className="panel-title">雪庐小账房</h2>
          <p className="panel-hint">
            只会查询你本人的月度汇总，不会改动账目；回答由后端 Agent 流式返回。
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setError('')
            setThreadId(crypto.randomUUID())
          }}
        >
          新建对话
        </button>
      </div>

      {error ? (
        <p className="agent-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="agent-chat">
        <CopilotKitProvider
          runtimeUrl={RUNTIME_URL}
          headers={headers}
          onError={handleError}
          useSingleEndpoint
          enableInspector={false}
        >
          <CopilotChat
            agentId={AGENT_ID}
            threadId={threadId}
            labels={{
              chatInputPlaceholder: '问我这个月的收支，例如「11 月花了多少」',
            }}
          />
        </CopilotKitProvider>
      </div>
    </section>
  )
}
