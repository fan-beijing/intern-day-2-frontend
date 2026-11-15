import { Link } from 'react-router-dom'

import type { User } from '../api/types'

interface Props {
  user?: User | null
  onLogout?: () => void
  loggingOut?: boolean
}

export default function TopBar({ user, onLogout, loggingOut = false }: Props) {
  return (
    <header className="topbar">
      <Link className="brand" to={user ? '/ledger' : '/login'}>
        <span className="seal" aria-hidden="true">
          账
        </span>
        <div>
          <div className="brand-title">雪庐记账</div>
          <div className="brand-sub">登录鉴权 · 个人账目</div>
        </div>
      </Link>

      <div className="topbar-spacer" />

      {user ? (
        <div className="user-chip">
          <span>
            当前用户 <strong>{user.username}</strong>
          </span>
          <button type="button" className="btn btn-ghost" onClick={onLogout} disabled={loggingOut}>
            {loggingOut ? '退出中…' : '退出登录'}
          </button>
        </div>
      ) : null}
    </header>
  )
}
