import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, MessageCircle } from 'lucide-react'
import { enlaceComoLlegar } from '../lib/configTienda.js'
import { BASE_ADMIN } from '../rutas.js'

const ANIO = new Date().getFullYear()

// Pie de la tienda: marca con su imagotipo, la navegación como lista grande, los locales con dirección y horario,
// la salida a WhatsApp y el aviso de derechos. Los locales vienen de la configuración (ya validada).
export default function Pie({ nombre, enlaces, locales, whatsapp }) {
  return (
    <footer className="bg-(--t-vino-oscuro) text-(--t-crema)">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-10 pt-14 md:px-8 lg:grid-cols-[1.1fr_0.9fr_1fr] lg:gap-14 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <img src="/brand/imagotipo.png" width="420" height="402" alt={nombre} className="h-28 w-auto" />
          <p className="max-w-sm font-titulo text-2xl font-semibold leading-snug tracking-tight">
            Elegís por docena, pedís por WhatsApp y retirás en el local.
          </p>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-whatsapp px-6 text-sm font-semibold text-sobre-tinta hover:brightness-110"
            >
              <MessageCircle size={18} aria-hidden /> Escribinos por WhatsApp
            </a>
          )}
        </div>

        <nav aria-label="Información">
          <ul className="border-t border-white/15">
            {enlaces.map((e) => (
              <li key={e.a} className="border-b border-white/15">
                <Link to={e.a} className="group flex min-h-14 items-center justify-between gap-4 py-2 font-titulo text-xl font-medium hover:text-(--t-rosa)">
                  {e.texto}
                  <ArrowUpRight size={18} aria-hidden className="shrink-0 opacity-50 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="pie-locales" className="flex flex-col gap-6">
          <h2 id="pie-locales" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Nuestros locales</h2>
          {locales.length > 0 ? (
            <ul className="flex flex-col gap-6">
              {locales.map((l, i) => {
                const llegar = enlaceComoLlegar(l)
                return (
                  <li key={`${l.nombre}-${i}`} className="flex flex-col gap-1 text-sm text-white/80">
                    <p className="font-titulo text-lg font-semibold text-white">{l.nombre}</p>
                    {l.direccion && <p className="flex items-start gap-2"><MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />{l.direccion}</p>}
                    {l.horario && <p className="pl-[1.4rem]">{l.horario}</p>}
                    {llegar && (
                      <a href={llegar} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center self-start pl-[1.4rem] font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">
                        Cómo llegar
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-white/80">
              Mirá nuestras direcciones y horarios en <Link to="/contacto" className="text-white underline underline-offset-4">Contacto</Link>.
            </p>
          )}
        </section>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/70 md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {ANIO} {nombre}. Todos los derechos reservados.</p>
          <p className="flex flex-wrap items-center gap-x-4">
            <span>Venta mayorista por docena y media docena</span>
            {/* Enlace normal (no del router): el sistema del equipo es otra aplicación y se carga aparte. */}
            <a href={`${BASE_ADMIN}/`} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-white hover:underline">Acceso del equipo</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
