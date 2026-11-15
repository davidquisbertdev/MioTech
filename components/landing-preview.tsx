'use client'
import { useEffect, useMemo, useState } from 'react'
import { SalesChart } from '@/components/sales-chart'
import { Icon } from '@/components/icons'
import { demoPaidOrders, demoQueues } from '@/lib/demo-data'
import { money, todayISO } from '@/lib/format'
import { summarize } from '@/lib/sales'

/** Vista real del panel (mismos componentes que la app) con datos de ejemplo, para el hero. */
export function LandingPreview() {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(todayISO()), [])
  const sales = useMemo(() => (today ? summarize(demoPaidOrders(today), '7d', today) : null), [today])
  const unpaid = today ? demoQueues(today).unpaid : []
  const pct = sales && sales.prevTotal > 0 ? Math.round(((sales.total - sales.prevTotal) / sales.prevTotal) * 100) : 0

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)]" aria-label="Vista del panel de Mio con datos de ejemplo" role="img">
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium text-muted">Ventas cobradas · 7 días</p>
          <p className="num mt-1 text-xl font-bold tracking-tight sm:text-2xl">{sales ? money(sales.total) : <span className="skeleton inline-block h-7 w-28" />}</p>
          {sales && pct !== 0 && (
            <p className={`num mt-1 inline-flex items-center gap-1 text-xs font-semibold ${pct > 0 ? 'text-ok' : 'text-danger'}`}>
              <Icon name={pct > 0 ? 'up' : 'down'} size={14} />
              {pct > 0 ? '+' : '−'}{Math.abs(pct)} % que la semana previa
            </p>
          )}
        </div>
        <div className="bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium text-muted">Por cobrar</p>
          <p className="num mt-1 text-xl font-bold tracking-tight sm:text-2xl">{money(unpaid.reduce((s, r) => s + r.total, 0))}</p>
          <p className="mt-1 text-xs font-medium text-warn">{unpaid.length} pedidos sin pago</p>
        </div>
      </div>
      <div className="border-t border-line p-4 sm:p-5">
        <p className="mb-2 text-sm font-bold">Ventas por día <span className="font-normal text-muted">· en Bs</span></p>
        {sales && today ? <SalesChart days={sales.days} today={today} /> : <div className="skeleton h-60 w-full" />}
      </div>
    </div>
  )
}
