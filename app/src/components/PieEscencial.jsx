import { MessageCircle } from 'lucide-react'
import { ESCENCIAL } from '../lib/escencial.js'

// Crédito «ONE by Escencial» al final de todo pie de página público (catálogo, tienda, login), con el mismo
// formato que el pie de Core-Talent. Va SIEMPRE debajo de los datos del negocio, separado por una línea:
// nunca compite con la marca del cliente. Mismo componente en todos los sistemas; los datos viven en lib/escencial.js.

const ANIO = new Date().getFullYear()

// Logos: el de ONE es a color y sirve sobre cualquier fondo; el de Escencial es blanco y en fondos claros se invierte.
function Logos({ claro, alto = 'h-7' }) {
  return (
    <>
      <img src="/one-logocolor.png" alt={ESCENCIAL.one} width="800" height="400" className={`${alto === 'h-7' ? 'h-8' : 'h-6'} w-auto`} />
      <span>by</span>
      <img src="/escencial-logoblanco-footer.png" alt={ESCENCIAL.nombre} width="463" height="158" className={`${alto} w-auto ${claro ? 'invert' : ''}`} />
    </>
  )
}

// `tono`: 'oscuro' para pies con fondo `bg-pie` · 'claro' para fondos blancos. `compacto`: versión chica para el login.
export default function PieEscencial({ tono = 'oscuro', compacto = false, className = '' }) {
  const claro = tono === 'claro'

  if (compacto) {
    return (
      <div className={`flex flex-col items-center gap-1.5 text-center text-xs text-texto-tenue ${className}`}>
        <a href={ESCENCIAL.web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-texto hover:text-tinta" aria-label={`Desarrollado por ${ESCENCIAL.one} y ${ESCENCIAL.nombre}, abre en una pestaña nueva`}>
          <span>Desarrollado por</span>
          <Logos claro alto="h-5" />
        </a>
        <a href={ESCENCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline" aria-label="Soporte por WhatsApp, abre en una pestaña nueva">
          <MessageCircle size={14} aria-hidden />
          <span>Soporte por WhatsApp</span>
        </a>
      </div>
    )
  }

  const texto = claro ? 'text-texto-tenue' : 'text-sobre-pie/60'
  const fuerte = claro ? 'text-texto' : 'text-sobre-pie/90'
  const enlace = claro ? 'text-texto hover:text-tinta' : 'text-sobre-pie/85 hover:text-sobre-pie'
  const borde = claro ? 'border-borde' : 'border-sobre-pie/15'

  return (
    <div className={`border-t ${borde} ${className}`}>
      <div className={`mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 text-xs ${texto} md:flex-row md:flex-wrap md:justify-between md:gap-x-6 md:px-8`}>
        <a href={ESCENCIAL.web} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 ${enlace}`} aria-label={`Desarrollado por ${ESCENCIAL.one} y ${ESCENCIAL.nombre}, abre en una pestaña nueva`}>
          <span>Desarrollado por</span>
          <Logos claro={claro} />
        </a>
        <p className="text-center">
          Contribución de <strong className={`font-semibold ${fuerte}`}>{ESCENCIAL.fundacion}</strong>
        </p>
        <a href={ESCENCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-1.5 ${enlace}`} aria-label="Soporte por WhatsApp, abre en una pestaña nueva">
          <MessageCircle size={14} aria-hidden />
          <span>Soporte por WhatsApp</span>
        </a>
        <p>© {ANIO} {ESCENCIAL.nombre}</p>
      </div>
    </div>
  )
}
