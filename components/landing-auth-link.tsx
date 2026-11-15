'use client'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

/** "Ingresar" para visitantes; "Ir a mi panel" si ya hay sesión. */
export function LandingAuthLink({ className }: { className: string }) {
  const { session } = useAuth()
  return session ? (
    <Link href="/dashboard" className={className}>Ir a mi panel</Link>
  ) : (
    <Link href="/login" className={className}>Ingresar</Link>
  )
}
