# Mio (MioTech)

SaaS por membresía para registrar y seguir los pedidos que se venden por TikTok Live (mercado: Bolivia, interfaz en español). Cada cliente es una **tienda** con sus miembros (admin / empleado).

## Stack y comandos

- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4, Supabase (`@supabase/supabase-js`).
- **Todo el acceso a datos es desde el cliente** con la clave `anon`. No hay rutas API, server actions ni middleware. La seguridad real vive en RLS de Supabase.
- No hay tests ni linter configurados. Verificación: `npx tsc --noEmit` y `npm run build`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

Variables (`.env` o `.env.local`, nunca se suben):

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Obligatorias. También definen `connect-src` de la CSP. |
| `NEXT_PUBLIC_SITE_URL` | Dominio público para canónicas, sitemap y Open Graph. |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | Opcional, solo dígitos con código de país. Activa los botones "Comprar/Renovar por WhatsApp". |

`.env.example` está en `.gitignore` a propósito; no lo fuerces al repo.

## Mapa de rutas

| Ruta | Qué es |
|---|---|
| `/` | Landing pública (server component) con precio y FAQ + JSON-LD. |
| `/demo` | Panel de solo lectura con datos de ejemplo (`lib/demo-data.ts`). |
| `/login` | Ingreso y registro. `?modo=registro` abre el formulario de cuenta nueva. |
| `/dashboard` | Panel de ventas (home de la app). |
| `/orders`, `/orders/new`, `/orders/[id]` | Lista, alta y detalle de pedidos. |
| `/customers`, `/lives`, `/delivery-points` | Catálogos de la tienda. |
| `/team` | Solo admin. Crea usuarios con la edge function `create_employee`. |
| `/settings` | Membresía (días restantes), tienda, cuenta, tema, cerrar sesión. |

`app/(app)/layout.tsx` protege todo el grupo `(app)`: sin sesión → `/login`; sin tiendas → `CreateStore`; tienda no usable → pantalla de pausa; si no → `Shell`.

## Piezas clave

- `components/auth-provider.tsx` — `useAuth()`: `session`, `store`, `memberships`, `isAdmin`, `usable`, `loading`, `setStoreId`, `refresh`, `signOut`. `loading` es **derivado**: con sesión sigue en `true` hasta cargar las tiendas de ese usuario (evita el parpadeo de "Crea tu tienda"). `usable` = tienda `active` y `subscription_expires_at` nulo o futuro.
- `components/shell.tsx` — barra lateral (escritorio), cabecera + navegación inferior (móvil), aviso de vencimiento.
- `components/dashboard-view.tsx` — vista presentacional del panel (props, sin datos). La usan `/dashboard` (datos reales) y `/demo` (`demo` desactiva enlaces).
- `components/sales-chart.tsx` — gráfico de barras SVG propio (sin librería), con teclado y tooltip.
- `components/ui.tsx` — `Badge`, `PageHeader`, `Field`, `Empty`, `ErrorMsg`, `OkMsg`, `ListSkeleton`, `Splash`, `OrderLink`, `SearchInput`.
- `components/icons.tsx` — `<Icon name>`; iconos SVG propios de trazo 1.75. Agrega aquí los nuevos, no uses emoji ni glifos.
- `lib/sales.ts` — `summarize(orders, period, today)` y `periodRange`: lógica pura del panel (7d / 30d / mes, comparación con el periodo previo).
- `lib/membership.ts` — `PLAN` (US$ 50 al mes, 14 días de prueba), `membershipInfo(store)`, `WARN_DAYS = 7`.
- `lib/format.ts` — dinero (`Bs`, locale `es-BO`) y fechas. `lib/labels.ts` — etiquetas en español de estados. `lib/site.ts` — URL y textos SEO.

## Modelo de datos (inferido del cliente; el esquema SQL no está en el repo)

