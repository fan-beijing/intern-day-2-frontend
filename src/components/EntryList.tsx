import type { Entry } from '../api/types'
import { formatMoney, humanDay, shortDay } from '../utils/format'

interface Props {
  entries: Entry[]
  loading: boolean
  error: string
  deletingId: number | null
  onRetry: () => void
  onDelete: (entry: Entry) => void
}

export default function EntryList({ entries, loading, error, deletingId, onRetry, onDelete }: Props) {
  if (loading) {
    return (
      <div aria-busy="true" aria-live="polite">
        <div className="skeleton-row" />
        <div className="skeleton-row" />
        <div className="skeleton-row" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="state" role="alert">
        <div className="state-mark" aria-hidden="true">
          !
        </div>
        <div className="state-title">没能读到账目</div>
        <p className="state-desc">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          重试
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="state">
        <div className="state-mark" aria-hidden="true">
          空
        </div>
        <div className="state-title">本月还没有流水</div>
        <p className="state-desc">在左侧记下第一笔，列表和汇总会同步刷新。</p>
      </div>
    )
  }

  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <div className="entry-row" key={entry.id}>
          <span className="entry-date" title={humanDay(entry.occurred_on)}>
            {shortDay(entry.occurred_on)}
          </span>
          <div className="entry-main">
            <div className="entry-cat">{entry.category}</div>
            {entry.note ? <div className="entry-note">{entry.note}</div> : null}
          </div>
          <span className={`entry-amount ${entry.kind}`}>
            {entry.kind === 'income' ? '+' : '−'}
            {formatMoney(entry.amount)}
          </span>
          <button
            type="button"
            className="entry-delete"
            onClick={() => onDelete(entry)}
            disabled={deletingId === entry.id}
            aria-label={`删除 ${entry.category} ${formatMoney(entry.amount)} 元`}
          >
            {deletingId === entry.id ? '删除中…' : '删除'}
          </button>
        </div>
      ))}
    </div>
  )
}
