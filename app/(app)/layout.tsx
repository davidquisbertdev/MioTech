'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Shell } from '@/components/shell'
import { CreateStore } from '@/components/create-store'
import { Splash } from '@/components/ui'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading, memberships, store, usable, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !session) router.replace('/login')
  }, [loading, session, router])

  if (loading || !session) return <Splash />
  if (!memberships.length) return <CreateStore />

  if (!usable) {
    const cancelled = store?.status === 'cancelled'
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="panel max-w-md space-y-3 p-8 text-center">
          <h1 className="text-2xl font-extrabold">
            {cancelled ? 'Esta tienda fue cancelada' : 'Tu suscripción está en pausa'}
          </h1>
          <p className="text-sm text-muted">
            {store?.paused_reason ||
              (cancelled
                ? 'Contacta a Mio si crees que es un error.'
                : 'Tu período venció o está pendiente de pago. Contacta a Mio para reactivar la tienda; tus datos siguen guardados.')}
          </p>
          <button className="btn btn-ghost" onClick={signOut}>Cerrar sesión</button>
        </div>
      </main>
    )
  }

  return <Shell>{children}</Shell>
}
