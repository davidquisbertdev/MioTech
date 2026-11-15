import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons'

const TONES: Record<string, string> = {
  amber: 'bg-warn-soft text-warn',
  green: 'bg-ok-soft text-ok',
  blue: 'bg-info-soft text-info',
  brand: 'bg-brand-100 text-brand-800',
  slate: 'bg-sunken text-muted',
}
const TONE_OF: Record<string, string> = {
  pending: 'amber', paid: 'green', refunded: 'slate',
  to_prepare: 'amber', prepared: 'brand', dispatched: 'blue', delivered: 'green', cancelled: 'slate',
  to_be_defined: 'amber',
}

export function Badge({ value, label }: { value: string; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[TONE_OF[value] ?? 'brand']}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
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
      {label && <span className="mb-1 block font-medium text-ink">{label}</span>}
      {children}
    </label>
  )
}

export function Empty({ children, title, icon, action }: { children: React.ReactNode; title?: string; icon?: IconName; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
      {icon && (
        <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon name={icon} size={20} />
        </span>
      )}
      {title && <p className="font-semibold">{title}</p>}
      <p className="mx-auto max-w-sm text-sm text-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorMsg({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{children}</p>
}

export function OkMsg({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{children}</p>
}

/** Filas de carga con la misma altura que una lista real. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="panel divide-y divide-line" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="skeleton h-4" style={{ width: `${32 + ((i * 17) % 30)}%` }} />
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Cargando">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
    </div>
  )
}

export function OrderLink({ id, n }: { id: string; n: number }) {
  return (
    <Link href={`/orders/${id}`} className="link num font-semibold" onClick={(e) => e.stopPropagation()}>
      #{n}
    </Link>
  )
}

export function SearchInput({ value, onChange, placeholder, label, className = '' }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        className="input pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
    </div>
  )
}
