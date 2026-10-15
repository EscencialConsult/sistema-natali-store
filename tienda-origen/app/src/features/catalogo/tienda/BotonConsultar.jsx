import { MessageCircle } from 'lucide-react'
import { useConfig } from '../../../data/hooks.js'
import { mensajeConsulta, urlWhatsApp } from '../../../lib/whatsapp.js'

// Consulta por WhatsApp con el código del modelo (y el color elegido) ya escritos.
export default function BotonConsultar({ producto, color }) {
  const cfg = useConfig()
  const url = urlWhatsApp(cfg.datos?.whatsapp_tienda, mensajeConsulta(producto, color?.nombre))
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-whatsapp bg-whatsapp px-4 text-base font-medium text-sobre-tinta hover:opacity-90">
      <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Consultar
    </a>
  )
}
