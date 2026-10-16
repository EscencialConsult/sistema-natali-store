import { useEffect } from 'react'
import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { MENSAJE_CERRADA_POR_DEFECTO } from '../lib/configTienda.js'
import { BASE_ADMIN } from '../rutas.js'

// Lo que ve la clienta cuando la administración cierra la tienda al público (o cuando todavía no está activada en la base).
// Nada se pierde: el sistema del equipo sigue en /admin, y la clienta tiene a mano el WhatsApp y los locales.
export default function MantenimientoPage({ nombre, mensaje, whatsapp, locales = [] }) {
  useEffect(() => {
    document.title = `${nombre} · Tienda en preparación`
    // Mientras está cerrada no conviene que los buscadores la indexen.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.append(meta)
    return () => meta.remove()
  }, [nombre])

  return (
    <main className="tienda flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <img src="/brand/imagotipo.png" width="420" height="412" alt={nombre} className="h-32 w-auto md:h-40" />
      <p className="t-suave mt-8 text-xs font-semibold uppercase tracking-[0.2em]">Tienda mayorista</p>
      <h1 className="mt-3 max-w-xl font-titulo text-3xl font-semibold tracking-tight text-balance md:text-4xl">Estamos preparando la tienda</h1>
      <p className="t-suave mt-4 max-w-md text-balance leading-relaxed">{mensaje || MENSAJE_CERRADA_POR_DEFECTO}</p>
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-whatsapp px-6 text-sm font-semibold text-sobre-tinta hover:brightness-95">
          <MessageCircle size={18} aria-hidden /> Escribinos por WhatsApp
        </a>
      )}
      {locales.length > 0 && (
        <ul className="mt-10 grid w-full max-w-2xl gap-4 text-left sm:grid-cols-2">
          {locales.map((l, i) => (
            <li key={`${l.nombre}-${i}`} className="flex flex-col gap-1.5 rounded-2xl border border-(--t-beige) bg-white/60 p-5 text-[0.9375rem]">
              <p className="font-titulo text-lg font-semibold">{l.nombre}</p>
              {l.direccion && <p className="flex items-start gap-2"><MapPin size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{l.direccion}</p>}
              {l.horario && <p className="flex items-start gap-2"><Clock size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{l.horario}</p>}
            </li>
          ))}
        </ul>
      )}
      <a href={`${BASE_ADMIN}/`} className="t-suave mt-12 text-sm underline-offset-4 hover:underline">Acceso del equipo</a>
    </main>
  )
}
