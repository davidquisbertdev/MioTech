import { shiftISO } from './format'
import type { PaidOrder } from './sales'

// Datos inventados para la demo pública y la landing. No salen de ninguna tienda real.

const NAMES = ['María Quispe', 'Carla Mamani', 'Lucía Fernández', 'Daniela Rojas', 'Paola Gutiérrez', 'Andrea Vargas', 'Rosa Condori', 'Jhoselin Choque']
const LIVES = ['Liquidación de verano', 'Blusas nuevas', 'Noche de ofertas', 'Jeans y más']

/** 62 días de pedidos cobrados, siempre iguales para una misma fecha. */
export function demoPaidOrders(today: string): PaidOrder[] {
  const out: PaidOrder[] = []
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let d = 0; d < 62; d++) {
    const date = shiftISO(today, -d)
    const n = d === 0 ? 4 : d % 7 === 3 ? 0 : Math.floor(rnd() * 9) + (d % 7 === 5 ? 6 : 0)
    for (let i = 0; i < n; i++) {
      const c = Math.floor(rnd() * rnd() * NAMES.length)
      const l = rnd() < 0.8 ? Math.floor(rnd() * LIVES.length) : -1
      out.push({
        id: `${d}-${i}`,
        total: Math.round(60 + rnd() * 380),
        created_at: `${date}T15:00:00Z`,
        live_id: l < 0 ? null : `l${l}`,
        customer_id: `c${c}`,
        customers: { full_name: NAMES[c] },
        lives: l < 0 ? null : { title: LIVES[l] },
      })
    }
  }
  return out
}

const row = (n: number, name: string, total: number, more = {}) => ({
  id: `demo-${n}`, order_number: n, total, customers: { full_name: name }, ...more,
})

export function demoQueues(today: string) {
  return {
    unpaid: [row(1042, 'María Quispe', 180), row(1045, 'Rosa Condori', 95.5), row(1047, 'Paola Gutiérrez', 320)],
    prep: [row(1039, 'Carla Mamani', 240), row(1041, 'Lucía Fernández', 130)],
    missing: [row(1044, 'Andrea Vargas', 75)],
    deliver: [
      row(1030, 'Daniela Rojas', 210, { status: 'prepared', delivery_type: 'delivery_point', delivery_date: today }),
      row(1028, 'Jhoselin Choque', 160, { status: 'dispatched', delivery_type: 'intercity_shipping', delivery_date: null }),
    ],
  }
}

export function demoDeliveries() {
  return {
    today: { a: { name: 'Plaza 24 de Septiembre', orders: [row(1030, 'Daniela Rojas', 210), row(1031, 'Andrea Vargas', 150)] } },
    tomorrow: { b: { name: 'Terminal Bimodal', orders: [row(1033, 'Jhoselin Choque', 99)] } },
  }
}
