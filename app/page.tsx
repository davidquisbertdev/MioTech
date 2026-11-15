import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Icon, type IconName } from '@/components/icons'
import { LandingPreview } from '@/components/landing-preview'
import { LandingAuthLink } from '@/components/landing-auth-link'
import { CONTACT_WHATSAPP, PLAN } from '@/lib/membership'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
}

const SIGNUP = '/login?modo=registro'

const STEPS: { title: string; text: string; state: string; tone: string }[] = [
  { title: 'Anota', text: 'Mientras sigues en vivo, registra quién pidió y qué. El pedido queda ligado a ese live.', state: 'Por cobrar', tone: 'bg-warn-soft text-warn' },
  { title: 'Cobra', text: 'Marca el pago por QR, transferencia o efectivo y guarda la referencia.', state: 'Pagado', tone: 'bg-ok-soft text-ok' },
  { title: 'Alista', text: 'La lista «Por alistar» te dice qué empacar. Nada pagado se queda sin preparar.', state: 'Alistado', tone: 'bg-brand-100 text-brand-800' },
  { title: 'Entrega', text: 'Define punto de entrega, domicilio o envío a otra ciudad, con fecha y horario.', state: 'Entregado', tone: 'bg-ok-soft text-ok' },
]

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'panel', title: 'Panel de ventas', text: 'Ventas cobradas, pedidos y ticket promedio de 7 días, 30 días o el mes, comparados con el periodo anterior, y el mejor día de un vistazo.' },
  { icon: 'lives', title: 'Ventas por live', text: 'Cada pedido se asocia a su transmisión, así sabes cuál live vendió más y cuánto dejó.' },
  { icon: 'customers', title: 'Clientes con WhatsApp', text: 'Ficha con teléfono, usuario de TikTok y ciudad. Un toque abre el chat y ves cuánto lleva comprado en el mes.' },
  { icon: 'pin', title: 'Entregas de hoy y mañana', text: 'Los pedidos listos se agrupan por punto de entrega para que salgas con la lista completa.' },
  { icon: 'team', title: 'Tu equipo, con su propio acceso', text: 'Crea usuarios para quienes te ayudan. Los administradores gestionan; los empleados registran y alistan.' },
  { icon: 'wallet', title: 'Nada se queda sin cobrar', text: 'Una lista aparte con cada pedido sin pago confirmado y el total pendiente, siempre a la vista.' },
]

const INCLUDED = [
  'Registro de pedidos, clientes y lives',
  'Panel de ventas con comparación por periodo',
  'Puntos de entrega y entregas del día',
  'Accesos para tu equipo con roles',
  'Historial de cambios de cada pedido',
  'Funciona en el celular, sin instalar nada',
]

