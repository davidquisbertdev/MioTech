'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Logo, LogoMark } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-provider'
import { Icon, type IconName } from '@/components/icons'
import { daysLabel, membershipInfo } from '@/lib/membership'

const NAV: { href: string; label: string; short: string; icon: IconName; admin?: boolean }[] = [
  { href: '/dashboard', label: 'Panel', short: 'Panel', icon: 'panel' },
  { href: '/orders', label: 'Pedidos', short: 'Pedidos', icon: 'orders' },
  { href: '/customers', label: 'Clientes', short: 'Clientes', icon: 'customers' },
  { href: '/lives', label: 'Lives', short: 'Lives', icon: 'lives' },
  { href: '/delivery-points', label: 'Puntos de entrega', short: 'Puntos', icon: 'pin' },
  { href: '/team', label: 'Equipo', short: 'Equipo', icon: 'team', admin: true },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { store, memberships, setStoreId, fullName, session, isAdmin, signOut } = useAuth()
  const items = NAV.filter((n) => !n.admin || isAdmin)
  const isActive = (href: string) => path === href || path.startsWith(href + '/')
  const { state, daysLeft } = membershipInfo(store)

  const storePicker = (dark: boolean) =>
    memberships.length > 1 ? (
      <select
        aria-label="Tienda"
        className={
          dark
            ? 'w-full cursor-pointer rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm font-semibold text-white'
            : 'min-w-0 max-w-full cursor-pointer truncate rounded-lg border border-line bg-surface px-2 py-1.5 text-sm font-semibold'
        }
        value={store?.id}
        onChange={(e) => setStoreId(e.target.value)}
      >
        {memberships.map((m) => (
          <option key={m.store_id} value={m.store_id} className="text-black">{m.stores.name}</option>
        ))}
      </select>
    ) : (
      <p className={`truncate text-sm font-semibold ${dark ? 'text-white' : ''}`}>{store?.name}</p>
    )

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[236px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-side px-3 py-5 text-side-ink md:flex">
        <div className="px-2 text-white"><Logo size={32} /></div>

        <nav className="mt-7 flex flex-1 flex-col gap-0.5" aria-label="Principal">
          {items.map((n) => {
            const active = isActive(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                  active ? 'bg-white/12 text-white' : 'hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon name={n.icon} className={active ? 'text-brand-300' : 'opacity-80'} />
                {n.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/settings"
          aria-current={isActive('/settings') ? 'page' : undefined}
          className={`mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
            isActive('/settings') ? 'bg-white/12 text-white' : 'hover:bg-white/8 hover:text-white'
          }`}
        >
          <Icon name="settings" className={isActive('/settings') ? 'text-brand-300' : 'opacity-80'} />
          Configuración
          {state === 'expiring' && daysLeft !== null && (
            <span className="num ml-auto rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">{daysLeft} d</span>
          )}
        </Link>

        <div className="space-y-3 border-t border-white/15 px-2 pt-4">
          <div>
            {storePicker(true)}
            <p className="mt-1 truncate text-xs">{fullName || session?.user.email}</p>
          </div>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button onClick={signOut} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium hover:bg-white/8 hover:text-white">
              <Icon name="logout" size={14} />
              Salir
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Encabezado (móvil) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-2 md:hidden">
          <LogoMark size={30} />
          <div className="min-w-0 flex-1">{storePicker(false)}</div>
          <Link
            href="/settings"
            aria-label="Configuración"
            aria-current={isActive('/settings') ? 'page' : undefined}
            className={`grid h-9 w-9 place-items-center rounded-lg hover:bg-sunken hover:text-ink ${isActive('/settings') ? 'bg-brand-100 text-brand-700' : 'text-muted'}`}
          >
            <Icon name="settings" />
          </Link>
        </header>

        {state === 'expiring' && daysLeft !== null && !isActive('/settings') && (
          <Link href="/settings" className="flex items-center justify-center gap-2 bg-warn-soft px-4 py-2 text-center text-sm font-medium text-warn hover:underline">
            Tu membresía vence en {daysLabel(daysLeft)}. Ver detalles
            <Icon name="chevron" size={14} />
          </Link>
        )}

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-8 sm:pt-8 md:pb-12">{children}</main>
      </div>

      {/* Navegación inferior (móvil) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((n) => {
          const active = isActive(n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                active ? 'text-brand-700' : 'text-muted'
              }`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${active ? 'bg-brand-100' : ''}`}>
                <Icon name={n.icon} size={19} />
              </span>
              {n.short}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
