import { useContext } from 'react'

import { AuthContext } from './authContext'
import type { AuthState } from './authContext'

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用')
  }
  return context
}
