import { useEffect } from 'react'
import { Clock, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react'
import { ErrorState, Skeleton } from '../../components/ui/index.js'
import { useConfig, useSitio } from '../../data/hooks.js'
import { telefonoLegible, urlWhatsApp } from '../../lib/whatsapp.js'
import EncabezadoPagina from './EncabezadoPagina.jsx'

function Tarjeta({ icono: Icono, titulo, children }) {
  return (
    <div className="flex gap-4 rounded-tarjeta bg-superficie p-5">
      <Icono size={22} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-texto-tenue" />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-lg">{titulo}</h2>
        <div className="flex flex-col gap-1 text-sm text-texto-suave">{children}</div>
      </div>
    </div>
  )
}

const enlace = 'inline-flex min-h-11 items-center underline underline-offset-4 text-texto'

// Contacto: cada dato es accionable (WhatsApp, teléfono, mapa, redes). Sin formulario (evita spam y correo).
export default function ContactoPage() {
  const sitio = useSitio()
  const cfg = useConfig()
  useEffect(() => {
    document.title = 'Contacto · Modas Naty'
  }, [])
  if (sitio.cargando || cfg.cargando) return <div className="flex flex-col gap-3" role="status" aria-label="Cargando"><Skeleton className="h-9 w-48" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
  if (sitio.error || cfg.error) return <ErrorState mensaje="No pudimos cargar esta página." onReintentar={() => { sitio.reintentar(); cfg.reintentar() }} />
  const { local } = sitio.datos
  const wsp = cfg.datos?.whatsapp_tienda
  const mapa = local.mapa_url || (local.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${local.direccion}, ${local.ciudad}`)}` : null)
  const redes = [['Instagram', local.instagram], ['Facebook', local.facebook], ['TikTok', local.tiktok]].filter(([, u]) => u)

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Contacto" bajada="Escribinos o pasá por la tienda." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wsp && (
          <Tarjeta icono={MessageCircle} titulo="WhatsApp">
            <a href={urlWhatsApp(wsp, 'Hola, quiero hacer una consulta.')} target="_blank" rel="noreferrer" className={enlace}>{telefonoLegible(wsp)}</a>
          </Tarjeta>
        )}
        {local.telefono && (
          <Tarjeta icono={Phone} titulo="Teléfono">
            <a href={`tel:+${local.telefono.replace(/\D/g, '')}`} className={enlace}>{telefonoLegible(local.telefono)}</a>
          </Tarjeta>
        )}
        <Tarjeta icono={MapPin} titulo="Dirección">
          {mapa ? <a href={mapa} target="_blank" rel="noreferrer" className={enlace}>{local.direccion}, {local.ciudad}</a> : <p>{local.direccion} {local.ciudad}</p>}
        </Tarjeta>
        <Tarjeta icono={Clock} titulo="Horarios">
          {local.horarios.map((h) => <p key={h.dias}><span className="font-medium text-texto">{h.dias}:</span> {h.horas}</p>)}
        </Tarjeta>
        {redes.length > 0 && (
          <Tarjeta icono={Share2} titulo="Redes">
            {redes.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer" className={enlace}>{n}</a>)}
          </Tarjeta>
        )}
      </div>
      {sitio.datos.provisorio && <p className="max-w-2xl rounded-control bg-alerta-fondo p-3 text-sm text-alerta">Datos provisorios: se reemplazan con los reales desde el panel.</p>}
    </div>
  )
}
