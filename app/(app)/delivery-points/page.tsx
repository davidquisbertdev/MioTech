'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Empty, ErrorMsg, Field, PageHeader } from '@/components/ui'

export default function DeliveryPointsPage() {
  const { store, isAdmin } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!store) return
    const { data } = await supabase.from('delivery_points').select('*').eq('store_id', store.id).order('name')
    setRows(data ?? [])
  }, [store])
  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!store) return
    const { error } = await supabase.from('delivery_points').insert({ store_id: store.id, name: name.trim(), address: address.trim() || null })
    if (error) return setErr(error.message)
    setName(''); setAddress(''); setErr(''); load()
  }

  return (
    <>
      <PageHeader title="Puntos de entrega" subtitle="Lugares donde tus clientas recogen sus pedidos." />
      {isAdmin ? (
        <form onSubmit={add} className="panel mb-6 grid items-end gap-3 p-5 sm:grid-cols-[1fr_1.5fr_auto]">
          <Field label="Nombre"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Plaza 24 de Septiembre" /></Field>
          <Field label="Dirección o referencia"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <button className="btn btn-primary">Agregar punto</button>
          <div className="sm:col-span-3"><ErrorMsg>{err}</ErrorMsg></div>
        </form>
      ) : (
        <p className="mb-4 text-sm text-muted">Solo un administrador puede agregar o cambiar puntos de entrega.</p>
      )}

      {rows === null ? <Empty>Cargando…</Empty> : rows.length === 0 ? <Empty>No hay puntos de entrega todavía.</Empty> : (
        <ul className="panel divide-y divide-line">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className={p.active ? '' : 'opacity-50'}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{p.address || 'Sin dirección'}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-4 text-xs">
                  <button className="text-brand-700 hover:underline" onClick={async () => { await supabase.from('delivery_points').update({ active: !p.active }).eq('id', p.id); load() }}>
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button className="text-red-600 hover:underline" onClick={async () => { if (confirm('¿Eliminar este punto?')) { await supabase.from('delivery_points').delete().eq('id', p.id); load() } }}>Eliminar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
