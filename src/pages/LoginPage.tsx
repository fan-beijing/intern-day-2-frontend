import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import TopBar from '../components/TopBar'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export default function LoginPage() {
  const { status, notice, login, clearNotice } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authed') {
    return <Navigate to="/ledger" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    if (!username.trim() || !password) {
      setError('请输入账号和密码')
      return
    }

    setSubmitting(true)
    setError('')
    clearNotice()
    try {
      await login(username.trim(), password)
      navigate('/ledger', { replace: true })
    } catch (err) {
      // 登录成功后本页会因状态变化卸载，只有失败时才需要解锁按钮
      setError(err instanceof ApiError ? err.message : '登录失败，请稍后重试')
      setSubmitting(false)
    }
  }

  const message = error || notice

  return (
    <div className="shell">
      <TopBar />
      <div className="login-stage">
        <section className="paper-card login-card">
          <div className="login-head">
            <span className="seal" aria-hidden="true">
              账
            </span>
            <h1 className="login-title">雪庐记账</h1>
            <p className="login-sub">登录后记一笔雪夜账</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span className="field-label">账号</span>
              <input
                className="input"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                placeholder="演示账号，例如 demo"
                autoFocus
              />
            </label>

            <label className="field">
              <span className="field-label">密码</span>
              <input
                className="input"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="后端 .env 中设置的练习密码"
              />
            </label>

            {message ? (
              <div className="form-error" role="alert">
                {message}
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '登录中…' : '登录'}
            </button>
          </form>

          <p className="login-foot">
            账号由后端启动时按 <code>SEED_USERNAME</code> / <code>SEED_PASSWORD</code> 创建，没有内置默认密码。
            <br />
            接口文档：
            <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">
              {API_BASE}/docs
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
