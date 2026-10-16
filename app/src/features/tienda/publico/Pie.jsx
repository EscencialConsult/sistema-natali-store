import { Link } from 'react-router-dom'
import { MapPin, MessageCircle } from 'lucide-react'
import { enlaceComoLlegar } from '../lib/configTienda.js'
import { BASE_ADMIN } from '../rutas.js'

const ANIO = new Date().getFullYear()

// Pie compacto: marca y WhatsApp, la navegación en una línea, y los locales con dirección y horario en dos columnas.
// Los locales vienen de la configuración (ya validada).
export default function Pie({ nombre, enlaces, locales, whatsapp, frase, localesTitulo }) {
  return (
    <footer className="bg-(--t-vino-oscuro) text-(--t-crema)">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-8 pt-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="inline-flex items-center gap-2">
              <img src="/brand/isotipo.png" width="240" height="134" alt="" className="h-9 w-auto brightness-110" />
              <span className="font-titulo text-lg font-semibold tracking-tight text-white">{nombre}</span>
            </span>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-whatsapp px-4 text-sm font-semibold text-sobre-tinta hover:brightness-110">
                <MessageCircle size={16} aria-hidden /> Escribinos por WhatsApp
              </a>
            )}
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/75">{frase}</p>
          <nav aria-label="Información">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {enlaces.map((e) => (
                <li key={e.a}>
                  <Link to={e.a} className="inline-flex min-h-11 items-center text-sm font-medium text-white/85 underline-offset-4 hover:text-white hover:underline">{e.texto}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <section aria-labelledby="pie-locales" className="flex flex-col gap-3">
          <h2 id="pie-locales" className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/60">{localesTitulo}</h2>
          {locales.length > 0 ? (
            <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {locales.map((l, i) => {
                const llegar = enlaceComoLlegar(l)
                return (
                  <li key={`${l.nombre}-${i}`} className="flex flex-col gap-0.5 text-sm text-white/75">
                    <p className="font-semibold text-white">{l.nombre}</p>
                    {l.direccion && <p className="flex items-start gap-1.5"><MapPin size={14} aria-hidden className="mt-1 shrink-0" />{l.direccion}</p>}
                    {l.horario && <p className="pl-5 text-xs">{l.horario}</p>}
                    {llegar && (
                      <a href={llegar} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start pl-5 text-xs font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">
                        Cómo llegar
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/75">
              Direcciones y horarios en <Link to="/contacto" className="text-white underline underline-offset-4">Contacto</Link>.
            </p>
          )}
        </section>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-xs text-white/60 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {ANIO} {nombre}. Todos los derechos reservados.</p>
          {/* Enlace normal (no del router): el sistema del equipo es otra aplicación y se carga aparte. */}
          <a href={`${BASE_ADMIN}/`} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">Acceso del equipo</a>
        </div>
      </div>
    </footer>
  )
}
