'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { DashboardView, type Deliveries, type Grouped, type Queues } from '@/components/dashboard-view'
import { shiftISO, todayISO, tomorrowISO } from '@/lib/format'
import { HISTORY_DAYS, PERIODS, summarize, type PaidOrder, type Period } from '@/lib/sales'

const one = (rel: any) => (Array.isArray(rel) ? rel[0] : rel)

/** Trae todos los pedidos cobrados desde una fecha, página por página. */
async function fetchPaid(storeId: string, fromISO: string) {
  const out: PaidOrder[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, total, created_at, live_id, customer_id, customers(full_name), lives(title)')
      .eq('store_id', storeId)
      .eq('payment_status', 'paid')
      .neq('status', 'cancelled')
      .gte('created_at', fromISO)
      .order('created_at', { ascending: false })
      .range(from, from + 999)
    if (error) throw error
    out.push(...((data ?? []) as PaidOrder[]))
    if (!data || data.length < 1000) return out
  }
}

export default function Dashboard() {
  const { store } = useAuth()
  const [period, setPeriod] = useState<Period>('7d')
  const [paid, setPaid] = useState<PaidOrder[] | null>(null)
  const [queues, setQueues] = useState<Queues | null>(null)
  const [deliveries, setDeliveries] = useState<Deliveries | null>(null)
  const [err, setErr] = useState('')

  const today = todayISO()
  const tomorrow = tomorrowISO()

  useEffect(() => {
    const saved = localStorage.getItem('mio.period')
    if (PERIODS.some((p) => p.id === saved)) setPeriod(saved as Period)
  }, [])

  useEffect(() => {
    if (!store) return
    let alive = true
    setPaid(null)
    setQueues(null)
    setDeliveries(null)
    setErr('')
    const fail = () => alive && setErr('No pudimos cargar todo el panel. Revisa tu conexión y vuelve a intentar.')

    fetchPaid(store.id, `${shiftISO(today, -HISTORY_DAYS)}T00:00:00-04:00`)
      .then((rows) => alive && setPaid(rows))
      .catch(() => { fail(); if (alive) setPaid([]) })

    const view = (v: string) => supabase.from(v).select('*').eq('store_id', store.id)
    Promise.all([
      view('v_orders_to_prepare'),
      view('v_orders_to_deliver'),
      view('v_orders_missing_delivery_info'),
      supabase
        .from('orders')
        .select('id, order_number, total, customers(full_name)')
        .eq('store_id', store.id)
        .eq('payment_status', 'pending')
        .neq('status', 'cancelled')
        .order('created_at'),
    ]).then(([prep, deliver, missing, unpaid]) => {
      if (!alive) return
      if (prep.error || deliver.error || missing.error || unpaid.error) fail()
      setQueues({ prep: prep.data ?? [], deliver: deliver.data ?? [], missing: missing.data ?? [], unpaid: unpaid.data ?? [] })
    })

    supabase
      .from('orders')
      .select('id, order_number, total, customers(full_name), delivery_date, delivery_point_id, delivery_points(name)')
      .eq('store_id', store.id)
      .in('delivery_date', [today, tomorrow])
      .in('status', ['prepared', 'dispatched'])
      .order('delivery_date')
      .then(({ data, error }) => {
        if (!alive) return
        if (error) fail()
        const groups = { today: {} as Grouped, tomorrow: {} as Grouped }
        for (const o of data ?? []) {
          const g = o.delivery_date === today ? groups.today : groups.tomorrow
          const key = o.delivery_point_id ?? '__other__'
          if (!g[key]) g[key] = { name: one(o.delivery_points)?.name || 'Sin punto de entrega', orders: [] }
          g[key].orders.push(o)
        }
        setDeliveries(groups)
      })

    return () => { alive = false }
  }, [store, today, tomorrow])

  const sales = useMemo(() => (paid ? summarize(paid, period, today) : null), [paid, period, today])
  const pickPeriod = (p: Period) => {
    setPeriod(p)
    localStorage.setItem('mio.period', p)
  }

  return (
    <DashboardView
      sales={sales}
      queues={queues}
      deliveries={deliveries}
      period={period}
      onPeriod={pickPeriod}
      err={err}
      today={today}
      tomorrow={tomorrow}
    />
  )
}