- `stores` (id, name, status `active|paused|cancelled`, paused_reason, subscription_expires_at)
- `store_members` (store_id, user_id, role `admin|employee`, active) · `profiles` (id, full_name)
- `customers` (store_id, full_name, phone, tiktok_username, city, notes)
- `lives` (store_id, title, live_date) · `delivery_points` (store_id, name, address, active)
- `orders` (store_id, order_number, customer_id, live_id, total, payment_status `pending|paid|refunded`, paid_at, payment_method, payment_reference, status `to_prepare|prepared|dispatched|delivered|cancelled`, delivery_type, delivery_point_id, delivery_address, delivery_city, delivery_date, delivery_time_from/to, delivery_notes, notes, remind_at, created_at)
- `order_items` (store_id, order_id, description, quantity, unit_price, subtotal) · `order_events` (order_id, field, old_value, new_value, created_at)
- Vistas: `v_orders_to_prepare`, `v_orders_to_deliver`, `v_orders_missing_delivery_info`, `v_customer_monthly_orders`
- Edge function: `create_employee` (el nombre está fijo en `lib/supabase.ts`; el código no está en el repo).

"Venta" en el panel = pedido `paid` y no `cancelled`, fechado por `created_at`.

## Convenciones

- **Fechas**: Bolivia es UTC-4 fijo (`America/La_Paz`). Usa los helpers de `lib/format.ts` (`todayISO`, `boliviaDay`, `shiftISO`, `fmtDay`…); no uses `new Date()` crudo para decidir "hoy".
- **Multi-tienda**: toda consulta filtra por `store.id`. Las relaciones de Supabase pueden llegar como objeto o como arreglo: normaliza con `one(rel)`.
- **Estilos**: tokens en `app/globals.css` (`brand-*`, `bg`, `surface`, `sunken`, `ink`, `muted`, `line`, `side`, y estados `ok|warn|info|danger` con `-soft`). Dos temas por `data-theme`: `fucsia` (por defecto) y `azul`. Usa los tokens y las clases `.btn`, `.btn-primary|soft|ghost|danger`, `.input`, `.panel`, `.panel-head`, `.link`, `.link-danger`, `.th`, `.td`, `.num`, `.skeleton`; no colores sueltos de Tailwind.
- **Tipografía**: Bricolage Grotesque solo en `h1` y `.font-display`; Figtree en lo demás. Números con `.num` (tabulares).
- **UX**: esqueletos en vez de "Cargando…", estados vacíos que explican qué hacer, móvil primero (inputs de 16 px, navegación inferior).
- **Textos**: español, tono cercano, sin inventar afirmaciones comerciales (límites, integraciones, medios de pago) que el producto no tenga.
- **Commits**: en español, estilo `feat: …` / `fix: …`, un tema por commit.

## Seguridad

- `next.config.ts` aplica CSP, HSTS, X-Frame-Options y `X-Robots-Tag: noindex` en rutas privadas. Si agregas un servicio externo (analítica, pagos, imágenes remotas), hay que abrirlo en la CSP. Si agregas una ruta privada, súmala a `privatePaths` y a `app/robots.ts`.
- `supabase/security_hardening.sql`: auditoría + refuerzo de RLS (membresía exigida en la base, vistas con `security_invoker`, trigger que protege la vigencia de la tienda). **Pendiente de ejecutar en Supabase**; la parte 3 lista revisiones manuales (`store_members`, borrados, `profiles`, `create_employee`).
- Las comprobaciones de `isAdmin` y `usable` en el cliente son solo de interfaz; no cuentan como control de acceso.

## Estado y pendientes

- Rama de trabajo: `feat/seguridad-landing-configuracion` (rediseño, fix de login, seguridad, configuración, landing/demo/SEO). Falta fusionarla a `main`.
- No hay pasarela de pago: la membresía se renueva coordinando con Mio (se cambia `subscription_expires_at` a mano en Supabase).
- Las pantallas con sesión no tienen pruebas automáticas; se verifican a mano con una cuenta real.
- El plugin de diseño `impeccable` (marketplace `pbakaus/impeccable`) se usó como guía; es configuración por usuario en `~/.claude/settings.json`, no del repo.
