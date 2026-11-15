import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

/** 页面保护：未登录一律回到登录页，登录状态在向 后端确认之前不渲染受保护内容 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'booting') {
    return (
      <div className="shell">
        <div className="boot">正在校验登录状态…</div>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
