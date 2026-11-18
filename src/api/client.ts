import type { Entry, EntryInput, EntryList, LoginResult, Summary, User } from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')
const TOKEN_KEY = 'xuelu.token'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 401 的统一回调：由 AuthProvider 注册，用于清理登录态并跳回登录页 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean)
      if (messages.length > 0) return messages.join('；')
    }
  }
  if (status === 401) return '登录状态已失效，请重新登录'
  if (status === 404) return '请求的数据不存在'
  if (status >= 500) return '服务端开小差了，请稍后重试'
  return `请求失败（${status}）`
}

interface RequestOptions {
  /** 登录接口自身的 401 是「账号密码错误」，不能触发退出登录 */
  skipAuthHandler?: boolean
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, '网络异常，请确认后端服务已启动')
  }

  if (response.status === 204) return undefined as T

  const raw = await response.text()
  let payload: unknown = null
  if (raw) {
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipAuthHandler) onUnauthorized?.()
    throw new ApiError(response.status, extractMessage(payload, response.status))
  }

  return payload as T
}

export const api = {
  login(username: string, password: string): Promise<LoginResult> {
    return request<LoginResult>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
      { skipAuthHandler: true },
    )
  },
  me(): Promise<User> {
    return request<User>('/auth/me', {}, { skipAuthHandler: true })
  },
  logout(): Promise<{ detail: string }> {
    return request<{ detail: string }>('/auth/logout', { method: 'POST' })
  },
  listEntries(month: string): Promise<EntryList> {
    return request<EntryList>(`/ledger/entries?month=${encodeURIComponent(month)}`)
  },
  summary(month: string): Promise<Summary> {
    return request<Summary>(`/ledger/summary?month=${encodeURIComponent(month)}`)
  },
  createEntry(input: EntryInput): Promise<Entry> {
    return request<Entry>('/ledger/entries', { method: 'POST', body: JSON.stringify(input) })
  },
  deleteEntry(id: number): Promise<void> {
    return request<void>(`/ledger/entries/${id}`, { method: 'DELETE' })
  },
}
