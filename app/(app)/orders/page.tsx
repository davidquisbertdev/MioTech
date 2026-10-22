'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Badge, Empty, OrderLink, PageHeader } from '@/components/ui'
import { DELIVERY_LABEL, PAYMENT_LABEL, STATUS_LABEL } from '@/lib/labels'
import { fmtDate, fmtDateTime, money } from '@/lib/format'

export default function OrdersPage() {
  const { store } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [payment, setPayment] = useState('')

  useEffect(() => {
    if (!store) return
    supabase
      .from('orders')
      .select('id, order_number, total, payment_status, status, delivery_type, created_at, live_id, customers(full_name, phone), lives(title, live_date)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => setRows(data ?? []))
  }, [store])

  const grouped = useMemo(() => {
    const t = q.trim().toLowerCase()
    const filtered = (rows ?? []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!payment || r.payment_status === payment) &&
        (!t ||
          String(r.order_number).includes(t) ||
          r.customers?.full_name?.toLowerCase().includes(t) ||
          r.customers?.phone?.includes(t))
    )
    const groups: Record<string, typeof filtered> = {}
    for (const r of filtered) {
      const key = r.live_id ? `${r.live_id}` : '__no_live__'
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    }
    return groups
  }, [rows, q, status, payment])

  const noLiveLabel = 'Sin Live'

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Todos los pedidos de tus lives."
        action={<Link href="/orders/new" className="btn btn-primary">Nuevo pedido</Link>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <input className="input" placeholder="Buscar por cliente, teléfono o número" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedido" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Filtrar por pago">
          <option value="">Todos los pagos</option>
          {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {rows === null ? (
        <Empty>Cargando…</Empty>
      ) : Object.keys(grouped).length === 0 ? (
        <Empty>No hay pedidos con estos filtros.</Empty>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, ords]) => {
            const liveId = key === '__no_live__' ? null : key
            const live = ords[0]?.lives
            const liveLabel = live ? `${live.title || 'Live'} · ${fmtDateTime(live.live_date)}` : noLiveLabel
            return (
              <div key={key} className="panel overflow-x-auto">
                <div className="border-b border-line px-4 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50/40">
                  {liveLabel}
                </div>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-line text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2 font-medium">Pedido</th>
                      <th className="px-4 py-2 font-medium">Cliente</th>
                      <th className="px-4 py-2 font-medium">Pago</th>
                      <th className="px-4 py-2 font-medium">Estado</th>
                      <th className="px-4 py-2 font-medium">Entrega</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                      <th className="px-4 py-2 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ords.map((r) => (
                      <tr key={r.id} className="hover:bg-brand-50/60">
                        <td className="px-4 py-2.5"><OrderLink id={r.id} n={r.order_number} /></td>
                        <td className="px-4 py-2.5">{r.customers?.full_name}</td>
                        <td className="px-4 py-2.5"><Badge value={r.payment_status} label={PAYMENT_LABEL[r.payment_status]} /></td>
                        <td className="px-4 py-2.5"><Badge value={r.status} label={STATUS_LABEL[r.status]} /></td>
                        <td className="px-4 py-2.5 text-muted">{DELIVERY_LABEL[r.delivery_type]}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">{money(r.total)}</td>
                        <td className="px-4 py-2.5 text-muted">{fmtDateTime(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
