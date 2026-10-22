'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-provider'

const NAV = [
  { href: '/dashboard', label: 'Panel' },
  { href: '/orders', label: 'Pedidos' },
  { href: '/customers', label: 'Clientes' },
  { href: '/lives', label: 'Lives' },
  { href: '/delivery-points', label: 'Puntos de entrega' },
  { href: '/team', label: 'Equipo', admin: true },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { store, memberships, setStoreId, fullName, session, isAdmin, signOut } = useAuth()
  const items = NAV.filter((n) => !n.admin || isAdmin)

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="bg-side text-side-ink md:sticky md:top-0 md:flex md:h-screen md:flex-col md:p-5">
        <div className="flex items-center justify-between px-4 pt-4 text-white md:px-1 md:pt-0">
          <Logo />
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:mt-6 md:flex-1 md:flex-col md:overflow-visible md:px-0" aria-label="Principal">
          {items.map((n) => {
            const active = path === n.href || path.startsWith(n.href + '/')
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active ? 'bg-brand-600 text-white' : 'hover:bg-white/10'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden space-y-3 border-t border-white/15 pt-4 md:block">
          {memberships.length > 1 ? (
            <select
              aria-label="Tienda"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-sm text-white"
              value={store?.id}
              onChange={(e) => setStoreId(e.target.value)}
            >
              {memberships.map((m) => (
                <option key={m.store_id} value={m.store_id} className="text-black">{m.stores.name}</option>
              ))}
            </select>
          ) : (
            <p className="truncate text-sm font-semibold text-white">{store?.name}</p>
          )}
          <p className="truncate text-xs">{fullName || session?.user.email}</p>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <button onClick={signOut} className="text-xs underline hover:text-white">Salir</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 md:hidden">
          <span className="truncate text-sm font-semibold">{store?.name}</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={signOut} className="text-xs text-muted underline">Salir</button>
          </div>
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
