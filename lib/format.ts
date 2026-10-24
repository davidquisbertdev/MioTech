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
  const inTZ = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  return `${inTZ.getFullYear()}-${pad(inTZ.getMonth() + 1)}-${pad(inTZ.getDate())}`
}

export const weekStartISO = () => {
  const d = new Date()
  const inTZ = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  const day = inTZ.getDay()
  const diff = inTZ.getDate() - day + (day === 0 ? -6 : 1)
  inTZ.setDate(diff)
  return `${inTZ.getFullYear()}-${pad(inTZ.getMonth() + 1)}-${pad(inTZ.getDate())}`
}

export const monthStartISO = () => {
  const d = new Date()
  const inTZ = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  return `${inTZ.getFullYear()}-${pad(inTZ.getMonth() + 1)}-01`
}

export const tomorrowISO = () => {
  const d = new Date()
  const inTZ = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  inTZ.setDate(inTZ.getDate() + 1)
  return `${inTZ.getFullYear()}-${pad(inTZ.getMonth() + 1)}-${pad(inTZ.getDate())}`
}

export const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const whatsappLink = (phone?: string | null) =>
  phone ? `https://wa.me/591${phone.replace(/[^\d]/g, '')}` : undefined

// === Funciones de fecha/hora centralizadas ===

/** Fecha/hora actual en formato ISO UTC (para guardar en BD) */
export const nowISO = () => new Date().toISOString()

/** Fecha/hora actual en formato ISO con timezone de Bolivia */
export const nowBoliviaISO = () => {
  const d = new Date()
  return d.toLocaleString('sv-SE', { timeZone: TZ }) // formato YYYY-MM-DD HH:mm:ss
}

/** Convierte un input datetime-local a ISO string UTC */
export const fromLocalInput = (localValue: string) => {
  if (!localValue) return null
  return new Date(localValue).toISOString()
}

/** Obtiene la fecha actual en Bolivia como string YYYY-MM-DD */
export const todayBoliviaString = () => {
  const d = new Date()
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}
