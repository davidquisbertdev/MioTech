import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Solo se indexan la landing y la demo; el panel privado queda fuera de los buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/demo'],
      disallow: ['/dashboard', '/orders', '/customers', '/lives', '/delivery-points', '/team', '/settings', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
