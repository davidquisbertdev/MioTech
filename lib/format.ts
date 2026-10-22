const TZ = 'America/La_Paz'

export const money = (n: number | string | null | undefined) =>
  `Bs ${Number(n ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const fmtDate = (s?: string | null) => {
  if (!s) return '—'
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('es-BO', {
        timeZone: TZ,
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

const pad = (n: number) => String(n).padStart(2, '0')

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const weekStartISO = () => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const monthStartISO = () => todayISO().slice(0, 8) + '01'

export const tomorrowISO = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const whatsappLink = (phone?: string | null) =>
  phone ? `https://wa.me/591${phone.replace(/[^\d]/g, '')}` : undefined
