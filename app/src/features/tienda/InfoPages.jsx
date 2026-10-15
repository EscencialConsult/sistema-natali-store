import { Link } from 'react-router-dom'
import { MapPin, MessageCircle } from 'lucide-react'
import { useConfigTienda } from './data/catalogo.js'
import { enlaceWhatsApp } from './lib/whatsapp.js'
import { PASOS_POR_DEFECTO, validarComoComprar, validarContactos, validarHorarios, validarLocales } from './lib/configTienda.js'
import { BASE_TIENDA, RUTA_PEDIDO } from './rutas.js'

// Todo lo que viene de la configuración pasa por las mismas validaciones que al guardar, y se muestra como texto.

export function ComoComprarPage() {
  const config = useConfigTienda().datos
  const propios = validarComoComprar(config?.como_comprar).valor
  const pasos = propios.length ? propios : PASOS_POR_DEFECTO
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl tracking-tight md:text-4xl">Cómo comprar</h1>
      <ol className="flex flex-col gap-4">
        {pasos.map((p, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tinta text-sm font-semibold text-sobre-tinta" aria-hidden>{i + 1}</span>
            <p className="pt-1">{p}</p>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link to={BASE_TIENDA} className="inline-flex min-h-12 items-center rounded-pildora bg-tinta px-6 text-sm font-medium text-sobre-tinta">Ver el catálogo</Link>
        <Link to={RUTA_PEDIDO} className="inline-flex min-h-12 items-center rounded-pildora bg-superficie px-6 text-sm font-medium">Mi pedido</Link>
      </div>
    </div>
  )
}

export function DondeEstamosPage() {
  const config = useConfigTienda().datos
  const locales = validarLocales(config?.locales).valor
  const horarios = validarHorarios(config?.horarios).valor
  const contactos = validarContactos(config?.contactos).valor
  const vacio = !locales.length && !horarios.length && !contactos.length

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-3xl tracking-tight md:text-4xl">Dónde estamos</h1>
      {vacio && <p className="text-texto-suave">Pronto vas a encontrar acá nuestras direcciones y horarios.</p>}

      {locales.length > 0 && (
        <ul className="flex flex-col gap-5">
          {locales.map((l) => (
            <li key={l.nombre} className="flex flex-col gap-2 rounded-2xl bg-superficie p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} aria-hidden /> {l.nombre}</h2>
              {l.direccion && <p>{l.direccion}</p>}
              {l.indicaciones && <p className="text-sm text-texto-suave">{l.indicaciones}</p>}
              {l.mapa && (
                <a href={l.mapa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start rounded-pildora bg-tinta px-5 text-sm font-medium text-sobre-tinta">
                  Cómo llegar
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {horarios.length > 0 && (
        <section aria-labelledby="horarios" className="flex flex-col gap-2">
          <h2 id="horarios" className="text-lg font-semibold">Horarios de atención</h2>
          <ul className="flex flex-col gap-1">
            {horarios.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </section>
      )}

      {contactos.length > 0 && (
        <section aria-labelledby="contactos" className="flex flex-col gap-3">
          <h2 id="contactos" className="text-lg font-semibold">Hablá con nosotros</h2>
          <ul className="flex flex-col gap-2">
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
    </div>
  )
}
