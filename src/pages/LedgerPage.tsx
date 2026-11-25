import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApiError, api } from '../api/client'
import type { Entry, Summary } from '../api/types'
import { useAuth } from '../auth/useAuth'
import AgentPanel from '../agent/AgentPanel'
import EntryForm from '../components/EntryForm'
import EntryList from '../components/EntryList'
import SummaryCards from '../components/SummaryCards'
import Toast from '../components/Toast'
import TopBar from '../components/TopBar'
import { currentMonth, humanMonth } from '../utils/format'

interface ToastState {
  id: number
  text: string
  tone: 'info' | 'error'
}

export default function LedgerPage() {
  const { user, logout } = useAuth()

  const [month, setMonth] = useState(currentMonth())
  const [entries, setEntries] = useState<Entry[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // 月份快速切换时，只接受最后一次请求的结果
  const requestSeq = useRef(0)

  const pushToast = useCallback((text: string, tone: 'info' | 'error' = 'info') => {
    setToast({ id: Date.now(), text, tone })
  }, [])

  const load = useCallback(async (target: string) => {
    const seq = requestSeq.current + 1
    requestSeq.current = seq

    setLoading(true)
    setError('')
    try {
      const [list, totals] = await Promise.all([api.listEntries(target), api.summary(target)])
      if (requestSeq.current !== seq) return
      setEntries(list.items)
      setSummary(totals)
    } catch (err) {
      if (requestSeq.current !== seq) return
      setEntries([])
      setSummary(null)
      setError(err instanceof ApiError ? err.message : '加载账目失败，请稍后重试')
    } finally {
      if (requestSeq.current === seq) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 数据获取：月份变化时重新请求，加载态由请求本身驱动
    // eslint-disable-next-line react/set-state-in-effect
    void load(month)
  }, [load, month])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const handleCreated = useCallback(
    (entry: Entry) => {
      const entryMonth = entry.occurred_on.slice(0, 7)
      if (entryMonth === month) {
        pushToast('已记下这一笔')
        void load(month)
        return
      }
      pushToast(`这一笔记在 ${entryMonth}，已切到该月`)
      setMonth(entryMonth)
    },
    [month, load, pushToast],
  )

  const handleDelete = useCallback(
    async (entry: Entry) => {
      if (!window.confirm(`删除「${entry.category}」这笔记录？此操作不可撤销。`)) return
      setDeletingId(entry.id)
      try {
        await api.deleteEntry(entry.id)
        pushToast('已删除')
        await load(month)
      } catch (err) {
        pushToast(err instanceof ApiError ? err.message : '删除失败，请稍后重试', 'error')
      } finally {
        setDeletingId(null)
      }
    },
    [load, month, pushToast],
  )

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    await logout()
  }, [logout])

  const monthLabel = useMemo(() => humanMonth(month), [month])

  return (
    <div className="shell">
      <TopBar user={user} onLogout={handleLogout} loggingOut={loggingOut} />

      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">本月账目</h1>
            <p className="page-desc">
              {user ? `${user.username} 的流水` : '流水'} · 数据实时来自后端受保护接口
            </p>
          </div>

          <div className="month-picker">
            <label className="field-label" htmlFor="month">
              月份
            </label>
            <input
              id="month"
              className="input"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value || currentMonth())}
            />
          </div>
        </div>

        <SummaryCards summary={summary} loading={loading} />

        <div className="workbench">
          <section className="paper-card panel">
            <h2 className="panel-title">记一笔</h2>
            <p className="panel-hint">
              金额以「元」提交，后端按「分」入库；保存后列表与汇总会立即刷新。
            </p>
            <EntryForm onCreated={handleCreated} />
          </section>

          <section className="paper-card panel">
            <h2 className="panel-title">{monthLabel} 明细</h2>
            <p className="panel-hint">
              {loading
                ? '正在从后端读取…'
                : `共 ${summary ? summary.count : 0} 笔，按日期从近到远排列。`}
            </p>
            <EntryList
              entries={entries}
              loading={loading}
              error={error}
              deletingId={deletingId}
              onRetry={() => void load(month)}
              onDelete={(entry) => void handleDelete(entry)}
            />
          </section>
        </div>

        <AgentPanel />
      </main>

      {toast ? <Toast key={toast.id} text={toast.text} tone={toast.tone} /> : null}
    </div>
  )
}
