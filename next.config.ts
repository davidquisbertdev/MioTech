import type { NextConfig } from 'next'

const dev = process.env.NODE_ENV !== 'production'

// Solo se permite hablar con nuestro propio proyecto de Supabase (REST, auth, realtime y edge functions).
let supabaseHost = '*.supabase.co'
try {
  supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host
} catch {}

const csp = [
  `default-src 'self'`,
  // Next inyecta scripts en línea para hidratar; en desarrollo además necesita eval.
  `script-src 'self' 'unsafe-inline'${dev ? ` 'unsafe-eval'` : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${dev ? ' ws://localhost:* http://localhost:*' : ''}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    // El panel privado y el acceso no deben aparecer en buscadores.
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    const privatePaths = ['dashboard', 'orders', 'customers', 'lives', 'delivery-points', 'team', 'settings', 'login']
    return [
      { source: '/:path*', headers: securityHeaders },
      ...privatePaths.map((p) => ({ source: `/${p}/:path*`, headers: noindex })),
    ]
  },
}

export default nextConfig
