'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Empty, OrderLink, PageHeader } from '@/components/ui'
import { DELIVERY_LABEL, STATUS_LABEL } from '@/lib/labels'
import { fmtDate, money, todayISO, tomorrowISO, weekStartISO, monthStartISO } from '@/lib/format'

type Row = any

function MonthlyChart({ data }: { data: { day: number; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  const height = 180
  const barWidth = Math.max(4, Math.min(24, Math.floor((600 - data.length) / data.length)))

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(600, data.length * (barWidth + 4) + 40)}
        height={height + 40}
        className="text-brand-500"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={40}
            y1={height - frac * height}
            x2={Math.max(600, data.length * (barWidth + 4) + 40) - 10}
            y2={height - frac * height}
            stroke="currentColor"
            strokeOpacity={0.1}
          />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.total / max) * height
          const x = 40 + i * (barWidth + 4)
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                fill="currentColor"
                rx={2}
                className="hover:opacity-70 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                className="text-muted"
              >
                {d.day}
              </text>
            </g>
          )
        })}
        {/* Y-axis label */}
        <text
          x={36}
          y={12}
          textAnchor="end"
          fontSize={10}
          fill="currentColor"
          className="text-muted"
        >
          {money(max)}
        </text>
      </svg>
    </div>
  )
}

