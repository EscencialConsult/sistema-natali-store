import Logo from '../../components/Logo.jsx'
import { Link } from 'react-router-dom'
import { useConfig, useSitio } from '../../data/hooks.js'
import { telefonoLegible, urlWhatsApp } from '../../lib/whatsapp.js'

const LEGALES = [
  { slug: 'terminos', etiqueta: 'Términos de compra' },
  { slug: 'envios-y-cambios', etiqueta: 'Envíos y cambios' },
  { slug: 'privacidad', etiqueta: 'Privacidad' },
]

// El año se calcula una vez al cargar el módulo (no en cada render).
const ANIO = new Date().getFullYear()

const red = (url, nombre) => (url ? <a key={nombre} href={url} target="_blank" rel="noreferrer" className="hover:underline">{nombre}</a> : null)

// Pie oscuro del sitio: contacto, horarios, redes, legales. Todo sale de repos.sitio y config.
export default function Pie() {
  const sitio = useSitio()
  const cfg = useConfig()
  const s = sitio.datos
  const wsp = cfg.datos?.whatsapp_tienda
  const nombre = cfg.datos?.negocio?.nombre ?? 'Modas Naty'
  return (
    <footer className="bg-pie text-sm text-sobre-pie">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-6">
        <div className="flex flex-col gap-2">
          <Logo variante="completo" className="h-24 self-start" />
          {s?.lema && <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">{s.lema}</p>}
          {s && <p className="opacity-80">{s.local.direccion}{s.local.direccion && s.local.ciudad ? ' · ' : ''}{s.local.ciudad}</p>}
          {wsp && <a href={urlWhatsApp(wsp)} target="_blank" rel="noreferrer" className="hover:underline">WhatsApp {telefonoLegible(wsp)}</a>}
          {s?.local.telefono && <a href={`tel:+${s.local.telefono.replace(/\D/g, '')}`} className="hover:underline">Tel. {telefonoLegible(s.local.telefono)}</a>}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Horarios</p>
          {s?.local.horarios.map((h) => (
            <p key={h.dias} className="opacity-80"><span className="font-medium opacity-100">{h.dias}:</span> {h.horas}</p>
          ))}
          <div className="mt-2 flex gap-4">
            {s && [red(s.local.instagram, 'Instagram'), red(s.local.facebook, 'Facebook'), red(s.local.tiktok, 'TikTok')]}
          </div>
        </div>
        <nav aria-label="Información legal" className="flex flex-col gap-2">
          {LEGALES.map((l) => (
            <Link key={l.slug} to={`/legales/${l.slug}`} className="hover:underline">{l.etiqueta}</Link>
          ))}
          <Link to="/seguimiento" className="hover:underline">Seguir mi pedido</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs opacity-70">
        © {ANIO} {nombre} · Hecho por Escencial
      </div>
    </footer>
  )
}
