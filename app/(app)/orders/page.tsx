'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Badge, Empty, ListSkeleton, OrderLink, PageHeader, SearchInput } from '@/components/ui'
import { Icon } from '@/components/icons'
import { DELIVERY_LABEL, PAYMENT_LABEL, STATUS_LABEL } from '@/lib/labels'
import { fmtDateTime, money } from '@/lib/format'

export default function OrdersPage() {
  const { store } = useAuth()
  const router = useRouter()
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

  const { groups, count } = useMemo(() => {
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
    return { groups, count: filtered.length }
  }, [rows, q, status, payment])

  const filtering = !!(q.trim() || status || payment)
  const clear = () => { setQ(''); setStatus(''); setPayment('') }

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Todos los pedidos de tus lives."
        action={
          <Link href="/orders/new" className="btn btn-primary">
            <Icon name="plus" size={16} />
            Nuevo pedido
          </Link>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por cliente, teléfono o número" label="Buscar pedido" />
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
        <ListSkeleton rows={8} />
      ) : rows.length === 0 ? (
        <Empty
          icon="orders"
          title="Aún no hay pedidos"
          action={<Link href="/orders/new" className="btn btn-primary">Registrar el primero</Link>}
        >
          Anota aquí cada pedido que te hagan en tus lives para cobrarlo, alistarlo y entregarlo sin perder ninguno.
        </Empty>
      ) : count === 0 ? (
        <Empty title="Ningún pedido coincide" action={<button className="btn btn-ghost" onClick={clear}>Quitar filtros</button>}>
          Prueba con otro nombre, teléfono o número, o cambia los filtros.
        </Empty>
      ) : (
        <>
          {filtering && (
            <p className="mb-3 text-sm text-muted" role="status">
              {count === 1 ? '1 pedido encontrado' : `${count} pedidos encontrados`} ·{' '}
              <button className="link" onClick={clear}>Quitar filtros</button>
            </p>
          )}
          <div className="space-y-6">
            {Object.entries(groups).map(([key, ords]) => {
              const live = ords[0]?.lives
              const sum = ords.reduce((s, r) => s + (r.status === 'cancelled' ? 0 : Number(r.total ?? 0)), 0)
              return (
                <section key={key} className="panel overflow-hidden">
                  <header className="panel-head bg-sunken">
                    <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold">
                      <Icon name={live ? 'lives' : 'orders'} size={16} className="text-brand-600" />
                      <span className="truncate">{live ? live.title || 'Live sin título' : 'Sin live'}</span>
                      {live && <span className="shrink-0 font-normal text-muted">· {fmtDateTime(live.live_date)}</span>}
                    </h2>
                    <p className="num shrink-0 text-xs text-muted">
                      {ords.length === 1 ? '1 pedido' : `${ords.length} pedidos`} · <span className="font-semibold text-ink">{money(sum)}</span>
                    </p>
                  </header>

                  {/* Móvil: lista */}
                  <ul className="divide-y divide-line sm:hidden">
                    {ords.map((r) => (
                      <li key={r.id}>
                        <Link href={`/orders/${r.id}`} className="block px-4 py-3 active:bg-brand-50">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-sm">
                              <span className="num font-semibold text-brand-700">#{r.order_number}</span>
                              <span className="ml-2 font-medium">{r.customers?.full_name}</span>
                            </span>
                            <span className="num shrink-0 text-sm font-semibold">{money(r.total)}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge value={r.payment_status} label={PAYMENT_LABEL[r.payment_status]} />
                            <Badge value={r.status} label={STATUS_LABEL[r.status]} />
                            <span className="ml-auto text-xs text-muted">{fmtDateTime(r.created_at)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Escritorio: tabla */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-line">
                        <tr>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Pedido</th>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Cliente</th>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Pago</th>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Estado</th>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Entrega</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-muted">Total</th>
                          <th className="px-4 py-2 text-xs font-semibold text-muted">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {ords.map((r) => (
                          <tr key={r.id} className="cursor-pointer transition-colors duration-150 hover:bg-brand-50" onClick={() => router.push(`/orders/${r.id}`)}>
                            <td className="td"><OrderLink id={r.id} n={r.order_number} /></td>
                            <td className="td font-medium">{r.customers?.full_name}</td>
                            <td className="td"><Badge value={r.payment_status} label={PAYMENT_LABEL[r.payment_status]} /></td>
                            <td className="td"><Badge value={r.status} label={STATUS_LABEL[r.status]} /></td>
                            <td className="td text-muted">{DELIVERY_LABEL[r.delivery_type]}</td>
                            <td className="td text-right font-semibold">{money(r.total)}</td>
                            <td className="td text-muted">{fmtDateTime(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
