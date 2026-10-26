import { MessageCircle } from 'lucide-react'
import { ESCENCIAL } from '../lib/escencial.js'

// Crédito de Escencial Consultora al final de todo pie de página público (catálogo, tienda, login).
// Va SIEMPRE debajo de los datos del negocio, separado por una línea: nunca compite con la marca del cliente.
// Mismo componente en todos los sistemas de la familia; los datos de contacto viven en lib/escencial.js.

const ANIO = new Date().getFullYear()

// `tono`: 'oscuro' para pies con fondo oscuro (`bg-pie` del catálogo, vino de la tienda; acá no hay token `sobre-pie`, va en blanco) · 'claro' para fondos blancos (el mismo logo, invertido).
// `compacto`: una sola línea de texto, para el login.
export default function PieEscencial({ tono = 'oscuro', compacto = false, className = '' }) {
  if (compacto) {
    // Dos líneas a propósito: el teléfono no se parte al achicarse la tarjeta.
    return (
      <div className={`flex flex-col gap-0.5 text-center text-xs text-texto-tenue ${className}`}>
        <p>
          Desarrollado por{' '}
          <a href={ESCENCIAL.web} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-4 hover:underline">
            {ESCENCIAL.nombre}
          </a>
        </p>
        <p>
          Soporte{' '}
          <a href={ESCENCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-medium underline-offset-4 hover:underline" aria-label={`Soporte por WhatsApp, ${ESCENCIAL.telefono}, ${ESCENCIAL.soporte}`}>
            {ESCENCIAL.telefono}
          </a>
          {' · '}{ESCENCIAL.soporte}
        </p>
      </div>
    )
  }

  const oscuro = tono === 'oscuro'
  const texto = oscuro ? 'text-white/60' : 'text-texto-tenue'
  const enlace = oscuro ? 'text-white/85 hover:text-white' : 'text-texto hover:text-tinta'
  const borde = oscuro ? 'border-white/15' : 'border-borde'

  return (
    <div className={`border-t ${borde} ${className}`}>
      <div className={`mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 text-xs ${texto} sm:flex-row sm:justify-between sm:gap-4 md:px-8`}>
        <a href={ESCENCIAL.web} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 ${enlace}`} aria-label={`${ESCENCIAL.nombre}, abre en una pestaña nueva`}>
          <span>Desarrollado por</span>
          <img src="/escencial-logoblanco-footer.png" alt={ESCENCIAL.nombre} width="463" height="158" className={`h-7 w-auto ${oscuro ? '' : 'invert'}`} />
        </a>
        <a href={ESCENCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-1.5 ${enlace}`} aria-label={`Soporte por WhatsApp, ${ESCENCIAL.telefono}, ${ESCENCIAL.soporte}, abre en una pestaña nueva`}>
          <MessageCircle size={14} aria-hidden />
          <span>Soporte: <span className="whitespace-nowrap">{ESCENCIAL.telefono}</span> · {ESCENCIAL.soporte}</span>
        </a>
        <p>© {ANIO} {ESCENCIAL.nombre}</p>
      </div>
    </div>
  )
}
