import type { Store } from './types'

/** Plan único de Mio. Lo usan la landing y la vista de configuración. */
export const PLAN = { name: 'Membresía Mio', price: 50, priceLabel: 'US$ 50', period: 'al mes', trialDays: 14 }

/** WhatsApp de ventas/soporte (opcional). Solo dígitos con código de país, p. ej. 59170000000. */
const digits = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '').replace(/[^\d]/g, '')
export const CONTACT_WHATSAPP = digits ? `https://wa.me/${digits}` : null

export type MembershipState = 'cancelled' | 'paused' | 'expired' | 'expiring' | 'active' | 'unlimited'

const DAY = 86_400_000
/** Días de aviso antes del vencimiento. */
export const WARN_DAYS = 7

export function membershipInfo(store: Store | null, now = Date.now()) {
  const expires = store?.subscription_expires_at ? new Date(store.subscription_expires_at) : null
  const daysLeft = expires ? Math.max(0, Math.ceil((expires.getTime() - now) / DAY)) : null

  let state: MembershipState = 'active'
  if (store?.status === 'cancelled') state = 'cancelled'
  else if (store?.status === 'paused') state = 'paused'
  else if (!expires) state = 'unlimited'
  else if (expires.getTime() <= now) state = 'expired'
  else if (daysLeft !== null && daysLeft <= WARN_DAYS) state = 'expiring'

  return { state, expires, daysLeft }
}

export const daysLabel = (n: number) => (n === 1 ? '1 día' : `${n} días`)
