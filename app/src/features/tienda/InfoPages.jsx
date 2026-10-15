import { Link } from 'react-router-dom'
import { MapPin, MessageCircle } from 'lucide-react'
import { useConfigTienda } from './data/catalogo.js'
import { enlaceWhatsApp } from './lib/whatsapp.js'
import {
  PASOS_POR_DEFECTO,
  PREGUNTAS_FRECUENTES,
  QUIENES_SOMOS_POR_DEFECTO,
  validarComoComprar,
  validarContactos,
  validarHorarios,
  validarLocales,
  validarQuienesSomos,
} from './lib/configTienda.js'
import { RUTA_CATALOGO, RUTA_CONTACTO, RUTA_PEDIDO } from './rutas.js'
import { useVolverArriba } from './useVolverArriba.js'

// Todo lo que viene de la configuración pasa por las mismas validaciones que al guardar, y se muestra como texto.

export function QuienesSomosPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const propios = validarQuienesSomos(config?.quienes_somos).valor
  const parrafos = propios.length ? propios : QUIENES_SOMOS_POR_DEFECTO
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-titulo text-3xl font-semibold tracking-tight md:text-4xl">Quiénes somos</h1>
      <div className="flex flex-col gap-4 text-lg leading-relaxed">
        {parrafos.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center rounded-pildora bg-tinta px-6 text-sm font-medium text-sobre-tinta">Ver el catálogo</Link>
        <Link to={RUTA_CONTACTO} className="inline-flex min-h-12 items-center rounded-pildora bg-superficie px-6 text-sm font-medium">Contacto</Link>
      </div>
    </div>
  )
}

// Ayuda: cómo comprar paso a paso y las preguntas que más se hacen.
export function AyudaPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const propios = validarComoComprar(config?.como_comprar).valor
  const pasos = propios.length ? propios : PASOS_POR_DEFECTO
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <h1 className="font-titulo text-3xl font-semibold tracking-tight md:text-4xl">Ayuda</h1>

      <section aria-labelledby="como-comprar" className="flex flex-col gap-4">
        <h2 id="como-comprar" className="text-xl font-semibold">Cómo comprar</h2>
        <ol className="flex flex-col gap-4">
          {pasos.map((p, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tinta text-sm font-semibold text-sobre-tinta" aria-hidden>{i + 1}</span>
              <p className="pt-1">{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="preguntas" className="flex flex-col gap-4">
        <h2 id="preguntas" className="text-xl font-semibold">Preguntas frecuentes</h2>
        <dl className="flex flex-col divide-y divide-borde/70">
          {PREGUNTAS_FRECUENTES.map((f) => (
            <div key={f.p} className="flex flex-col gap-1 py-4">
              <dt className="font-medium">{f.p}</dt>
              <dd className="t-suave">{f.r}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center rounded-pildora bg-tinta px-6 text-sm font-medium text-sobre-tinta">Ver el catálogo</Link>
        <Link to={RUTA_PEDIDO} className="inline-flex min-h-12 items-center rounded-pildora bg-superficie px-6 text-sm font-medium">Mi pedido</Link>
      </div>
    </div>
  )
}

// Contacto: locales con su dirección y horario, y los WhatsApp de la atención.
export function ContactoPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const locales = validarLocales(config?.locales).valor
  const horarios = validarHorarios(config?.horarios).valor
  const contactos = validarContactos(config?.contactos).valor
  const vacio = !locales.length && !horarios.length && !contactos.length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="font-titulo text-3xl font-semibold tracking-tight md:text-4xl">Contacto</h1>
      {vacio && <p className="t-suave">Pronto vas a encontrar acá nuestras direcciones y horarios.</p>}

      {contactos.length > 0 && (
        <section aria-labelledby="contactos" className="flex flex-col gap-3">
          <h2 id="contactos" className="text-xl font-semibold">Hablá con nosotros</h2>
          <ul className="flex flex-wrap gap-2">
            {contactos.map((c) => (
              <li key={c.nombre}>
                <a href={enlaceWhatsApp(c.telefono, 'Hola, quiero consultar por el catálogo.')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-pildora bg-whatsapp px-5 text-sm font-medium text-sobre-tinta shadow-boton hover:brightness-95">
                  <MessageCircle size={16} aria-hidden /> {c.nombre}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {locales.length > 0 && (
        <section aria-labelledby="locales" className="flex flex-col gap-4">
          <h2 id="locales" className="text-xl font-semibold">Nuestros locales</h2>
          <ul className="flex flex-col gap-5">
            {locales.map((l) => (
              <li key={l.nombre} className="flex flex-col gap-2 rounded-2xl bg-superficie p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} aria-hidden /> {l.nombre}</h3>
                {l.direccion && <p>{l.direccion}</p>}
                {l.horario && <p className="text-sm"><span className="t-suave">Horario: </span>{l.horario}</p>}
                {l.indicaciones && <p className="t-suave text-sm">{l.indicaciones}</p>}
                {l.mapa && (
                  <a href={l.mapa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start rounded-pildora bg-tinta px-5 text-sm font-medium text-sobre-tinta">
                    Cómo llegar
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {horarios.length > 0 && (
        <section aria-labelledby="horarios" className="flex flex-col gap-2">
          <h2 id="horarios" className="text-xl font-semibold">Horarios de atención</h2>
          <ul className="flex flex-col gap-1">
            {horarios.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