const FAQ: { q: string; a: string }[] = [
  { q: '¿Necesito tarjeta para empezar la prueba?', a: `No. Creas tu cuenta, le pones nombre a tu tienda y empiezas con ${PLAN.trialDays} días de prueba.` },
  { q: '¿Mio se conecta solo con TikTok?', a: 'No. Tú anotas cada pedido mientras vendes; Mio está hecho para que eso tome segundos y para que después nada se pierda entre el cobro y la entrega.' },
  { q: '¿Qué pasa si se vence mi membresía?', a: 'La tienda queda en pausa y tus datos siguen guardados. Al renovar vuelves a entrar y todo está donde lo dejaste.' },
  { q: '¿Cómo sé cuántos días me quedan?', a: 'En Configuración ves los días restantes y la fecha exacta de vencimiento, y Mio te avisa cuando falta una semana.' },
  { q: '¿Puedo usarlo desde el celular durante el live?', a: 'Sí. Funciona en el navegador del teléfono, con botones grandes y navegación inferior pensada para una mano.' },
  { q: '¿Cómo se paga la membresía?', a: `Cuesta ${PLAN.priceLabel} ${PLAN.period} por tienda. El pago y la renovación se coordinan directamente con Mio.` },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'es',
      offers: {
        '@type': 'Offer',
        price: PLAN.price.toFixed(2),
        priceCurrency: 'USD',
        description: `Membresía mensual por tienda, con ${PLAN.trialDays} días de prueba.`,
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
}

const ghostOnDark = 'btn border border-white/25 bg-white/10 text-white hover:bg-white/20'

export default function Landing() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* Cabecera + hero */}
      <div className="bg-side text-side-ink">
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="text-white" aria-label="Mio, inicio"><Logo size={34} /></Link>
          <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#como-funciona" className="hover:text-white">Cómo funciona</a>
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#precio" className="hover:text-white">Precio</a>
            <a href="#preguntas" className="hover:text-white">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            <LandingAuthLink className={ghostOnDark} />
            <Link href={SIGNUP} className="btn btn-primary hidden sm:inline-flex">Probar gratis</Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-0 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          <div className="pb-4 lg:pb-24">
            <h1 className="text-[2.6rem] font-extrabold leading-[1.02] text-white sm:text-6xl">
              Cada pedido de tu live, en su lugar.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed">
              Mio es el control de pedidos para quienes venden por TikTok Live: anota mientras transmites,
              cobra, alista y entrega sin que nadie se te pierda en el camino.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={SIGNUP} className="btn btn-primary min-h-12 px-6 text-base">
                Empezar prueba de {PLAN.trialDays} días
              </Link>
              <Link href="/demo" className={`${ghostOnDark} min-h-12 px-6 text-base`}>
                Ver la demo
                <Icon name="chevron" size={16} />
              </Link>
            </div>
            <p className="mt-4 text-sm">Sin tarjeta para empezar. Después, {PLAN.priceLabel} {PLAN.period} por tienda.</p>
          </div>
          <div className="-mb-16 lg:-mb-24">
            <LandingPreview />
          </div>
        </section>
      </div>

      <main>
        {/* Cómo funciona */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-20 pt-32 sm:px-8 lg:pt-44">
          <h2 className="font-display max-w-2xl text-3xl font-extrabold sm:text-4xl">Del «¡mío!» en el chat a la entrega, en cuatro pasos</h2>
          <p className="mt-3 max-w-xl text-muted">
            Cada pedido avanza por los mismos estados, y tu equipo siempre sabe qué sigue.
          </p>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative lg:pr-8">
                <div className="flex items-center gap-3">
                  <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                  {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-line lg:block" aria-hidden="true" />}
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.tone}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {s.state}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Funciones */}
        <section id="funciones" className="scroll-mt-8 border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-10 lg:self-start">
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Todo lo que pasa después del live</h2>
              <p className="mt-3 text-muted">
                Vender en vivo es la parte divertida. Mio se encarga de lo que viene después: saber quién pagó,
                qué falta empacar y a dónde va cada paquete.
              </p>
              <Link href="/demo" className="link mt-5 inline-flex items-center gap-1">
                Míralo con datos de ejemplo
                <Icon name="chevron" size={15} />
              </Link>
            </div>
            <dl className="divide-y divide-line">
              {FEATURES.map((f) => (
                <div key={f.title} className="grid grid-cols-[auto_1fr] gap-x-4 py-5 first:pt-0 last:pb-0">
                  <span className="row-span-2 mt-0.5 grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <dt className="text-lg font-bold">{f.title}</dt>
                  <dd className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{f.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Precio */}
        <section id="precio" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16">
            <div>
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Un solo plan, con todo incluido</h2>
              <p className="mt-3 max-w-lg text-muted">
                Sin niveles ni funciones bloqueadas. Pruebas {PLAN.trialDays} días con tu tienda real y decides después.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {INCLUDED.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <Icon name="check" size={18} className="mt-0.5 text-ok" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel p-6 sm:p-8">
              <h3 className="text-lg font-bold">{PLAN.name}</h3>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="num font-display text-6xl font-extrabold tracking-tight">{PLAN.priceLabel}</span>
                <span className="text-muted">{PLAN.period}</span>
              </p>
              <p className="mt-1 text-sm text-muted">Por tienda.</p>
              <Link href={SIGNUP} className="btn btn-primary mt-6 min-h-12 w-full text-base">
                Empezar prueba de {PLAN.trialDays} días
              </Link>
              {CONTACT_WHATSAPP && (
                <a href={CONTACT_WHATSAPP} target="_blank" rel="noreferrer" className="btn btn-ghost mt-2.5 min-h-12 w-full text-base">
                  <Icon name="chat" size={17} />
                  Comprar por WhatsApp
                </a>
              )}
              <p className="mt-4 text-sm text-muted">
                Sin tarjeta para empezar. Al terminar la prueba, el pago se coordina con Mio y tus datos se conservan.
              </p>
            </div>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="scroll-mt-8 border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Preguntas frecuentes</h2>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Icon name="plus" size={18} className="text-brand-600 transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="max-w-[65ch] pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="bg-side text-side-ink">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8">
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-extrabold text-white sm:text-5xl">
              Tu próximo live, con cada pedido bajo control
            </h2>
            <p className="mx-auto mt-4 max-w-md">
              Crea tu tienda en un minuto y registra el primer pedido hoy mismo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={SIGNUP} className="btn btn-primary min-h-12 px-6 text-base">Empezar prueba de {PLAN.trialDays} días</Link>
              <Link href="/demo" className={`${ghostOnDark} min-h-12 px-6 text-base`}>Ver la demo</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-side text-side-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/15 px-5 py-6 text-sm sm:px-8">
          <span className="text-white"><Logo size={26} /></span>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/demo" className="hover:text-white">Demo</Link>
            <a href="#precio" className="hover:text-white">Precio</a>
            <Link href="/login" className="hover:text-white">Ingresar</Link>
          </nav>
          <p>© {new Date().getFullYear()} Mio</p>
        </div>
      </footer>
    </>
  )
}
