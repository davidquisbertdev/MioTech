'use client'
import { useEffect, useRef, useState } from 'react'
import { fmtDay, money, moneyShort } from '@/lib/format'
import type { DayPoint } from '@/lib/sales'

const H = 240
const M = { top: 16, right: 8, bottom: 26, left: 48 }

/** Tope "redondo" del eje y sus marcas. */
function scale(max: number) {
  if (max <= 0) return { top: 100, ticks: [0, 50, 100] }
  const rough = max / 3
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v)
  return { top, ticks }
}

const barPath = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(3, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

export function SalesChart({ days, today }: { days: DayPoint[]; today: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => setActive(null), [days])

  const n = days.length
  const innerW = Math.max(0, width - M.left - M.right)
  const innerH = H - M.top - M.bottom
  const { top, ticks } = scale(Math.max(...days.map((d) => d.total), 0))
  const band = n ? innerW / n : 0
  const barW = Math.max(2, Math.min(32, band * 0.68))
  const y = (v: number) => M.top + innerH - (v / top) * innerH
  const total = days.reduce((s, d) => s + d.total, 0)
  const avg = n ? total / n : 0
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 52))))
  const labelFmt: Intl.DateTimeFormatOptions = n <= 7 ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' }
  const cur = active !== null ? days[active] : null

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') setActive((i) => Math.min(n - 1, (i ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? n) - 1))
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  return (
    <div ref={wrap} className="relative" style={{ height: H }} onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          aria-label={`Ventas cobradas por día, del ${fmtDay(days[0]?.date ?? today)} al ${fmtDay(days[n - 1]?.date ?? today)}. Total ${money(total)}. Usa las flechas para recorrer los días.`}
          className="block rounded-lg"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? undefined : '2 4'} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" className="num">
                {moneyShort(t)}
              </text>
            </g>
          ))}

          {days.map((d, i) => {
            const cx = M.left + band * i + band / 2
            const h = d.total > 0 ? Math.max(2, (d.total / top) * innerH) : 0
            const isActive = active === i
            const isToday = d.date === today
            return (
              <g key={d.date}>
                {isActive && <rect x={cx - band / 2} y={M.top} width={band} height={innerH} fill="var(--brand-50)" />}
                {h > 0 && (
                  <path
                    d={barPath(cx - barW / 2, M.top + innerH - h, barW, h)}
                    fill={isActive ? 'var(--brand-700)' : 'var(--brand-500)'}
                  />
                )}
                {(i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= labelEvery * 0.6)) && (
                  <text
                    x={cx}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isToday ? 700 : 400}
                    fill={isToday ? 'var(--ink)' : 'var(--muted)'}
                  >
                    {isToday ? 'hoy' : fmtDay(d.date, labelFmt)}
                  </text>
                )}
                <rect
                  x={cx - band / 2}
                  y={M.top}
                  width={band}
                  height={innerH + M.bottom}
                  fill="transparent"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                />
              </g>
            )
          })}

          {avg > 0 && (
            <line pointerEvents="none" x1={M.left} x2={width - M.right} y1={y(avg)} y2={y(avg)} stroke="var(--ink)" strokeOpacity={0.5} strokeDasharray="5 4" />
          )}
        </svg>
      )}

      {cur && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 w-44 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[0_6px_20px_-6px_rgb(0_0_0/0.25)]"
          style={{
            left: Math.min(Math.max(0, M.left + band * active + band / 2 - 88), Math.max(0, width - 176)),
            top: Math.max(0, y(cur.total) - 68),
          }}
        >
          <p className="font-medium text-muted first-letter:uppercase">{fmtDay(cur.date)}</p>
          <p className="num text-sm font-bold text-ink">{money(cur.total)}</p>
          <p className="text-muted">{cur.count === 1 ? '1 pedido cobrado' : `${cur.count} pedidos cobrados`}</p>
        </div>
      )}
    </div>
  )
}
