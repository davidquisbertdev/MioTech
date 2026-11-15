'use client'
import Link from 'next/link'
import { ErrorMsg, OrderLink, PageHeader } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons'
import { SalesChart } from '@/components/sales-chart'
import { DELIVERY_LABEL, STATUS_LABEL } from '@/lib/labels'
import { fmtDate, fmtDay, money } from '@/lib/format'
import { PERIODS, type Period, type Ranked, type SalesSummary } from '@/lib/sales'

type Row = any
export type Queues = { unpaid: Row[]; prep: Row[]; missing: Row[]; deliver: Row[] }
export type Grouped = Record<string, { name: string; orders: Row[] }>
export type Deliveries = { today: Grouped; tomorrow: Grouped }

const one = (rel: any) => (Array.isArray(rel) ? rel[0] : rel)

/* ---------- Piezas ---------- */

function Delta({ cur, prev, vs }: { cur: number; prev: number; vs: string }) {
  if (prev <= 0) return <p className="text-xs text-muted">Sin ventas en {vs} para comparar</p>
  const pct = ((cur - prev) / prev) * 100
  const flat = Math.abs(pct) < 0.5
  const up = pct > 0
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
      <span className={`num inline-flex items-center gap-1 font-semibold ${flat ? 'text-muted' : up ? 'text-ok' : 'text-danger'}`}>
        {!flat && <Icon name={up ? 'up' : 'down'} size={14} />}
        {flat ? 'Igual' : `${up ? '+' : '−'}${Math.abs(pct).toLocaleString('es-BO', { maximumFractionDigits: 0 })} %`}
      </span>
      que {vs}
    </p>
  )
}

