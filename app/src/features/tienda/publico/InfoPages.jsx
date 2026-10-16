import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MessageCircle, Search, SearchX } from 'lucide-react'
import { useConfigTienda } from '../data/catalogo.js'
import { useAjustesTienda } from '../contexto.js'
import { enlaceWhatsApp } from '../lib/whatsapp.js'
import { normalizar } from '../lib/catalogo.js'
import {
  COMO_TRABAJAMOS,
  DIFERENCIALES,
  PASOS_POR_DEFECTO,
  PREGUNTAS_FRECUENTES,
  QUIENES_SOMOS_POR_DEFECTO,
  TEMAS_AYUDA,
  validarComoComprar,
  validarContactos,
  validarHorarios,
  validarLocales,
  validarQuienesSomos,
} from '../lib/configTienda.js'
import { RUTA_AYUDA, RUTA_CATALOGO, RUTA_CONTACTO, RUTA_QUIENES_SOMOS } from '../rutas.js'
import MapaDeLocales from './mapa/MapaDeLocales.jsx'
import { useVolverArriba } from './useVolverArriba.js'

// Todo lo que viene de la configuración pasa por las mismas validaciones que al guardar, y se muestra como texto.

const botonPrimario = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-(--t-vino) px-6 text-sm font-semibold text-white hover:bg-(--t-vino-oscuro)'
const botonWhatsapp = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 text-sm font-semibold text-sobre-tinta hover:brightness-95'
const botonSobreVino = 'inline-flex min-h-12 items-center rounded-lg border border-white/40 px-6 text-sm font-semibold hover:bg-white/10'

function Encabezado({ id, etiqueta, titulo, bajada }) {
  return (
    <header className="flex max-w-3xl flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--t-vino)">{etiqueta}</p>
      <h1 id={id} className="font-titulo text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">{titulo}</h1>
      {bajada && <p className="t-suave max-w-2xl text-lg leading-relaxed">{bajada}</p>}
    </header>
  )
}

function TituloSeccion({ id, children, bajada }) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <h2 id={id} className="font-titulo text-2xl font-semibold tracking-tight md:text-3xl">{children}</h2>
      {bajada && <p className="t-suave">{bajada}</p>}
    </div>
  )
}

// WhatsApp principal: el de la tienda; si no está cargado, el de la primera persona de la lista de contactos.
function useWhatsappPrincipal(mensaje) {
  const { ajustes } = useAjustesTienda()
  const config = useConfigTienda().datos
  const telefono = ajustes?.whatsapp_tienda || validarContactos(config?.contactos).valor[0]?.telefono
  return enlaceWhatsApp(telefono, mensaje)
}

function BandaFinal({ titulo, texto, children }) {
  return (
    <section className="flex flex-col items-start gap-6 rounded-[2rem] bg-(--t-vino) px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-12 md:py-12">
      <div className="flex max-w-xl flex-col gap-2">
        <h2 className="font-titulo text-2xl font-semibold tracking-tight md:text-3xl">{titulo}</h2>
        <p className="text-white/85">{texto}</p>
      </div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  )
}

