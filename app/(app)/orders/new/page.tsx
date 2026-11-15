'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { ErrorMsg, Field, PageHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { money, todayISO } from '@/lib/format'

type Item = { description: string; quantity: number | string; unit_price: number | string }

export default function NewOrder() {
  const { store } = useAuth()
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [lives, setLives] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState(false)
  const [c, setC] = useState({ full_name: '', phone: '', tiktok_username: '', city: '' })
  const [liveId, setLiveId] = useState('')
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unit_price: '' }])
  const [paid, setPaid] = useState(false)
  const [method, setMethod] = useState('QR')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!store) return
    supabase.from('customers').select('id, full_name, phone').eq('store_id', store.id).order('full_name')
      .then(({ data }) => setCustomers(data ?? []))
    supabase.from('lives').select('id, title, live_date').eq('store_id', store.id).order('live_date', { ascending: false }).limit(30)
      .then(({ data }) => {
        setLives(data ?? [])
        const today = (data ?? []).find((l) => l.live_date === todayISO())
        if (today) setLiveId(today.id)
      })
  }, [store])

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0)
  const setItem = (idx: number, patch: Partial<Item>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!store) return
    setBusy(true)
    setErr('')
    const fail = (m: string) => { setErr(m); setBusy(false) }

    let cid = customerId
    if (newCustomer) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          store_id: store.id,
          full_name: c.full_name.trim(),
          phone: c.phone.trim() || null,
          tiktok_username: c.tiktok_username.trim() || null,
          city: c.city.trim() || null,
        })
        .select('id')
        .single()
      if (error) return fail(error.code === '23505' ? 'Ya existe un cliente con ese teléfono.' : error.message)
      cid = data.id
    }
    if (!cid) return fail('Elige o crea un cliente.')

    const valid = items.filter((i) => i.description.trim())
    if (!valid.length) return fail('Agrega al menos un producto.')

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        store_id: store.id,
        customer_id: cid,
        live_id: liveId || null,
        payment_status: paid ? 'paid' : 'pending',
        paid_at: paid ? new Date().toISOString() : null,
        payment_method: paid ? method : null,
        notes: notes.trim() || null,
      })
      .select('id')
      .single()
    if (error) return fail(error.message)

    const { error: itemsErr } = await supabase.from('order_items').insert(
      valid.map((i) => ({
        store_id: store.id,
        order_id: order.id,
        description: i.description.trim(),
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
      }))
    )
    if (itemsErr) return fail(itemsErr.message)
    router.push(`/orders/${order.id}`)
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <PageHeader title="Nuevo pedido" subtitle="Anótalo rápido mientras sigues en vivo." />

      <section className="panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Cliente</h2>
          <button type="button" className="link text-sm" onClick={() => setNewCustomer(!newCustomer)}>
            {newCustomer ? 'Elegir uno existente' : 'Es un cliente nuevo'}
          </button>
        </div>
        {newCustomer ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre"><input className="input" required value={c.full_name} onChange={(e) => setC({ ...c, full_name: e.target.value })} /></Field>
            <Field label="WhatsApp"><input className="input" inputMode="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
            <Field label="Usuario de TikTok"><input className="input" value={c.tiktok_username} onChange={(e) => setC({ ...c, tiktok_username: e.target.value })} placeholder="@usuario" /></Field>
            <Field label="Ciudad">
              <select className="input" value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })}>
                <option value="">Selecciona un departamento</option>
                {['Chuquisaca', 'Cochabamba', 'Beni', 'La Paz', 'Oruro', 'Potosí', 'Santa Cruz', 'Tarija', 'Pando'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} aria-label="Cliente">
            <option value="">Elige un cliente…</option>
            {customers.map((x) => <option key={x.id} value={x.id}>{x.full_name}{x.phone ? ` · ${x.phone}` : ''}</option>)}
          </select>
        )}
        <Field label="Live de origen">
          <select className="input" value={liveId} onChange={(e) => setLiveId(e.target.value)}>
            <option value="">Sin live</option>
            {lives.map((l) => <option key={l.id} value={l.id}>{l.title || 'Live'} · {l.live_date}</option>)}
          </select>
        </Field>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-bold">Productos</h2>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:grid-cols-[1fr_80px_110px_auto]">
            <Field label={i === 0 ? 'Descripción' : ''} className="col-span-3 sm:col-span-1">
              <input className="input" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Ej: Blusa floral talla M" aria-label="Descripción del producto" />
            </Field>
            <Field label={i === 0 ? 'Cant.' : ''}>
              <input className="input" type="number" inputMode="numeric" min={1} value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} aria-label="Cantidad" />
            </Field>
            <Field label={i === 0 ? 'Precio' : ''}>
              <input className="input" type="number" inputMode="decimal" min={0} step="0.01" placeholder="Bs" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: e.target.value })} aria-label="Precio unitario" />
            </Field>
            <button type="button" className="btn btn-ghost btn-icon" aria-label="Quitar producto" title="Quitar producto" disabled={items.length === 1} onClick={() => setItems(items.filter((_, k) => k !== i))}><Icon name="x" size={16} /></button>
          </div>
        ))}
        <button type="button" className="btn btn-soft" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: '' }])}>
          <Icon name="plus" size={16} />
          Agregar producto
        </button>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-lg font-bold">Pago y notas</h2>
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-brand-600" />
          Ya pagó
        </label>
        {paid && (
          <Field label="Método de pago">
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {['QR', 'Transferencia', 'Efectivo', 'Otro'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        )}
        <Field label="Notas"><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </section>

      <ErrorMsg>{err}</ErrorMsg>
      <div className="panel sticky bottom-[4.5rem] z-10 flex items-center justify-between gap-4 px-4 py-3 shadow-[0_8px_24px_-8px_rgb(0_0_0/0.2)] md:bottom-4">
        <p className="text-sm text-muted">
          Total <span className="num ml-1 text-xl font-bold text-ink">{money(total)}</span>
        </p>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar pedido'}</button>
      </div>
    </form>
  )
}
