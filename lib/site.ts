/** URL pública del sitio, para canónicas, sitemap y Open Graph. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '')

export const SITE_NAME = 'Mio'
export const SITE_TITLE = 'Mio · Control de pedidos para ventas por TikTok Live'
export const SITE_DESCRIPTION =
  'Registra cada pedido de tus lives de TikTok, cobra, alista y entrega sin perder ninguno. Panel de ventas, clientes, puntos de entrega y equipo. Prueba 14 días.'