export function QuienesSomosPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const propios = validarQuienesSomos(config?.quienes_somos).valor
  const parrafos = propios.length ? propios : QUIENES_SOMOS_POR_DEFECTO
  const locales = validarLocales(config?.locales).valor
  const wa = useWhatsappPrincipal('Hola, quiero consultar por el catálogo mayorista.')
  const [primero, ...resto] = parrafos

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <Encabezado id="titulo-quienes" etiqueta="Quiénes somos" titulo="Indumentaria femenina por mayor, con atención de cerca." />

      <section aria-label="Nuestra historia" className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <p className="font-titulo text-2xl font-medium leading-snug tracking-tight md:text-3xl">{primero}</p>
        <div className="flex flex-col gap-4 text-lg leading-relaxed">
          {resto.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <section aria-labelledby="que-ofrecemos" className="flex flex-col gap-8">
        <TituloSeccion id="que-ofrecemos">Qué ofrecemos</TituloSeccion>
        <ul className="grid gap-px overflow-hidden rounded-3xl border border-(--t-beige) bg-(--t-beige) md:grid-cols-3">
          {[
            ['Venta por docena y media docena', 'Cada modelo se compra por docena o por media docena, surtida en talles y colores, para que armes tu stock sin comprar de más.'],
            ['Atención directa', 'Un vendedor te atiende por WhatsApp: confirma disponibilidad, precio final y los datos para pagar.'],
            [locales.length > 1 ? `${locales.length} locales para retirar` : 'Local para retirar', 'Podés pasar a ver las prendas y retirar tu pedido, o coordinar la entrega con tu vendedor.'],
          ].map(([titulo, texto]) => (
            <li key={titulo} className="flex flex-col gap-3 bg-(--t-crema) p-6 md:p-8">
              <h3 className="font-titulo text-xl font-semibold tracking-tight">{titulo}</h3>
              <p className="t-suave leading-relaxed">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="como-trabajamos" className="flex flex-col gap-8">
        <TituloSeccion id="como-trabajamos" bajada="De elegir un modelo a retirar el pedido, en cuatro pasos.">Cómo trabajamos</TituloSeccion>
        <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
          {COMO_TRABAJAMOS.map((paso, i) => (
            <li key={paso.titulo} className="flex flex-col gap-2 border-t-2 border-(--t-vino) pt-4">
              <span className="font-titulo text-3xl font-semibold text-(--t-vino)" aria-hidden="true">{i + 1}</span>
              <h3 className="text-lg font-semibold">{paso.titulo}</h3>
              <p className="t-suave leading-relaxed">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="diferenciales" className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <TituloSeccion id="diferenciales">Lo que nos distingue</TituloSeccion>
        <dl className="flex flex-col divide-y divide-(--t-beige) border-y border-(--t-beige)">
          {DIFERENCIALES.map((d) => (
            <div key={d.titulo} className="flex flex-col gap-1 py-5">
              <dt className="font-titulo text-lg font-semibold">{d.titulo}</dt>
              <dd className="t-suave leading-relaxed">{d.texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      {locales.length > 0 && (
        <section aria-labelledby="donde-estamos" className="flex flex-col gap-8">
          <TituloSeccion id="donde-estamos" bajada="Pasá a ver las prendas y a retirar tu pedido.">Dónde estamos</TituloSeccion>
          <MapaDeLocales locales={locales} />
        </section>
      )}

      <BandaFinal titulo="Armá tu pedido cuando quieras" texto="Mirá los modelos con sus precios por docena y, cuando estés lista, tu vendedor te acompaña con el resto.">
        <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center rounded-lg bg-(--t-crema) px-6 text-sm font-semibold text-(--t-vino) hover:bg-white">Ver el catálogo</Link>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={botonWhatsapp}><MessageCircle size={18} aria-hidden /> Hablar por WhatsApp</a>
        ) : (
          <Link to={RUTA_CONTACTO} className={botonSobreVino}>Contacto</Link>
        )}
      </BandaFinal>
    </div>
  )
}

// Una pregunta del acordeón: botón con aria-expanded y panel con hidden. Cada una se abre y cierra por separado.
function Pregunta({ pregunta, abierta, onAlternar }) {
  const id = useId()
  return (
    <div className="border-b border-(--t-beige)">
      <h4>
        <button
          type="button"
          id={`${id}-boton`}
          aria-expanded={abierta}
          aria-controls={`${id}-panel`}
          onClick={onAlternar}
          className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left font-medium hover:text-(--t-vino)"
        >
          <span>{pregunta.p}</span>
          <ChevronDown size={18} aria-hidden className={`shrink-0 transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`} />
        </button>
      </h4>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-boton`} hidden={!abierta} className="pb-5 pr-8">
        <p className="t-suave leading-relaxed">{pregunta.r}</p>
      </div>
    </div>
  )
}

// Ayuda: cómo comprar paso a paso y las preguntas que más se hacen, por tema y con buscador.
export function AyudaPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const propios = validarComoComprar(config?.como_comprar).valor
  const pasos = propios.length ? propios : PASOS_POR_DEFECTO
  const wa = useWhatsappPrincipal('Hola, tengo una consulta sobre el catálogo mayorista.')
  const [busqueda, setBusqueda] = useState('')
  const [abiertas, setAbiertas] = useState(() => new Set())

  const q = normalizar(busqueda)
  const grupos = useMemo(
    () =>
      TEMAS_AYUDA.map((t) => ({
        ...t,
        preguntas: PREGUNTAS_FRECUENTES.filter((f) => f.tema === t.id && (!q || normalizar(`${f.p} ${f.r}`).includes(q))),
      })).filter((g) => g.preguntas.length > 0),
    [q],
  )
  const total = grupos.reduce((n, g) => n + g.preguntas.length, 0)
  const alternar = (clave) =>
    setAbiertas((previas) => {
      const nuevas = new Set(previas)
      if (nuevas.has(clave)) nuevas.delete(clave)
      else nuevas.add(clave)
      return nuevas
    })

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <Encabezado
        id="titulo-ayuda"
        etiqueta="Ayuda"
        titulo="Cómo comprar y respuestas a lo que más nos preguntan."
        bajada="Si algo no está acá, tu vendedor te lo confirma por WhatsApp."
      />

      <section aria-labelledby="como-comprar" className="flex flex-col gap-8">
        <TituloSeccion id="como-comprar">Cómo comprar</TituloSeccion>
        <ol className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {pasos.map((p, i) => (
            <li key={i} className="flex items-start gap-5 border-t border-(--t-beige) pt-5">
              <span className="font-titulo text-4xl font-semibold leading-none text-(--t-vino) tabular-nums" aria-hidden="true">{i + 1}</span>
              <p className="pt-1 text-[1.0625rem] leading-relaxed"><span className="sr-only">Paso {i + 1}: </span>{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="preguntas" className="flex flex-col gap-8">
        <TituloSeccion id="preguntas">Preguntas frecuentes</TituloSeccion>
        <label className="relative block max-w-md">
          <span className="sr-only">Buscar en las preguntas</span>
          <Search size={16} aria-hidden className="t-suave pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar una pregunta"
            className="min-h-12 w-full rounded-xl border border-(--t-beige) bg-white/70 pl-9 pr-3 text-sm placeholder:text-(--t-suave)"
          />
        </label>
        <p className="sr-only" role="status">{q ? `${total} ${total === 1 ? 'pregunta encontrada' : 'preguntas encontradas'}` : ''}</p>

        {grupos.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-(--t-beige) p-6">
            <SearchX size={22} aria-hidden className="t-suave" />
            <p className="font-medium">No encontramos preguntas para “{busqueda.trim()}”.</p>
            <p className="t-suave text-sm">Probá con otra palabra o escribinos y te respondemos.</p>
          </div>
        ) : (
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-2">
            {grupos.map((g) => (
              <section key={g.id} aria-labelledby={`tema-${g.id}`} className="flex flex-col gap-1">
                <h3 id={`tema-${g.id}`} className="mb-1 font-titulo text-xl font-semibold tracking-tight text-(--t-vino)">{g.titulo}</h3>
                <div className="border-t border-(--t-beige)">
                  {g.preguntas.map((f) => (
                    <Pregunta key={f.p} pregunta={f} abierta={abiertas.has(f.p) || (Boolean(q) && g.preguntas.length <= 2)} onAlternar={() => alternar(f.p)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <BandaFinal titulo="¿No encontraste lo que buscabas?" texto="Escribinos por WhatsApp y una persona del equipo te responde.">
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={botonWhatsapp}><MessageCircle size={18} aria-hidden /> Escribir por WhatsApp</a>}
        <Link to={RUTA_CONTACTO} className={botonSobreVino}>Ver contacto</Link>
      </BandaFinal>
    </div>
  )
}

const QUE_CONTARNOS = [
  'Qué modelos te interesan (el código o el nombre alcanza).',
  'Cuántas docenas o medias docenas pensás llevar.',
  'Si retirás en uno de los locales o necesitás coordinar la entrega.',
  'Si querés que te pasemos los datos para transferir.',
]

// Contacto: locales con dirección, horario y cómo llegar, y las personas de atención con su WhatsApp.
export function ContactoPage() {
  useVolverArriba()
  const config = useConfigTienda().datos
  const locales = validarLocales(config?.locales).valor
  const horarios = validarHorarios(config?.horarios).valor
  const contactos = validarContactos(config?.contactos).valor
  const wa = useWhatsappPrincipal('Hola, quiero consultar por el catálogo mayorista.')
  const vacio = !locales.length && !horarios.length && !contactos.length && !wa

  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <Encabezado
        id="titulo-contacto"
        etiqueta="Contacto"
        titulo="Escribinos o pasá por el local."
        bajada="Atendemos por WhatsApp y en nuestros locales. Elegí la forma que te quede mejor."
      />
      {vacio && <p className="t-suave">Pronto vas a encontrar acá nuestras direcciones y horarios.</p>}

      {(wa || contactos.length > 0) && (
        <section aria-labelledby="hablar" className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div className="flex flex-col gap-5">
            <TituloSeccion id="hablar" bajada="La forma más rápida de pedir o consultar.">Hablá con nosotros</TituloSeccion>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={`${botonWhatsapp} self-start`}><MessageCircle size={18} aria-hidden /> WhatsApp de la tienda</a>}
          </div>
          {contactos.length > 0 && (
            <ul className="flex flex-col divide-y divide-(--t-beige) border-y border-(--t-beige)">
              {contactos.map((c, i) => (
                <li key={`${c.nombre}-${i}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-titulo text-lg font-semibold">{c.nombre}</p>
                    <p className="t-suave text-sm">Atención por WhatsApp</p>
                  </div>
                  <a
                    href={enlaceWhatsApp(c.telefono, 'Hola, quiero consultar por el catálogo mayorista.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Escribir por WhatsApp a ${c.nombre}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-whatsapp px-4 text-sm font-semibold text-sobre-tinta hover:brightness-95"
                  >
                    <MessageCircle size={16} aria-hidden /> Escribir
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {locales.length > 0 && (
        <section aria-labelledby="locales" className="flex flex-col gap-8">
          <TituloSeccion id="locales" bajada="Direcciones, horarios y cómo llegar.">Nuestros locales</TituloSeccion>
          <MapaDeLocales locales={locales} conIndicaciones />
        </section>
      )}

      <section className="grid gap-10 md:grid-cols-2 md:gap-16">
        {horarios.length > 0 && (
          <div role="group" aria-labelledby="horarios" className="flex flex-col gap-4">
            <TituloSeccion id="horarios">Horarios de atención</TituloSeccion>
            <ul className="flex flex-col divide-y divide-(--t-beige) border-y border-(--t-beige)">
              {horarios.map((h) => <li key={h} className="py-3">{h}</li>)}
            </ul>
          </div>
        )}
        <div role="group" aria-labelledby="que-contarnos" className="flex flex-col gap-4">
          <TituloSeccion id="que-contarnos" bajada="Así te respondemos más rápido.">Qué contarnos para atenderte</TituloSeccion>
          <ul className="flex flex-col gap-3">
            {QUE_CONTARNOS.map((t) => (
              <li key={t} className="flex items-start gap-3 leading-relaxed">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-(--t-vino)" />
                {t}
              </li>
            ))}
          </ul>
          <p className="t-suave text-sm">
            ¿Primera vez? Mirá <Link to={RUTA_AYUDA} className="underline underline-offset-4">cómo comprar</Link> o conocé <Link to={RUTA_QUIENES_SOMOS} className="underline underline-offset-4">quiénes somos</Link>.
          </p>
        </div>
      </section>

      <Link to={RUTA_CATALOGO} className={`${botonPrimario} self-start`}>Ver el catálogo</Link>
    </div>
  )
}
