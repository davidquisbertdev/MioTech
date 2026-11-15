'use client'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth-provider'
import { Empty, ErrorMsg, Field, ListSkeleton, PageHeader } from '@/components/ui'
import { Icon } from '@/components/icons'
import { fmtDateTime, todayISO } from '@/lib/format'

export default function LivesPage() {
  const { store, isAdmin } = useAuth()
  const [rows, setRows] = useState<any[] | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!store) return
    const { data } = await supabase.from('lives').select('*, orders(count)').eq('store_id', store.id).order('live_date', { ascending: false })
    setRows(data ?? [])
  }, [store])
  useEffect(() => { load() }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!store) return
    const { error } = await supabase.from('lives').insert({ store_id: store.id, title: title.trim() || null, live_date: date })
    if (error) return setErr(error.message)
    setTitle(''); setErr(''); load()
  }

  return (
    <>
      <PageHeader title="Lives" subtitle="Registra cada transmisión para saber de cuál vino cada pedido." />
      <form onSubmit={add} className="panel mb-6 grid items-end gap-3 p-5 sm:grid-cols-[1fr_220px_auto]">
        <Field label="Título (opcional)"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Liquidación de verano" /></Field>
        <Field label="Fecha"><input className="input" type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <button className="btn btn-primary"><Icon name="plus" size={16} />Agregar live</button>
        <div className="sm:col-span-3"><ErrorMsg>{err}</ErrorMsg></div>
      </form>

      {rows === null ? <ListSkeleton /> : rows.length === 0 ? (
        <Empty icon="lives" title="Todavía no registraste ningún live">Agrega tu próxima transmisión arriba y elige ese live al anotar cada pedido.</Empty>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">{l.title || 'Live sin título'}</p>
                <p className="text-xs text-muted">{fmtDateTime(l.live_date)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="num text-muted">{(l.orders?.[0]?.count ?? 0) === 1 ? '1 pedido' : `${l.orders?.[0]?.count ?? 0} pedidos`}</span>
                {isAdmin && (
                  <button className="link-danger text-xs" onClick={async () => { if (confirm('¿Eliminar este live? Los pedidos se conservan.')) { await supabase.from('lives').delete().eq('id', l.id); load() } }}>Eliminar</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
