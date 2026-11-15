export type EntryKind = 'income' | 'expense'

export interface User {
  id: number
  username: string
  created_at: string
}

export interface LoginResult {
  token: string
  token_type: 'bearer'
  expires_at: string
  user: User
}

export interface Entry {
  id: number
  kind: EntryKind
  amount: number
  category: string
  note: string
  occurred_on: string
  created_at: string
}

export interface EntryList {
  month: string
  count: number
  items: Entry[]
}

export interface Summary {
  month: string
  income: number
  expense: number
  balance: number
  count: number
}

export interface EntryInput {
  kind: EntryKind
  amount: number
  category: string
  note: string
  occurred_on: string
}
