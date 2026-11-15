import { boliviaDay, shiftISO } from './format'

export type Period = '7d' | '30d' | 'month'

export const PERIODS: { id: Period; label: string; prev: string }[] = [
  { id: '7d', label: '7 días', prev: 'los 7 días previos' },
  { id: '30d', label: '30 días', prev: 'los 30 días previos' },
  { id: 'month', label: 'Este mes', prev: 'el mes pasado a esta fecha' },
]

/** Días de historial que cubren cualquier periodo y su comparación. */
export const HISTORY_DAYS = 62

export type PaidOrder = {
  id: string
  total: number | null
  created_at: string
  live_id: string | null
  customer_id: string | null
  customers: any
  lives: any
}

export type DayPoint = { date: string; total: number; count: number }
export type Ranked = { key: string; name: string; total: number; count: number }

export type SalesSummary = {
  total: number
  count: number
  avg: number
  prevTotal: number
  prevCount: number
  prevAvg: number
  days: DayPoint[]
  bestDay: DayPoint | null
  todayTotal: number
  todayCount: number
  topLives: Ranked[]
  noLiveTotal: number
  topCustomers: Ranked[]
}

const one = (rel: any) => (Array.isArray(rel) ? rel[0] : rel)

export function periodRange(period: Period, today: string) {
  if (period === 'month') {
    const start = today.slice(0, 8) + '01'
    const lastOfPrev = shiftISO(start, -1)
    const prevStart = lastOfPrev.slice(0, 8) + '01'
    const sameDay = shiftISO(prevStart, Number(today.slice(8, 10)) - 1)
    return { start, end: today, prevStart, prevEnd: sameDay > lastOfPrev ? lastOfPrev : sameDay }
  }
  const n = period === '7d' ? 7 : 30
  const start = shiftISO(today, -(n - 1))
  return { start, end: today, prevStart: shiftISO(start, -n), prevEnd: shiftISO(start, -1) }
}

export function summarize(orders: PaidOrder[], period: Period, today: string): SalesSummary {
  const { start, end, prevStart, prevEnd } = periodRange(period, today)

  const byDay = new Map<string, DayPoint>()
  for (let d = start; d <= end; d = shiftISO(d, 1)) byDay.set(d, { date: d, total: 0, count: 0 })

  const lives = new Map<string, Ranked>()
  const customers = new Map<string, Ranked>()
  let total = 0, count = 0, prevTotal = 0, prevCount = 0, noLiveTotal = 0

  const bump = (map: Map<string, Ranked>, key: string, name: string, t: number) => {
    const row = map.get(key) ?? { key, name, total: 0, count: 0 }
    row.total += t
    row.count += 1
    map.set(key, row)
  }

  for (const o of orders) {
    const date = boliviaDay(o.created_at)
    const t = Number(o.total ?? 0)

    if (date >= prevStart && date <= prevEnd) {
      prevTotal += t
      prevCount += 1
    }
    const day = byDay.get(date)
    if (!day) continue

    day.total += t
    day.count += 1
    total += t
    count += 1

    if (o.live_id) bump(lives, o.live_id, one(o.lives)?.title || 'Live sin título', t)
    else noLiveTotal += t

    const name = one(o.customers)?.full_name ?? 'Sin cliente'
    bump(customers, o.customer_id ?? name, name, t)
  }

  const days = [...byDay.values()]
  const rank = (map: Map<string, Ranked>) => [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  const best = days.reduce<DayPoint | null>((b, d) => (d.total > (b?.total ?? 0) ? d : b), null)
  const todayPoint = byDay.get(today)

  return {
    total,
    count,
    avg: count ? total / count : 0,
    prevTotal,
    prevCount,
    prevAvg: prevCount ? prevTotal / prevCount : 0,
    days,
    bestDay: best,
    todayTotal: todayPoint?.total ?? 0,
    todayCount: todayPoint?.count ?? 0,
    topLives: rank(lives),
    noLiveTotal,
    topCustomers: rank(customers),
  }
}
