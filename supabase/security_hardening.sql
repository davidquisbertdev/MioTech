-- =====================================================================
-- Mio · Refuerzo de seguridad en la base de datos (Supabase / Postgres)
-- =====================================================================
-- La app es 100 % cliente: cualquier persona con una cuenta puede llamar a la
-- API de Supabase directamente, sin pasar por la interfaz. Por eso la
-- membresía y el aislamiento entre tiendas TIENEN que cumplirse aquí, con
-- RLS, y no solo en el navegador.
--
-- Cómo usarlo (SQL Editor de Supabase):
--   1. Ejecuta la PARTE 1 (solo lectura) y revisa el resultado.
--   2. Ejecuta la PARTE 2 en un proyecto de pruebas o tras un respaldo.
--   3. Prueba: crear tienda, crear pedido, crear empleado, tienda vencida.
--
-- Este script NO se ha ejecutado contra tu base: se escribió leyendo el
-- código del cliente. Es idempotente (se puede correr más de una vez).
-- =====================================================================


-- =====================================================================
-- PARTE 1 · AUDITORÍA (solo lectura)
-- =====================================================================

-- 1.1 Tablas sin RLS activado (debería devolver 0 filas).
select tablename as tabla_sin_rls
from pg_tables
where schemaname = 'public' and not rowsecurity;

-- 1.2 Todas las políticas actuales. Busca políticas con qual = 'true'
--     o que no comparen con auth.uid(): esas dejan pasar a cualquiera.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- 1.3 Vistas que se saltan RLS. Una vista sin security_invoker corre con los
--     permisos de su dueño y puede mostrar datos de TODAS las tiendas.
select c.relname as vista,
       coalesce(c.reloptions::text, '(sin opciones)') as opciones
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v';

-- 1.4 Funciones SECURITY DEFINER (corren con permisos elevados). Cada una
--     debe validar auth.uid() por dentro y fijar search_path.
select p.proname as funcion, p.proconfig as configuracion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;

-- 1.5 Valores por defecto de la tienda (¿con qué vencimiento nace una tienda?).
select column_name, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'stores';


-- =====================================================================
-- PARTE 2 · REFUERZO
-- =====================================================================

-- 2.1 Las vistas respetan RLS de quien consulta ------------------------
do $$
declare v text;
begin
  foreach v in array array[
    'v_orders_to_prepare', 'v_orders_to_deliver',
    'v_orders_missing_delivery_info', 'v_customer_monthly_orders'
  ] loop
    if exists (select 1 from pg_views where schemaname = 'public' and viewname = v) then
      execute format('alter view public.%I set (security_invoker = on)', v);
    end if;
  end loop;
end $$;

-- 2.2 ¿Puede el usuario actual usar esta tienda? -----------------------
--     Miembro activo + tienda activa + membresía sin vencer.
create or replace function public.store_is_usable(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    join public.store_members m on m.store_id = s.id
    where s.id = sid
      and m.user_id = auth.uid()
      and m.active
      and s.status = 'active'
      and (s.subscription_expires_at is null or s.subscription_expires_at > now())
  );
$$;

revoke all on function public.store_is_usable(uuid) from public, anon;
grant execute on function public.store_is_usable(uuid) to authenticated;

-- 2.3 La membresía se exige en la base, no solo en la pantalla ----------
--     Política RESTRICTIVA: se suma a las que ya tienes (nunca abre nada,
--     solo cierra). Con la tienda pausada, cancelada o vencida, ni la API
--     directa puede leer o escribir pedidos, clientes, lives, etc.
do $$
declare t text;
begin
  foreach t in array array[
    'customers', 'orders', 'order_items', 'order_events', 'lives', 'delivery_points'
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'store_id'
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists membership_active on public.%I', t);
      execute format(
        'create policy membership_active on public.%I as restrictive for all to authenticated
           using (public.store_is_usable(store_id))
           with check (public.store_is_usable(store_id))', t);
    else
      raise notice 'Tabla % sin columna store_id: revísala a mano.', t;
    end if;
  end loop;
end $$;

-- 2.4 Nadie se regala ni se extiende la membresía ----------------------
--     El cliente crea la tienda con un insert directo. Sin esto, una cuenta
--     podría insertar su tienda con vencimiento en el año 2099, o (si alguna
--     política de update lo permite) reactivar una tienda pausada.
--     Solo el SQL Editor o la service_role pueden tocar estos campos.
create or replace function public.stores_protect_billing()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), 'postgres') not in ('authenticated', 'anon') then
    return new; -- service_role, SQL Editor, tareas internas
  end if;

  if tg_op = 'INSERT' then
    new.status := 'active';
    new.paused_reason := null;
    new.subscription_expires_at := now() + interval '14 days'; -- prueba gratis
    return new;
  end if;

  if new.status is distinct from old.status
     or new.subscription_expires_at is distinct from old.subscription_expires_at
     or new.paused_reason is distinct from old.paused_reason then
    raise exception 'Solo Mio puede cambiar el estado o la vigencia de la membresía.'
      using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists stores_protect_billing on public.stores;
create trigger stores_protect_billing
  before insert or update on public.stores
  for each row execute function public.stores_protect_billing();

-- 2.5 Solo usuarios con sesión; los anónimos no tocan nada --------------
revoke all on all tables in schema public from anon;


-- =====================================================================
-- PARTE 3 · REVISAR A MANO (depende de políticas que no están en el repo)
-- =====================================================================
-- a) store_members: un empleado NO debe poder cambiar su propio rol ni
--    reactivarse, ni insertarse en la tienda de otra persona. Las políticas
--    de insert/update/delete deben exigir que quien actúa sea admin activo
--    de ESA tienda. (No se automatiza aquí porque no se ve cómo se crea la
--    membresía del dueño al crear la tienda: un cambio a ciegas podría
--    romper el alta de tiendas.)
-- b) delete en customers / lives / delivery_points / order_items: la app
--    solo muestra el botón a administradores; confirma que la política de
--    delete también lo exige.
-- c) profiles: cada quien solo actualiza su propia fila; la lectura debería
--    limitarse a compañeros de tienda.
-- d) Edge function create_employee: debe verificar con el JWT de quien llama
--    que es admin activo de store_id antes de usar la service_role.
-- e) Auth > Settings: confirmación de correo activada, protección contra
--    contraseñas filtradas y límites de intentos (rate limits) por defecto.
