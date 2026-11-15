import { useState } from 'react'
import type { FormEvent } from 'react'

import { ApiError, api } from '../api/client'
import type { Entry, EntryKind } from '../api/types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories'
import { todayISO } from '../utils/format'

interface Props {
  onCreated: (entry: Entry) => void
}

const AMOUNT_PATTERN = /^\d{1,7}(\.\d{1,2})?$/

export default function EntryForm({ onCreated }: Props) {
  const [kind, setKind] = useState<EntryKind>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [note, setNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(todayISO())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categories: readonly string[] = kind === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  function switchKind(next: EntryKind) {
    setKind(next)
    setCategory((next === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const trimmed = amount.trim()
    if (!trimmed) {
      setError('请先填写金额')
      return
    }
    if (!AMOUNT_PATTERN.test(trimmed)) {
      setError('金额需为大于 0 的数字，最多两位小数')
      return
    }
    const value = Number(trimmed)
    if (!Number.isFinite(value) || value <= 0) {
      setError('金额必须大于 0')
      return
    }
    if (!occurredOn) {
      setError('请选择日期')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const created = await api.createEntry({
        kind,
        amount: value,
        category,
        note: note.trim(),
        occurred_on: occurredOn,
      })
      onCreated(created)
      setAmount('')
      setNote('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '记账失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit} noValidate>
      <div className="kind-switch" role="group" aria-label="收支类型">
        <button
          type="button"
          className="kind-option"
          data-kind="expense"
          aria-pressed={kind === 'expense'}
          onClick={() => switchKind('expense')}
          disabled={submitting}
        >
          支出
        </button>
        <button
          type="button"
          className="kind-option"
          data-kind="income"
          aria-pressed={kind === 'income'}
          onClick={() => switchKind('income')}
          disabled={submitting}
        >
          收入
        </button>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">金额（元）</span>
          <input
            className="input"
            name="amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span className="field-label">日期</span>
          <input
            className="input"
            name="occurred_on"
            type="date"
            value={occurredOn}
            onChange={(event) => setOccurredOn(event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">分类</span>
        <select
          className="select"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field-label">备注</span>
        <input
          className="input"
          name="note"
          value={note}
          maxLength={200}
          placeholder="可选，最多 200 字"
          onChange={(event) => setNote(event.target.value)}
          autoComplete="off"
        />
      </label>

      {error ? (
        <div className="form-error" role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '记账中…' : '记这一笔'}
      </button>
    </form>
  )
}
