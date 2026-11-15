'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { DashboardView } from '@/components/dashboard-view'
import { Logo } from '@/components/logo'
import { Icon } from '@/components/icons'
import { demoDeliveries, demoPaidOrders, demoQueues } from '@/lib/demo-data'
import { todayISO, tomorrowISO } from '@/lib/format'
import { summarize, type Period } from '@/lib/sales'

export default function DemoPage() {
  const [period, setPeriod] = useState<Period>('7d')
  // Las fechas dependen del reloj del visitante: se calculan tras montar para no desalinear la hidratación.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(todayISO()), [])

  const sales = useMemo(() => (today ? summarize(demoPaidOrders(today), period, today) : null), [today, period])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
          <Link href="/" aria-label="Mio, volver al inicio"><Logo size={30} /></Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-ghost hidden sm:inline-flex">
              <Icon name="back" size={16} />
              Volver
            </Link>
            <Link href="/login?modo=registro" className="btn btn-primary">Probar con mi tienda</Link>
          </div>
        </div>
        <p className="bg-brand-50 px-4 py-1.5 text-center text-sm text-brand-800">
          Estás viendo una demo con datos de ejemplo. Nada de aquí es de una tienda real.
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <DashboardView
          demo
          sales={sales}
          queues={today ? demoQueues(today) : null}
          deliveries={today ? demoDeliveries() : null}
          period={period}
          onPeriod={setPeriod}
          err=""
          today={today ?? '2026-01-01'}
          tomorrow={today ? tomorrowISO() : '2026-01-02'}
        />

        <section className="mt-12 rounded-xl bg-side px-6 py-10 text-center text-side-ink sm:px-10">
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Así se vería tu tienda mañana</h2>
          <p className="mx-auto mt-2 max-w-md">
            Crea tu cuenta, registra tu primer pedido y el panel se llena con tus propias ventas.
          </p>
          <Link href="/login?modo=registro" className="btn btn-primary mt-6">Empezar mi prueba de 14 días</Link>
        </section>
      </main>
    </div>
  )
}
