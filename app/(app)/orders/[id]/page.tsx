'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Badge, Empty, ErrorMsg, Field } from '@/components/ui'
import { DELIVERY_LABEL, FIELD_LABEL, PAYMENT_LABEL, STATUS_LABEL, VALUE_LABEL } from '@/lib/labels'
import { fmtDateTime, money, toLocalInput, whatsappLink } from '@/lib/format'

const NEXT: Record<string, { to: string; label: string } | undefined> = {
  to_prepare: { to: 'prepared', label: 'Marcar alistado' },
  prepared: { to: 'dispatched', label: 'Despachar' },
  dispatched: { to: 'delivered', label: 'Marcar entregado' },
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { store, isAdmin } = useAuth()
  const [o, setO] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [points, setPoints] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [pay, setPay] = useState({ payment_status: 'pending', payment_method: '', payment_reference: '' })
  const [del, setDel] = useState<any>({})
  const [extra, setExtra] = useState({ notes: '', remind_at: '' })
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: '' })

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, customers(full_name, phone, tiktok_username, city), lives(title, live_date)')
      .eq('id', id)
      .maybeSingle()
    if (!data) return setO(false)
    setO(data)
    setPay({ payment_status: data.payment_status, payment_method: data.payment_method ?? '', payment_reference: data.payment_reference ?? '' })
    setDel({
      delivery_type: data.delivery_type,
      delivery_point_id: data.delivery_point_id ?? '',
      delivery_address: data.delivery_address ?? '',
      delivery_city: data.delivery_city ?? '',
      delivery_date: data.delivery_date ?? '',
      delivery_time_from: (data.delivery_time_from ?? '').slice(0, 5),
      delivery_time_to: (data.delivery_time_to ?? '').slice(0, 5),
      delivery_notes: data.delivery_notes ?? '',
    })
    setExtra({ notes: data.notes ?? '', remind_at: toLocalInput(data.remind_at) })
    const [i, e] = await Promise.all([
      supabase.from('order_items').select('*').eq('order_id', id).order('description'),
      supabase.from('order_events').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    ])
    setItems(i.data ?? [])
    setEvents(e.data ?? [])
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!store) return
    supabase.from('delivery_points').select('id, name').eq('store_id', store.id).eq('active', true).order('name')
      .then(({ data }) => setPoints(data ?? []))
  }, [store])

  async function patch(values: Record<string, any>) {
    setErr('')
    const { error } = await supabase.from('orders').update(values).eq('id', id)
    if (error) setErr(error.message)
    await load()
  }

  const nn = (v: string) => (v === '' ? null : v)

  if (o === null) return <Empty>Cargando…</Empty>
  if (o === false) return <Empty>No encontramos este pedido.</Empty>

  const next = NEXT[o.status]
  const wa = whatsappLink(o.customers?.phone)

  return (
    <div className="max-w-4xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => router.push('/orders')} className="mb-1 text-sm text-muted hover:underline">Volver a pedidos</button>
          <h1 className="text-3xl font-extrabold">Pedido #{o.order_number}</h1>
          <p className="mt-1 text-sm">
            {o.customers?.full_name}
            {o.customers?.tiktok_username && <span className="text-muted"> · {o.customers.tiktok_username}</span>}
            {wa && <> · <a className="font-medium text-brand-700 hover:underline" href={wa} target="_blank" rel="noreferrer">WhatsApp {o.customers.phone}</a></>}
          </p>
          {o.lives && <p className="text-xs text-muted">{o.lives.title || 'Live'} · {fmtDateTime(o.lives.live_date)}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-extrabold">{money(o.total)}</p>
          <div className="mt-2 flex justify-end gap-2">
            <Badge value={o.payment_status} label={PAYMENT_LABEL[o.payment_status]} />
            <Badge value={o.status} label={STATUS_LABEL[o.status]} />
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {o.payment_status === 'pending' && o.status !== 'cancelled' && (
          <button className="btn btn-primary" onClick={() => patch({ payment_status: 'paid' })}>Marcar pagado</button>
        )}
        {next && <button className="btn btn-soft" onClick={() => patch({ status: next.to })}>{next.label}</button>}
        {o.status !== 'cancelled' && o.status !== 'delivered' && (
          <button className="btn btn-ghost" onClick={() => confirm('¿Cancelar este pedido?') && patch({ status: 'cancelled' })}>Cancelar pedido</button>
        )}
        {o.status === 'cancelled' && <button className="btn btn-ghost" onClick={() => patch({ status: 'to_prepare' })}>Reabrir pedido</button>}
      </div>
      <ErrorMsg>{err}</ErrorMsg>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-bold">Productos</h2>
        <ul className="divide-y divide-line text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2">
              <span>{it.quantity} × {it.description}</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold">{money(it.subtotal)}</span>
                {isAdmin && (
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={async () => { await supabase.from('order_items').delete().eq('id', it.id); load() }}
                  >Quitar</button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 grid grid-cols-[1fr_70px_100px_auto] items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!store || !newItem.description.trim()) return
            const { error } = await supabase.from('order_items').insert({
              store_id: store.id, order_id: id, description: newItem.description.trim(),
              quantity: Number(newItem.quantity) || 1, unit_price: Number(newItem.unit_price) || 0,
            })
            if (error) setErr(error.message)
            setNewItem({ description: '', quantity: 1, unit_price: '' })
            load()
          }}
        >
          <input className="input" placeholder="Agregar producto" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} aria-label="Descripción" />
          <input className="input" type="number" min={1} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} aria-label="Cantidad" />
          <input className="input" type="number" min={0} step="0.01" placeholder="Precio" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })} aria-label="Precio" />
          <button className="btn btn-soft">Agregar</button>
        </form>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          className="panel space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            patch({ payment_status: pay.payment_status, payment_method: nn(pay.payment_method), payment_reference: nn(pay.payment_reference) })
          }}
        >
          <h2 className="text-lg font-bold">Pago</h2>
          <Field label="Estado">
            <select className="input" value={pay.payment_status} onChange={(e) => setPay({ ...pay, payment_status: e.target.value })}>
              {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Método"><input className="input" value={pay.payment_method} onChange={(e) => setPay({ ...pay, payment_method: e.target.value })} placeholder="QR, transferencia, efectivo…" /></Field>
          <Field label="Referencia"><input className="input" value={pay.payment_reference} onChange={(e) => setPay({ ...pay, payment_reference: e.target.value })} /></Field>
          <button className="btn btn-primary">Guardar pago</button>
        </form>

        <form
          className="panel space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            patch({
              delivery_type: del.delivery_type,
              delivery_point_id: del.delivery_type === 'delivery_point' ? nn(del.delivery_point_id) : null,
              delivery_address: nn(del.delivery_address),
              delivery_city: nn(del.delivery_city),
              delivery_date: nn(del.delivery_date),
              delivery_time_from: nn(del.delivery_time_from),
              delivery_time_to: nn(del.delivery_time_to),
              delivery_notes: nn(del.delivery_notes),
            })
          }}
        >
          <h2 className="text-lg font-bold">Entrega</h2>
          <Field label="Tipo">
            <select className="input" value={del.delivery_type} onChange={(e) => setDel({ ...del, delivery_type: e.target.value })}>
              {Object.entries(DELIVERY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {del.delivery_type === 'delivery_point' && (
            <Field label="Punto de entrega">
              <select className="input" value={del.delivery_point_id} onChange={(e) => setDel({ ...del, delivery_point_id: e.target.value })}>
                <option value="">Elige un punto…</option>
                {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          {(del.delivery_type === 'delivery' || del.delivery_type === 'intercity_shipping') && (
            <Field label="Dirección"><input className="input" value={del.delivery_address} onChange={(e) => setDel({ ...del, delivery_address: e.target.value })} /></Field>
          )}
          {del.delivery_type === 'intercity_shipping' && (
            <Field label="Ciudad de destino"><input className="input" value={del.delivery_city} onChange={(e) => setDel({ ...del, delivery_city: e.target.value })} /></Field>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Fecha"><input className="input" type="date" value={del.delivery_date} onChange={(e) => setDel({ ...del, delivery_date: e.target.value })} /></Field>
            <Field label="Desde"><input className="input" type="time" value={del.delivery_time_from} onChange={(e) => setDel({ ...del, delivery_time_from: e.target.value })} /></Field>
            <Field label="Hasta"><input className="input" type="time" value={del.delivery_time_to} onChange={(e) => setDel({ ...del, delivery_time_to: e.target.value })} /></Field>
          </div>
          <Field label="Notas de entrega"><input className="input" value={del.delivery_notes} onChange={(e) => setDel({ ...del, delivery_notes: e.target.value })} /></Field>
          <button className="btn btn-primary">Guardar entrega</button>
        </form>
      </div>

      <form
        className="panel space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          patch({ notes: nn(extra.notes), remind_at: extra.remind_at ? new Date(extra.remind_at).toISOString() : null })
        }}
      >
        <h2 className="text-lg font-bold">Notas y recordatorio</h2>
        <Field label="Notas"><textarea className="input" rows={2} value={extra.notes} onChange={(e) => setExtra({ ...extra, notes: e.target.value })} /></Field>
        <Field label="Recordarme el"><input className="input sm:max-w-xs" type="datetime-local" value={extra.remind_at} onChange={(e) => setExtra({ ...extra, remind_at: e.target.value })} /></Field>
        <button className="btn btn-primary">Guardar</button>
      </form>

      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-bold">Historial</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay cambios registrados.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {events.map((ev) => (
              <li key={ev.id}>
                <span className="text-muted">{fmtDateTime(ev.created_at)} · </span>
                {FIELD_LABEL[ev.field] ?? ev.field}: {VALUE_LABEL[ev.field]?.[ev.old_value] ?? ev.old_value} → <strong>{VALUE_LABEL[ev.field]?.[ev.new_value] ?? ev.new_value}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
