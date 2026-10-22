'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Empty, ErrorMsg, Field, PageHeader } from '@/components/ui'
import { monthStartISO, money, whatsappLink } from '@/lib/format'

const blank = { id: '', full_name: '', phone: '', tiktok_username: '', city: '', notes: '' }

export default function CustomersPage() {
  const { store, isAdmin } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [month, setMonth] = useState<Record<string, any>>({})
  const [q, setQ] = useState('')
  const [form, setForm] = useState<typeof blank | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!store) return
    const [c, m] = await Promise.all([
      supabase.from('customers').select('*').eq('store_id', store.id).order('full_name'),
      supabase.from('v_customer_monthly_orders').select('*').eq('store_id', store.id).eq('month', monthStartISO()),
    ])
    setRows(c.data ?? [])
    setMonth(Object.fromEntries((m.data ?? []).map((r: any) => [r.customer_id, r])))
  }, [store])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (rows ?? []).filter((r) => !t || r.full_name.toLowerCase().includes(t) || r.phone?.includes(t) || r.tiktok_username?.toLowerCase().includes(t))
  }, [rows, q])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!store || !form) return
    setErr('')
    const values = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      tiktok_username: form.tiktok_username.trim() || null,
      city: form.city.trim() || null,
      notes: form.notes.trim() || null,
    }
    const { error } = form.id
      ? await supabase.from('customers').update(values).eq('id', form.id)
      : await supabase.from('customers').insert({ ...values, store_id: store.id })
    if (error) return setErr(error.code === '23505' ? 'Ya existe un cliente con ese teléfono.' : error.message)
    setForm(null)
    load()
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Quiénes te compran y cuánto llevan este mes."
        action={<button className="btn btn-primary" onClick={() => { setErr(''); setForm({ ...blank }) }}>Nuevo cliente</button>}
      />

      {form && (
        <form onSubmit={save} className="panel mb-6 grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <Field label="Nombre"><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="WhatsApp"><input className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Usuario de TikTok"><input className="input" value={form.tiktok_username} onChange={(e) => setForm({ ...form, tiktok_username: e.target.value })} /></Field>
          <Field label="Ciudad"><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Notas" className="sm:col-span-2"><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="sm:col-span-2"><ErrorMsg>{err}</ErrorMsg></div>
          <div className="flex gap-2 sm:col-span-2">
            <button className="btn btn-primary">Guardar cliente</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            {form.id && isAdmin && (
              <button
                type="button"
                className="btn btn-danger ml-auto"
                onClick={async () => {
                  if (!confirm('¿Eliminar este cliente?')) return
                  const { error } = await supabase.from('customers').delete().eq('id', form.id)
                  if (error) return setErr('No se puede eliminar: el cliente tiene pedidos.')
                  setForm(null); load()
                }}
              >Eliminar</button>
            )}
          </div>
        </form>
      )}

      <input className="input mb-4 sm:max-w-sm" placeholder="Buscar por nombre, teléfono o TikTok" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" />

      {rows === null ? <Empty>Cargando…</Empty> : filtered.length === 0 ? <Empty>Aún no hay clientes. Se crean solos al registrar un pedido.</Empty> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Contacto</th>
                <th className="px-4 py-2 font-medium">Ciudad</th>
                <th className="px-4 py-2 text-right font-medium">Pedidos del mes</th>
                <th className="px-4 py-2 text-right font-medium">Total del mes</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-semibold">{r.full_name}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {r.phone && <a className="text-brand-700 hover:underline" href={whatsappLink(r.phone)} target="_blank" rel="noreferrer">{r.phone}</a>}
                    {r.tiktok_username && <span className="ml-2">{r.tiktok_username}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{r.city ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">{month[r.id]?.orders_count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{money(month[r.id]?.total_amount)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="text-brand-700 hover:underline" onClick={() => { setErr(''); setForm({ id: r.id, full_name: r.full_name, phone: r.phone ?? '', tiktok_username: r.tiktok_username ?? '', city: r.city ?? '', notes: r.notes ?? '' }) }}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
