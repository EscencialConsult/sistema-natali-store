import { useEffect, useMemo } from 'react'
import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useConfig, useRecargoMp, useSitio } from '../../data/hooks.js'
import { useSoloNoIndex } from '../../lib/seo.js'
import { urlWhatsApp } from '../../lib/whatsapp.js'
import { seccionesCliente } from './contenidoCliente.js'
import GuiaLayout from './GuiaLayout.jsx'

// /ayuda — Guía de la clienta: cómo comprar, pagar y seguir el pedido. Los datos variables salen de la configuración.
export default function GuiaClientePage() {
  useSoloNoIndex()
  const recargo = useRecargoMp()
  const cfg = useConfig()
  const sitio = useSitio()
  useEffect(() => {
    document.title = 'Ayuda · Cómo comprar · Modas Naty'
  }, [])
  const local = sitio.datos?.local
  const whatsapp = cfg.datos?.whatsapp_tienda ?? ''
  const direccion = [local?.direccion, local?.ciudad].filter(Boolean).join(' · ')
  const secciones = useMemo(
    () => seccionesCliente({ recargo, whatsapp, direccion, horarios: local?.horarios ?? [] }),
    [recargo, whatsapp, direccion, local?.horarios],
  )
  const wsp = urlWhatsApp(whatsapp, 'Hola, necesito ayuda con mi compra.')
  return (
    <GuiaLayout
      titulo="Ayuda para comprar"
      intro="Cómo elegir, pagar y seguir tu pedido. Si algo no queda claro, escribinos."
      secciones={secciones}
      pie={
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/seguimiento" className="inline-flex min-h-11 items-center rounded-control bg-acento-tinte px-4 text-sm font-medium">Seguir mi pedido</Link>
          <Link to="/catalogo" className="inline-flex min-h-11 items-center rounded-control bg-superficie-2 px-4 text-sm font-medium">Ver el catálogo</Link>
          {wsp && (
            <a href={wsp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-whatsapp px-4 text-sm font-medium text-whatsapp hover:bg-superficie-2">
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Escribir por WhatsApp
            </a>
          )}
        </div>
      }
    />
  )
}
