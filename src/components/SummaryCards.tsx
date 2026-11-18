import type { Summary } from '../api/types'
import { formatMoney } from '../utils/format'

interface Props {
  summary: Summary | null
  loading: boolean
}

function Value({ amount, loading }: { amount: number | null; loading: boolean }) {
  if (loading) return <span className="unit">读取中…</span>
  if (amount === null) return <span className="unit">—</span>
  return (
    <>
      {formatMoney(amount)}
      <span className="unit">元</span>
    </>
  )
}

export default function SummaryCards({ summary, loading }: Props) {
  return (
    <div className="summary-grid">
      <article className="paper-card summary-card income">
        <div className="summary-label">本月收入</div>
        <div className="summary-value">
          <Value amount={summary ? summary.income : null} loading={loading} />
        </div>
        <div className="summary-note">仅统计已记入本月的收入</div>
      </article>

      <article className="paper-card summary-card expense">
        <div className="summary-label">本月支出</div>
        <div className="summary-value">
          <Value amount={summary ? summary.expense : null} loading={loading} />
        </div>
        <div className="summary-note">仅统计已记入本月的支出</div>
      </article>

      <article className="paper-card summary-card">
        <div className="summary-label">本月结余</div>
        <div className="summary-value">
          <Value amount={summary ? summary.balance : null} loading={loading} />
        </div>
        <div className="summary-note">
          {loading ? '正在汇总' : `共 ${summary ? summary.count : 0} 笔流水`}
        </div>
      </article>
    </div>
  )
}
