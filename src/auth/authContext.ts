import { createContext } from 'react'

import type { User } from '../api/types'

export type AuthStatus = 'booting' | 'guest' | 'authed'

export interface AuthState {
  status: AuthStatus
  user: User | null
  /** 被动退出登录（凭证失效）时给登录页的提示 */
  notice: string
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearNotice: () => void
}

export const AuthContext = createContext<AuthState | null>(null)
