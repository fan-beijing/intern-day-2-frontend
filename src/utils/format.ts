export function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function humanMonth(month: string): string {
  const [year, mon] = month.split('-')
  return `${year} 年 ${Number(mon)} 月`
}

/** 列表里的紧凑日期：11/15，避免在窄列里换行 */
export function shortDay(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(month)}/${Number(day)}`
}

export function humanDay(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}