function Queue({ title, hint, rows, extra }: { title: string; hint: string; rows: Row[]; extra: (r: Row) => string }) {
  return (
    <section className="panel flex flex-col">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        <span className="font-display text-3xl font-extrabold text-brand-600">{rows.length}</span>
      </header>
      <ul className="max-h-80 divide-y divide-line overflow-y-auto">
        {rows.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Todo al día.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <OrderLink id={r.id} n={r.order_number} />
              <span className="ml-2 truncate">{r.full_name ?? r.customers?.full_name}</span>
            </div>
            <span className="shrink-0 text-xs text-muted">{extra(r)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Dashboard() {
  const { store } = useAuth()
  const [data, setData] = useState<{ unpaid: Row[]; prep: Row[]; missing: Row[]; deliver: Row[] } | null>(null)
  const [income, setIncome] = useState<{ daily: number; weekly: number; monthly: number; monthlyData: { day: number; total: number }[]; byLive: Record<string, { title: string; total: number }>; byCustomer: Record<string, { name: string; total: number }> } | null>(null)
  const [tomorrowDeliveries, setTomorrowDeliveries] = useState<{ today: Record<string, { name: string; orders: Row[] }>; tomorrow: Record<string, { name: string; orders: Row[] }> }>({ today: {}, tomorrow: {} })

  useEffect(() => {
    if (!store) return
    ;(async () => {
      const q = (v: string) => supabase.from(v).select('*').eq('store_id', store.id)
      const [prep, deliver, missing, unpaid] = await Promise.all([
        q('v_orders_to_prepare'),
        q('v_orders_to_deliver'),
        q('v_orders_missing_delivery_info'),
        supabase
          .from('orders')
          .select('id, order_number, total, customers(full_name)')
          .eq('store_id', store.id)
          .eq('payment_status', 'pending')
          .neq('status', 'cancelled')
          .order('created_at'),
      ])
      setData({
        prep: prep.data ?? [],
        deliver: deliver.data ?? [],
        missing: missing.data ?? [],
        unpaid: unpaid.data ?? [],
      })
    })()
  }, [store])

  useEffect(() => {
    if (!store) return
    ;(async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, live_id, customers(full_name), lives(title)')
        .eq('store_id', store.id)
        .eq('payment_status', 'paid')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (!orders) return

      const today = todayISO()
      const weekStart = weekStartISO()
      const monthStart = monthStartISO()

      let daily = 0, weekly = 0, monthly = 0
      const byLive: Record<string, { title: string; total: number }> = {}
      const byCustomer: Record<string, { name: string; total: number }> = {}
      const monthlyDataMap: Record<number, number> = {}

      for (const o of orders) {
        const date = o.created_at?.slice(0, 10) ?? ''
        const t = o.total ?? 0
        const day = parseInt(date.slice(8, 10), 10)

        if (date === today) daily += t
        if (date >= weekStart) weekly += t
        if (date >= monthStart) monthly += t

        if (date >= monthStart) {
          monthlyDataMap[day] = (monthlyDataMap[day] ?? 0) + t
        }

        if (o.live_id) {
          const key = o.live_id
          const live = Array.isArray(o.lives) ? o.lives[0] : o.lives
          if (!byLive[key]) byLive[key] = { title: live?.title || 'Live', total: 0 }
          byLive[key].total += t
        }

        const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers
        const custKey = cust?.full_name ?? 'Sin cliente'
        if (!byCustomer[custKey]) byCustomer[custKey] = { name: custKey, total: 0 }
        byCustomer[custKey].total += t
      }

      const monthlyData = Object.entries(monthlyDataMap)
        .map(([day, total]) => ({ day: parseInt(day), total }))
        .sort((a, b) => a.day - b.day)

      setIncome({ daily, weekly, monthly, monthlyData, byLive, byCustomer })
    })()
  }, [store])

  useEffect(() => {
    if (!store) return
    ;(async () => {
      const today = todayISO()
      const tomorrow = tomorrowISO()
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, total, customers(full_name), delivery_date, delivery_point_id, delivery_points(name)')
        .eq('store_id', store.id)
        .in('delivery_date', [today, tomorrow])
        .in('status', ['prepared', 'dispatched'])
        .order('delivery_date')

      if (!orders) return

      const todayGrouped: Record<string, { name: string; orders: Row[] }> = {}
      const tomorrowGrouped: Record<string, { name: string; orders: Row[] }> = {}

      for (const o of orders) {
        const key = o.delivery_point_id ?? '__other__'
        const dp = Array.isArray(o.delivery_points) ? o.delivery_points[0] : o.delivery_points
        const name = dp?.name || 'Otro'
        if (o.delivery_date === today) {
          if (!todayGrouped[key]) todayGrouped[key] = { name, orders: [] }
          todayGrouped[key].orders.push(o)
        } else {
          if (!tomorrowGrouped[key]) tomorrowGrouped[key] = { name, orders: [] }
          tomorrowGrouped[key].orders.push(o)
        }
      }

      setTomorrowDeliveries({ today: todayGrouped, tomorrow: tomorrowGrouped })
    })()
  }, [store])

  const topLives = income ? Object.entries(income.byLive).sort((a, b) => b[1].total - a[1].total).slice(0, 5) : []
  const topCustomers = income ? Object.entries(income.byCustomer).sort((a, b) => b[1].total - a[1].total).slice(0, 5) : []

  return (
    <>
      <PageHeader
        title="Panel"
        subtitle="Lo que necesita tu atención hoy."
        action={<Link href="/orders/new" className="btn btn-primary">Nuevo pedido</Link>}
      />
      {/* Ingresos */}
      {income && (
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-bold">Ingresos</h2>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="panel p-4 text-center">
              <p className="text-xs text-muted">Hoy</p>
              <p className="font-display text-2xl font-extrabold text-brand-600">{money(income.daily)}</p>
            </div>
            <div className="panel p-4 text-center">
              <p className="text-xs text-muted">Esta semana</p>
              <p className="font-display text-2xl font-extrabold text-brand-600">{money(income.weekly)}</p>
            </div>
            <div className="panel p-4 text-center">
              <p className="text-xs text-muted">Este mes</p>
              <p className="font-display text-2xl font-extrabold text-brand-600">{money(income.monthly)}</p>
            </div>
          </div>

          {/* Gráfico mensual */}
          {income.monthlyData && income.monthlyData.length > 0 && (
            <div className="panel mb-5 p-5">
              <h3 className="mb-4 text-sm font-semibold">Ventas por día (este mes)</h3>
              <MonthlyChart data={income.monthlyData} />
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel">
              <h3 className="border-b border-line px-4 py-3 text-sm font-semibold">Por Live</h3>
              {topLives.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">Sin datos.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {topLives.map(([_, v]) => (
                    <li key={_} className="flex items-center justify-between px-4 py-2.5">
                      <span className="truncate">{v.title}</span>
                      <span className="font-semibold text-brand-600">{money(v.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel">
              <h3 className="border-b border-line px-4 py-3 text-sm font-semibold">Por Cliente</h3>
              {topCustomers.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">Sin datos.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {topCustomers.map(([_, v]) => (
                    <li key={_} className="flex items-center justify-between px-4 py-2.5">
                      <span className="truncate">{v.name}</span>
                      <span className="font-semibold text-brand-600">{money(v.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Entregas de hoy y mañana */}
      {(Object.keys(tomorrowDeliveries.today).length > 0 || Object.keys(tomorrowDeliveries.tomorrow).length > 0) && (
        <section className="mb-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-lg font-bold">Hoy {todayISO()}</h2>
              {Object.keys(tomorrowDeliveries.today).length === 0 ? (
                <p className="panel px-4 py-6 text-center text-sm text-muted">Sin entregas para hoy.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(tomorrowDeliveries.today).map(([_, v]) => (
                    <div key={_} className="panel">
                      <div className="border-b border-line px-4 py-2.5 flex items-center justify-between">
                        <span className="font-semibold">{v.name}</span>
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{v.orders.length} pedidos</span>
                      </div>
                      <ul className="divide-y divide-line text-sm">
                        {v.orders.map((o) => (
                          <li key={o.id} className="flex items-center justify-between px-4 py-2">
                            <OrderLink id={o.id} n={o.order_number} />
                            <span className="text-muted truncate ml-2">{o.customers?.full_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="mb-3 text-lg font-bold">Mañana {tomorrowISO()}</h2>
              {Object.keys(tomorrowDeliveries.tomorrow).length === 0 ? (
                <p className="panel px-4 py-6 text-center text-sm text-muted">Sin entregas para mañana.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(tomorrowDeliveries.tomorrow).map(([_, v]) => (
                    <div key={_} className="panel">
                      <div className="border-b border-line px-4 py-2.5 flex items-center justify-between">
                        <span className="font-semibold">{v.name}</span>
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{v.orders.length} pedidos</span>
                      </div>
                      <ul className="divide-y divide-line text-sm">
                        {v.orders.map((o) => (
                          <li key={o.id} className="flex items-center justify-between px-4 py-2">
                            <OrderLink id={o.id} n={o.order_number} />
                            <span className="text-muted truncate ml-2">{o.customers?.full_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pedidos */}
      {!data ? (
        <Empty>Cargando pedidos…</Empty>
      ) : (
        <>
          <h2 className="mb-4 text-lg font-bold">Pedidos</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <Queue title="Por cobrar" hint="Pedidos sin pago confirmado" rows={data.unpaid} extra={(r) => money(r.total)} />
            <Queue title="Por alistar" hint="Pagados, esperando ser empacados" rows={data.prep} extra={(r) => money(r.total)} />
            <Queue title="Falta definir entrega" hint="Pagados sin forma de entrega" rows={data.missing} extra={(r) => money(r.total)} />
            <Queue
              title="Por entregar"
              hint="Alistados o en camino"
              rows={data.deliver}
              extra={(r) => `${STATUS_LABEL[r.status]} · ${DELIVERY_LABEL[r.delivery_type]}${r.delivery_date ? ' · ' + fmtDate(r.delivery_date) : ''}`}
            />
          </div>
        </>
      )}

     
    </>
  )
}
