'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase, CREATE_EMPLOYEE_FN } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Empty, ErrorMsg, Field, PageHeader } from '@/components/ui'
import { ROLE_LABEL } from '@/lib/labels'

const blank = { full_name: '', email: '', password: '', role: 'employee' }

export default function TeamPage() {
  const { store, isAdmin, session } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [form, setForm] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const load = useCallback(async () => {
    if (!store) return
    const { data: members } = await supabase.from('store_members').select('user_id, role, active, created_at').eq('store_id', store.id).order('created_at')
    const ids = (members ?? []).map((m) => m.user_id)
    const { data: profiles } = ids.length ? await supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] as any[] }
    const names = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    setRows((members ?? []).map((m) => ({ ...m, full_name: names[m.user_id] })))
  }, [store])
  useEffect(() => { load() }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!store) return
    setBusy(true); setErr(''); setOk('')
    const { data, error } = await supabase.functions.invoke(CREATE_EMPLOYEE_FN, {
      body: { store_id: store.id, ...form, full_name: form.full_name.trim(), email: form.email.trim() },
    })
    if (error) {
      let msg = error.message
      try { const j = await (error as any).context.json(); if (j?.error) msg = j.error } catch {}
      setErr(msg)
    } else {
      setOk(`Listo: ${data.email} ya puede ingresar como ${ROLE_LABEL[data.role].toLowerCase()}.`)
      setForm(blank)
      load()
    }
    setBusy(false)
  }

  async function update(userId: string, values: Record<string, any>) {
    if (!store) return
    setErr('')
    const { error } = await supabase.from('store_members').update(values).eq('store_id', store.id).eq('user_id', userId)
    if (error) setErr(error.message)
    load()
  }

  if (!isAdmin) return <Empty>Solo los administradores pueden gestionar el equipo.</Empty>

  return (
    <>
      <PageHeader title="Equipo" subtitle="Crea accesos para quienes te ayudan con los pedidos." />
      <form onSubmit={create} className="panel mb-6 grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Crear usuario</h2>
        <Field label="Nombre"><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Correo"><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Contraseña (mínimo 8 caracteres)"><input className="input" type="text" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" /></Field>
        <Field label="Rol">
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="employee">Empleado</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>
        <div className="sm:col-span-2"><ErrorMsg>{err}</ErrorMsg></div>
        {ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">{ok}</p>}
        <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button></div>
      </form>

      {rows === null ? <Empty>Cargando…</Empty> : (
        <ul className="panel divide-y divide-line">
          {rows.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className={m.active ? '' : 'opacity-50'}>
                <p className="font-semibold">{m.full_name || 'Sin nombre'}{m.user_id === session?.user.id && <span className="ml-2 text-xs text-muted">(tú)</span>}</p>
                <p className="text-xs text-muted">{ROLE_LABEL[m.role]}{m.active ? '' : ' · desactivado'}</p>
              </div>
              {m.user_id !== session?.user.id && (
                <div className="flex gap-4 text-xs">
                  <button className="text-brand-700 hover:underline" onClick={() => update(m.user_id, { role: m.role === 'admin' ? 'employee' : 'admin' })}>
                    {m.role === 'admin' ? 'Pasar a empleado' : 'Hacer administrador'}
                  </button>
                  <button className="text-red-600 hover:underline" onClick={() => update(m.user_id, { active: !m.active })}>
                    {m.active ? 'Desactivar' : 'Reactivar'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
