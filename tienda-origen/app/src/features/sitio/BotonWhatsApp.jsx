import { MessageCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useConfig } from '../../data/hooks.js'
import { mensajeConsulta, urlWhatsApp } from '../../lib/whatsapp.js'

// WhatsApp flotante (referencia Divas House). Se oculta donde hay un botón primario abajo (carrito, checkout) para no taparlo.
const OCULTO_EN = ['/carrito', '/checkout']

export default function BotonWhatsApp() {
  const cfg = useConfig()
  const { pathname } = useLocation()
  const url = urlWhatsApp(cfg.datos?.whatsapp_tienda, mensajeConsulta())
  if (!url || OCULTO_EN.some((r) => pathname.startsWith(r))) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-4 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-whatsapp text-sobre-tinta shadow-lg transition-transform duration-150 ease-salida motion-safe:active:scale-[0.97]"
    >
      <MessageCircle size={26} strokeWidth={1.75} aria-hidden />
    </a>
  )
}
