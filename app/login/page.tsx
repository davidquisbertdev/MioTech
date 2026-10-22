'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-provider'
import { ErrorMsg, Field } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (!loading && session) router.replace('/dashboard')
  }, [loading, session, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    setInfo('')
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr('Correo o contraseña incorrectos.')
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) setErr(error.message)
      else if (!data.session) setInfo('Te enviamos un correo para confirmar tu cuenta. Después de confirmarlo, ingresa aquí.')
    }
    setBusy(false)
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-side p-12 text-side-ink lg:flex lg:flex-col lg:justify-between">
        <div className="text-white"><Logo size={44} /></div>
        <div>
          <h2 className="max-w-md text-5xl font-extrabold leading-[1.05] text-white">
            Cada pedido de tu live, en su lugar.
          </h2>
          <p className="mt-5 max-w-sm text-lg text-side-ink/90">
            Anota lo que te piden mientras vendes, cobra y alista, y no pierdas a nadie en el camino a la entrega.
          </p>
        </div>
        <svg className="absolute -bottom-24 -right-24 opacity-20" width="420" height="420" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M10 29V15M10 19a5 5 0 0 1 10 0v10M20 19a5 5 0 0 1 10 0v10" fill="none" stroke="var(--brand-300)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:invisible"><Logo /></div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <h1 className="text-3xl font-extrabold">{mode === 'in' ? 'Ingresa a tu tienda' : 'Crea tu cuenta'}</h1>
          <p className="mt-1 text-sm text-muted">
            {mode === 'in' ? 'Usa el correo con el que te registraste.' : 'Después podrás crear tu tienda y sumar a tu equipo.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'up' && (
              <Field label="Tu nombre">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </Field>
            )}
            <Field label="Correo">
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </Field>
            <Field label="Contraseña">
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
            </Field>
            <ErrorMsg>{err}</ErrorMsg>
            {info && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{info}</p>}
            <button className="btn btn-primary w-full" disabled={busy}>
              {busy ? 'Un momento…' : mode === 'in' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <button
            type="button"
            className="mt-5 text-sm font-medium text-brand-700 hover:underline"
            onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); setInfo('') }}
          >
            {mode === 'in' ? '¿Aún no tienes cuenta? Crea una' : '¿Ya tienes cuenta? Ingresa'}
          </button>
          <p className="mt-6 text-xs text-muted">
            Si eres empleada o empleado, pide a tu administrador que te cree el acceso.
          </p>
        </div>
      </section>
    </main>
  )
}