function Stat({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="bg-surface p-4 sm:p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="num mt-1 whitespace-nowrap text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
      <div className="mt-1.5 min-h-4">{children}</div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line xl:grid-cols-4" role="status" aria-label="Cargando ventas">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2.5 bg-surface p-5">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

function RankList({ title, hint, rows, empty, footer }: { title: string; hint: string; rows: Ranked[]; empty: string; footer?: React.ReactNode }) {
  const max = rows[0]?.total || 1
  return (
    <section className="panel flex flex-col">
      <header className="panel-head">
        <h3 className="font-bold">{title}</h3>
        <span className="text-xs text-muted">{hint}</span>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ol className="flex-1 space-y-3.5 p-4">
          {rows.map((r, i) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="num mr-2 text-xs text-muted">{i + 1}</span>
                  <span className="font-medium">{r.name}</span>
                </span>
                <span className="num shrink-0 font-semibold">{money(r.total)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, (r.total / max) * 100)}%` }} />
                </div>
                <span className="num w-20 shrink-0 text-right text-xs text-muted">{r.count === 1 ? '1 pedido' : `${r.count} pedidos`}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {footer && <p className="border-t border-line px-4 py-2.5 text-xs text-muted">{footer}</p>}
    </section>
  )
}

const QUEUE_TONE: Record<string, string> = {
  warn: 'bg-warn-soft text-warn',
  brand: 'bg-brand-100 text-brand-800',
  info: 'bg-info-soft text-info',
}

function Queue({ id, title, hint, icon, tone, rows, extra }: { id?: string; title: string; hint: string; icon: IconName; tone: keyof typeof QUEUE_TONE; rows: Row[] | null; extra: (r: Row) => string }) {
  return (
    <section id={id} className="panel flex scroll-mt-20 flex-col">
      <header className="panel-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${QUEUE_TONE[tone]}`}><Icon name={icon} /></span>
          <div className="min-w-0">
            <h3 className="font-bold">{title}</h3>
            <p className="truncate text-xs text-muted">{hint}</p>
          </div>
        </div>
        {rows ? (
          <span className={`num rounded-full px-2.5 py-0.5 text-sm font-bold ${rows.length ? QUEUE_TONE[tone] : 'bg-sunken text-muted'}`}>{rows.length}</span>
        ) : (
          <span className="skeleton h-6 w-8" />
        )}
      </header>
      {!rows ? (
        <div className="space-y-3 p-4" role="status" aria-label="Cargando">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ) : rows.length === 0 ? (
        <p className="flex items-center justify-center gap-2 px-4 py-7 text-sm text-muted">
          <Icon name="check" size={16} className="text-ok" />
          Todo al día
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-line overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/orders/${r.id}`} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-brand-50">
                <span className="min-w-40 flex-1 truncate">
                  <span className="num font-semibold text-brand-700">#{r.order_number}</span>
                  <span className="ml-2">{r.full_name ?? one(r.customers)?.full_name}</span>
                </span>
                <span className="num shrink-0 text-xs text-muted">{extra(r)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DeliveryDay({ title, date, groups }: { title: string; date: string; groups: Grouped }) {
  const entries = Object.entries(groups)
  const count = entries.reduce((s, [, g]) => s + g.orders.length, 0)
  return (
    <section className="panel">
      <header className="panel-head">
        <h3 className="font-bold">
          {title} <span className="font-normal text-muted">· {fmtDay(date)}</span>
        </h3>
        <span className="num text-xs text-muted">{count === 1 ? '1 pedido' : `${count} pedidos`}</span>
      </header>
      {entries.length === 0 ? (
        <p className="px-4 py-7 text-center text-sm text-muted">Sin entregas programadas.</p>
      ) : (
        <div className="divide-y divide-line">
          {entries.map(([key, g]) => (
            <div key={key} className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon name="pin" size={15} className="text-brand-600" />
                {g.name}
                <span className="num font-normal text-muted">· {g.orders.length}</span>
              </p>
              <ul className="mt-1.5 space-y-1 pl-[1.4rem] text-sm">
                {g.orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <OrderLink id={o.id} n={o.order_number} />
                      <span className="ml-2">{one(o.customers)?.full_name}</span>
                    </span>
                    <span className="num shrink-0 text-xs text-muted">{money(o.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- Vista ---------- */

export function DashboardView({ sales, queues, deliveries, period, onPeriod, err, today, tomorrow }: {
  sales: SalesSummary | null
  queues: Queues | null
  deliveries: Deliveries | null
  period: Period
  onPeriod: (p: Period) => void
  err: string
  today: string
  tomorrow: string
}) {
  const vs = PERIODS.find((p) => p.id === period)!.prev
  const unpaidTotal = queues ? queues.unpaid.reduce((s, r) => s + Number(r.total ?? 0), 0) : 0
  const hasDeliveries = deliveries && (Object.keys(deliveries.today).length > 0 || Object.keys(deliveries.tomorrow).length > 0)

  return (
    <>
      <PageHeader
        title="Panel"
        subtitle={
          sales
            ? sales.todayCount
              ? <>Hoy llevas <strong className="num font-semibold text-ink">{money(sales.todayTotal)}</strong> en {sales.todayCount === 1 ? '1 pedido cobrado' : `${sales.todayCount} pedidos cobrados`}.</>
              : 'Todavía no cobraste pedidos hoy.'
            : 'Cómo van tus ventas y qué necesita tu atención.'
        }
        action={
          <Link href="/orders/new" className="btn btn-primary">
            <Icon name="plus" size={16} />
            Nuevo pedido
          </Link>
        }
      />

      {err && <div className="mb-5"><ErrorMsg>{err}</ErrorMsg></div>}

      {/* Ventas */}
      <section aria-labelledby="ventas" className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="ventas" className="text-lg font-bold">Ventas</h2>
          <div role="group" aria-label="Periodo" className="inline-flex rounded-lg border border-line bg-sunken p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={period === p.id}
                onClick={() => onPeriod(p.id)}
                className={`min-h-8 cursor-pointer rounded-md px-3 text-sm font-semibold transition-colors duration-150 ${
                  period === p.id ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.1)]' : 'text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {!sales ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-[0_1px_2px_rgb(0_0_0/0.04)] xl:grid-cols-4">
            <Stat label="Ventas cobradas" value={money(sales.total)}>
              <Delta cur={sales.total} prev={sales.prevTotal} vs={vs} />
            </Stat>
            <Stat label="Pedidos cobrados" value={sales.count}>
              <Delta cur={sales.count} prev={sales.prevCount} vs={vs} />
            </Stat>
            <Stat label="Ticket promedio" value={money(sales.avg)}>
              <Delta cur={sales.avg} prev={sales.prevAvg} vs={vs} />
            </Stat>
            <Stat label="Por cobrar" value={queues ? money(unpaidTotal) : <span className="skeleton inline-block h-7 w-28 align-middle" />}>
              {queues && (
                queues.unpaid.length ? (
                  <a href="#por-cobrar" className="link text-xs text-warn">
                    {queues.unpaid.length === 1 ? '1 pedido sin pago' : `${queues.unpaid.length} pedidos sin pago`}
                  </a>
                ) : (
                  <p className="text-xs text-muted">Nada pendiente de cobro</p>
                )
              )}
            </Stat>
          </div>
        )}

        <div className="panel mt-4 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-bold">Ventas por día <span className="font-normal text-muted">· en Bs</span></h3>
            {sales?.bestDay && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>Mejor día: <span className="font-semibold text-ink">{fmtDay(sales.bestDay.date)}</span>, <span className="num font-semibold text-ink">{money(sales.bestDay.total)}</span></span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="18" height="2" aria-hidden="true"><line x1="0" x2="18" y1="1" y2="1" stroke="var(--ink)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="5 3" /></svg>
                  Promedio diario <span className="num font-semibold text-ink">{money(sales.total / sales.days.length)}</span>
                </span>
              </p>
            )}
          </div>
          {!sales ? (
            <div className="skeleton h-60 w-full" role="status" aria-label="Cargando gráfico" />
          ) : sales.total === 0 ? (
            <div className="grid h-60 place-items-center text-center">
              <div>
                <p className="font-semibold">Sin ventas cobradas en este periodo</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                  Cuando marques un pedido como pagado, aparecerá aquí el día en que se registró.
                </p>
              </div>
            </div>
          ) : (
            <SalesChart days={sales.days} today={today} />
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <RankList
            title="Ventas por live"
            hint="Los 5 que más vendieron"
            rows={sales?.topLives ?? []}
            empty={sales ? 'Ningún pedido cobrado vino de un live en este periodo.' : 'Cargando…'}
            footer={sales && sales.noLiveTotal > 0 ? <>Fuera de lives: <span className="num font-semibold text-ink">{money(sales.noLiveTotal)}</span></> : undefined}
          />
          <RankList
            title="Mejores clientes"
            hint="Los 5 que más compraron"
            rows={sales?.topCustomers ?? []}
            empty={sales ? 'Aún no hay compras cobradas en este periodo.' : 'Cargando…'}
          />
        </div>
      </section>

      {/* Entregas */}
      {hasDeliveries && deliveries && (
        <section aria-labelledby="entregas" className="mb-10">
          <h2 id="entregas" className="mb-3 text-lg font-bold">Entregas programadas</h2>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <DeliveryDay title="Hoy" date={today} groups={deliveries.today} />
            <DeliveryDay title="Mañana" date={tomorrow} groups={deliveries.tomorrow} />
          </div>
        </section>
      )}

      {/* Pendientes */}
      <section aria-labelledby="pendientes">
        <h2 id="pendientes" className="mb-3 text-lg font-bold">Pedidos por atender</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Queue id="por-cobrar" icon="wallet" tone="warn" title="Por cobrar" hint="Pedidos sin pago confirmado" rows={queues?.unpaid ?? null} extra={(r) => money(r.total)} />
          <Queue icon="box" tone="brand" title="Por alistar" hint="Pagados, esperando ser empacados" rows={queues?.prep ?? null} extra={(r) => money(r.total)} />
          <Queue icon="help" tone="warn" title="Falta definir entrega" hint="Pagados sin forma de entrega" rows={queues?.missing ?? null} extra={(r) => money(r.total)} />
          <Queue
            icon="truck"
            tone="info"
            title="Por entregar"
            hint="Alistados o en camino"
            rows={queues?.deliver ?? null}
            extra={(r) => `${STATUS_LABEL[r.status]} · ${DELIVERY_LABEL[r.delivery_type]}${r.delivery_date ? ' · ' + fmtDate(r.delivery_date) : ''}`}
          />
        </div>
      </section>
    </>
  )
}
