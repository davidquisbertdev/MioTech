import Link from 'next/link'

const TONES: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-sky-100 text-sky-800',
  brand: 'bg-brand-100 text-brand-800',
  slate: 'bg-slate-200 text-slate-700',
}
const TONE_OF: Record<string, string> = {
  pending: 'amber', paid: 'green', refunded: 'slate',
  to_prepare: 'amber', prepared: 'brand', dispatched: 'blue', delivered: 'green', cancelled: 'slate',
  to_be_defined: 'amber',
}

export function Badge({ value, label }: { value: string; label: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[TONE_OF[value] ?? 'brand']}`}>
      {label}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>
}

export function ErrorMsg({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>
}

export function Splash() {
  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted">Cargando…</div>
  )
}

export function OrderLink({ id, n }: { id: string; n: number }) {
  return (
    <Link href={`/orders/${id}`} className="font-semibold text-brand-700 hover:underline">
      #{n}
    </Link>
  )
}
