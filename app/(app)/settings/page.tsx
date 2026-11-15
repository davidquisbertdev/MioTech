'use client'
import { useAuth } from '@/components/auth-provider'
import { ThemeToggle } from '@/components/theme-provider'
import { PageHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { ROLE_LABEL } from '@/lib/labels'
import { CONTACT_WHATSAPP, PLAN, daysLabel, membershipInfo, type MembershipState } from '@/lib/membership'

const STATE: Record<MembershipState, { label: string; tone: string }> = {
  active: { label: 'Activa', tone: 'bg-ok-soft text-ok' },
  unlimited: { label: 'Activa', tone: 'bg-ok-soft text-ok' },
  expiring: { label: 'Por vencer', tone: 'bg-warn-soft text-warn' },
  expired: { label: 'Vencida', tone: 'bg-danger-soft text-danger' },
  paused: { label: 'En pausa', tone: 'bg-warn-soft text-warn' },
  cancelled: { label: 'Cancelada', tone: 'bg-sunken text-muted' },
}

const fmtLong = (d: Date) =>
  d.toLocaleDateString('es-BO', { timeZone: 'America/La_Paz', day: 'numeric', month: 'long', year: 'numeric' })

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 text-sm sm:px-5">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  )
}

export default function SettingsPage() {
  const { store, memberships, setStoreId, fullName, session, isAdmin, signOut } = useAuth()
  const { state, expires, daysLeft } = membershipInfo(store)
  const badge = STATE[state]
  // La barra representa un ciclo mensual: llena con 30 días o más por delante.
  const pct = daysLeft === null ? 100 : Math.min(100, Math.round((daysLeft / 30) * 100))
  const barTone = state === 'expiring' ? 'bg-warn' : state === 'expired' ? 'bg-danger' : 'bg-brand-500'

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configuración" subtitle="Tu membresía, tu tienda y tu cuenta." />

      {/* Membresía */}
      <section aria-labelledby="membresia" className="panel mb-6">
        <header className="panel-head sm:px-5">
          <h2 id="membresia" className="font-bold">Membresía</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.tone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {badge.label}
          </span>
        </header>

        <div className="px-4 py-5 sm:px-5">
          {daysLeft === null ? (
            <>
              <p className="text-2xl font-bold tracking-tight">Sin fecha de vencimiento</p>
              <p className="mt-1 text-sm text-muted">Tu tienda no tiene un vencimiento registrado.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">{daysLeft > 0 ? 'Te quedan' : 'Tu membresía'}</p>
              <p className="num text-4xl font-bold tracking-tight">
                {daysLeft > 0 ? daysLabel(daysLeft) : 'venció'}
              </p>
              <p className="mt-1 text-sm text-muted">
                {daysLeft > 0 ? 'Vence el ' : 'Venció el '}
                <span className="font-semibold text-ink">{expires && fmtLong(expires)}</span>
              </p>

              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-sunken"
                role="progressbar"
                aria-label="Días restantes de la membresía"
                aria-valuemin={0}
                aria-valuemax={30}
                aria-valuenow={Math.min(30, daysLeft)}
                aria-valuetext={`${daysLabel(daysLeft)} restantes`}
              >
                <div className={`h-full rounded-full ${barTone}`} style={{ width: `${Math.max(pct, daysLeft > 0 ? 3 : 0)}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted">
                <span>Hoy</span>
                <span>{daysLeft > 30 ? 'Más de 30 días' : '30 días'}</span>
              </div>
            </>
          )}

          {state === 'expiring' && (
            <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
              Renueva antes del vencimiento para no perder el acceso. Tus datos se conservan aunque venza.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-5">
          <div>
            <p className="text-sm font-semibold">{PLAN.name}</p>
            <p className="text-sm text-muted">
              <span className="num font-semibold text-ink">{PLAN.priceLabel}</span> {PLAN.period} por tienda
            </p>
          </div>
          {CONTACT_WHATSAPP ? (
            <a href={CONTACT_WHATSAPP} target="_blank" rel="noreferrer" className="btn btn-primary">
              <Icon name="chat" size={16} />
              Renovar por WhatsApp
            </a>
          ) : (
            <p className="max-w-xs text-sm text-muted">Para renovar o cambiar tu membresía, contacta a Mio.</p>
          )}
        </div>
      </section>

      {/* Tienda */}
      <section aria-labelledby="tienda" className="panel mb-6">
        <header className="panel-head sm:px-5"><h2 id="tienda" className="font-bold">Tienda</h2></header>
        <dl className="divide-y divide-line">
          <Row label="Nombre">
            {memberships.length > 1 ? (
              <select aria-label="Tienda activa" className="input min-h-9 w-auto py-1" value={store?.id} onChange={(e) => setStoreId(e.target.value)}>
                {memberships.map((m) => <option key={m.store_id} value={m.store_id}>{m.stores.name}</option>)}
              </select>
            ) : (
              store?.name
            )}
          </Row>
          <Row label="Tu rol">{ROLE_LABEL[isAdmin ? 'admin' : 'employee']}</Row>
        </dl>
      </section>

      {/* Cuenta */}
      <section aria-labelledby="cuenta" className="panel mb-6">
        <header className="panel-head sm:px-5"><h2 id="cuenta" className="font-bold">Cuenta</h2></header>
        <dl className="divide-y divide-line">
          <Row label="Nombre">{fullName || '—'}</Row>
          <Row label="Correo"><span className="break-all">{session?.user.email}</span></Row>
          <Row label="Color de la app"><ThemeToggle /></Row>
        </dl>
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <button className="btn btn-ghost" onClick={signOut}>
            <Icon name="logout" size={16} />
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  )
}
