import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo: el panel de ventas con datos de ejemplo',
  description:
    'Prueba el panel de Mio sin crear cuenta: ventas por día, pedidos por cobrar, por alistar y entregas del día, con datos de ejemplo.',
  alternates: { canonical: '/demo' },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
