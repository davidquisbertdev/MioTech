# Mio

Control de pedidos para quienes venden por TikTok Live: anota cada pedido mientras transmites, cobra, alista y entrega sin perder ninguno. Funciona por membresía (US$ 50 al mes por tienda, con 14 días de prueba).

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase.

## Qué incluye

- **Landing pública** (`/`) con funciones, precio y preguntas frecuentes, y una **demo** (`/demo`) con datos de ejemplo.
- **Panel de ventas**: ventas cobradas, pedidos y ticket promedio por periodo, comparación con el periodo anterior, gráfico diario y rankings por live y por cliente.
- **Pedidos**: alta rápida, cobro, avance por estados (por alistar → alistado → despachado → entregado) e historial de cambios.
- **Clientes, lives y puntos de entrega**, con entregas de hoy y mañana agrupadas por punto.
- **Equipo** con roles de administrador y empleado.
- **Configuración**: días restantes de la membresía y fecha de vencimiento.
- Dos temas de color (fucsia y azul) y diseño pensado para el celular.

## Puesta en marcha

1. Crea un proyecto en Supabase y ejecuta el SQL del esquema en el SQL Editor (el esquema no está en este repositorio).
2. Despliega la edge function de alta de empleados:
   ```bash
   supabase functions deploy create_employee
   ```
3. Crea `.env.local` en la raíz:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_SITE_URL=
   NEXT_PUBLIC_CONTACT_WHATSAPP=
   ```
   Las dos primeras son obligatorias (Supabase > Project Settings > API). `NEXT_PUBLIC_SITE_URL` es tu dominio público, para el SEO. `NEXT_PUBLIC_CONTACT_WHATSAPP` es opcional (solo dígitos con código de país) y activa los botones de compra y renovación por WhatsApp.
4. Instala y arranca:
   ```bash
   npm install
   ```
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000.

Para comprobar antes de desplegar:

```bash
npx tsc --noEmit
```

```bash
npm run build
```

## Seguridad

La app habla con Supabase directamente desde el navegador, así que el aislamiento entre tiendas y la vigencia de la membresía dependen de las políticas RLS de la base.

- [`supabase/security_hardening.sql`](supabase/security_hardening.sql) trae una auditoría (solo lectura) y un refuerzo: exige membresía vigente en la base, hace que las vistas respeten los permisos e impide que un cliente cambie la vigencia de su tienda. Ejecútalo en el SQL Editor, primero en un entorno de pruebas o con respaldo.
- `next.config.ts` añade cabeceras de seguridad (CSP, HSTS, bloqueo de iframes) y `noindex` en las rutas privadas.
- Nunca subas `.env` ni uses la clave `service_role` en el cliente.

## Estructura

```
app/
  page.tsx              Landing
  demo/                 Demo pública con datos de ejemplo
  login/                Ingreso y registro
  (app)/                Rutas privadas (protegidas por sesión y membresía)
    dashboard/  orders/  customers/  lives/  delivery-points/  team/  settings/
  sitemap.ts  robots.ts  opengraph-image.tsx
components/
  auth-provider.tsx     Sesión, tiendas, rol y estado de la membresía
  shell.tsx             Navegación (lateral en escritorio, inferior en móvil)
  dashboard-view.tsx    Vista del panel (la comparten /dashboard y /demo)
  sales-chart.tsx       Gráfico de ventas por día
  ui.tsx  icons.tsx  logo.tsx  theme-provider.tsx
lib/
  sales.ts              Cálculo de ventas por periodo
  membership.ts         Plan, precio y días restantes
  format.ts  labels.ts  site.ts  supabase.ts  types.ts  demo-data.ts
supabase/
  security_hardening.sql
```

## Membresía

Cada tienda tiene un `status` y una fecha `subscription_expires_at`. Cuando vence o se pausa, la tienda deja de ser usable y los datos se conservan. Por ahora no hay pasarela de pago: la renovación se coordina con Mio y la fecha se actualiza en Supabase.

Para desarrollar con Claude Code, lee [`CLAUDE.md`](CLAUDE.md): resume la arquitectura, el modelo de datos y las convenciones del proyecto.
