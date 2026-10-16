import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { useConfig } from '../../../data/hooks.js'
import { telefonoLegible, urlWhatsApp } from '../../../lib/whatsapp.js'

// Dónde está la tienda: dirección (enlace al mapa, sin embeber Google Maps), horarios y WhatsApp.
export default function Local({ sitio }) {
  const cfg = useConfig()
  if (!sitio) return null
  const { local } = sitio
  const wsp = cfg.datos?.whatsapp_tienda
  const mapa = local.mapa_url || (local.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${local.direccion}, ${local.ciudad}`)}` : null)
  return (
    <section aria-labelledby="local-titulo" className="grid gap-6 border-t border-borde pt-8 md:grid-cols-3">
      <div className="flex flex-col gap-2 md:col-span-1">
        <h2 id="local-titulo" className="text-2xl md:text-3xl">Nuestra tienda</h2>
        <p className="text-sm text-texto-suave">Pasá a ver los modelos o retirá tu pedido.</p>
      </div>
      {/* Un <dl> solo admite dt/dd (o div que los agrupe): el icono va dentro del dt. */}
      <dl className="grid gap-5 md:col-span-2 md:grid-cols-2">
        <div>
          <dt className="flex items-center gap-2 text-sm font-medium"><MapPin size={18} strokeWidth={1.75} aria-hidden className="text-texto-tenue" /> Dirección</dt>
          <dd className="pl-6.5 text-sm text-texto-suave">
            {mapa ? <a href={mapa} target="_blank" rel="noreferrer" className="underline underline-offset-4">{local.direccion}, {local.ciudad}</a> : `${local.direccion} ${local.ciudad}`}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-sm font-medium"><Clock size={18} strokeWidth={1.75} aria-hidden className="text-texto-tenue" /> Horarios</dt>
          {local.horarios.map((h) => (
            <dd key={h.dias} className="pl-6.5 text-sm text-texto-suave">{h.dias}: {h.horas}</dd>
          ))}
        </div>
        {wsp && (
          <div>
            <dt className="flex items-center gap-2 text-sm font-medium"><MessageCircle size={18} strokeWidth={1.75} aria-hidden className="text-texto-tenue" /> WhatsApp</dt>
            <dd className="pl-6.5 text-sm text-texto-suave"><a href={urlWhatsApp(wsp)} target="_blank" rel="noreferrer" className="underline underline-offset-4">{telefonoLegible(wsp)}</a></dd>
          </div>
        )}
      </dl>
    </section>
  )
}
