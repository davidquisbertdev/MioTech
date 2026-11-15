import { ImageResponse } from 'next/og'

export const alt = 'Mio: control de pedidos para ventas por TikTok Live'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#33102a',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="76" height="76" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="11" fill="#c01274" />
            <path
              d="M10 29V15M10 19a5 5 0 0 1 10 0v10M20 19a5 5 0 0 1 10 0v10"
              fill="none"
              stroke="#fff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="10" r="3" fill="#fff" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800 }}>Mio</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
            Cada pedido de tu live, en su lugar.
          </div>
          <div style={{ fontSize: 34, color: '#f3cfe3' }}>
            Control de pedidos para ventas por TikTok Live
          </div>
        </div>
      </div>
    ),
    size
  )
}
