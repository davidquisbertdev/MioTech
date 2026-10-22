'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { ErrorMsg, Field } from '@/components/ui'

export function CreateStore() {
  const { refresh, setStoreId, signOut } = useAuth()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const { data, error } = await supabase.from('stores').insert({ name: name.trim() }).select('id').single()
    if (error) {
      setErr(error.message)
      setBusy(false)
      return
    }
    setStoreId(data.id)
    await refresh()
    setBusy(false)
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={create} className="panel w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-extrabold">Crea tu tienda</h1>
        <p className="text-sm text-muted">
          Será el espacio donde registras pedidos, clientes y lives. Empiezas con 14 días de prueba.
        </p>
        <Field label="Nombre de la tienda">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Ropa Bella" />
        </Field>
        <ErrorMsg>{err}</ErrorMsg>
        <button className="btn btn-primary w-full" disabled={busy || !name.trim()}>Crear tienda</button>
        <button type="button" className="w-full text-sm text-muted hover:underline" onClick={signOut}>
          Si te creó el acceso una administradora, tu tienda aparecerá al ingresar de nuevo. Cerrar sesión
        </button>
      </form>
    </main>
  )
}
