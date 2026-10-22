# Mio

Registro y seguimiento de pedidos de ventas por TikTok Live. Next.js (App Router) + Supabase + Tailwind v4.

## Puesta en marcha

1. Ejecuta el SQL del schema en Supabase (SQL Editor).
2. Despliega la edge function: `supabase functions deploy create_employee`
   (si la desplegaste con otro nombre, cámbialo en `NEXT_PUBLIC_CREATE_EMPLOYEE_FUNCTION`).
3. Rellena `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase > Project Settings > API)
4. `npm install` y luego `npm run dev` → http://localhost:3000

## Estructura

- `app/login` — ingreso y registro
- `app/(app)/*` — panel, pedidos, clientes, lives, puntos de entrega, equipo (protegido por sesión)
- `components/auth-provider.tsx` — sesión, tiendas del usuario, rol y estado de suscripción
- `components/theme-provider.tsx` — temas fucsia y azul (se guarda la elección)
- `components/logo.tsx` y `app/icon.svg` — logo de Mio
- `lib/supabase.ts` — cliente de Supabase y nombre de la edge function
