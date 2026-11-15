import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import type { User } from '../api/types'
import { AuthContext } from './authContext'
import type { AuthState, AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  // 没有本地令牌就直接是未登录，省掉一次无效的启动校验
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'booting' : 'guest'))
  const [user, setUser] = useState<User | null>(null)
  const [notice, setNotice] = useState('')

  const resetToGuest = useCallback((message = '') => {
    clearToken()
    setUser(null)
    setStatus('guest')
    setNotice(message)
  }, [])

  // 任意受保护接口返回 401 时，统一清理本地状态并回到登录页
  useEffect(() => {
    setUnauthorizedHandler(() => resetToGuest('登录状态已失效，请重新登录'))
    return () => setUnauthorizedHandler(null)
  }, [resetToGuest])

  // 刷新页面不凭本地令牌直接认定已登录，而是用 /auth/me 向后端重新校验
  useEffect(() => {
    if (!getToken()) return

    let cancelled = false

    api
      .me()
      .then((current) => {
        if (cancelled) return
        setUser(current)
        setStatus('authed')
      })
      .catch(() => {
        if (cancelled) return
        // 本地有令牌但后端不认（过期、已退出或伪造），回登录页并说明原因
        resetToGuest('登录状态已失效，请重新登录')
      })

    return () => {
      cancelled = true
    }
  }, [resetToGuest])

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password)
    setToken(result.token)
    setUser(result.user)
    setStatus('authed')
    setNotice('')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // 令牌可能已经失效，本地照样清理，回到登录页
    }
    resetToGuest()
  }, [resetToGuest])

  const clearNotice = useCallback(() => setNotice(''), [])

  const value = useMemo<AuthState>(
    () => ({ status, user, notice, login, logout, clearNotice }),
    [status, user, notice, login, logout, clearNotice],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
