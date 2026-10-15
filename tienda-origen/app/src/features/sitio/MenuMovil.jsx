import { MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Sheet } from '../../components/ui/index.js'
import { useConfig } from '../../data/hooks.js'
import { cn } from '../../lib/cn.js'
import { urlWhatsApp } from '../../lib/whatsapp.js'
import { MENU_SITIO } from '../../app/navegacion.js'

// Menú del sitio en celular. El <dialog> de Sheet atrapa el foco y cierra con Escape.
export default function MenuMovil({ abierto, onCerrar }) {
  const cfg = useConfig()
  const wsp = urlWhatsApp(cfg.datos?.whatsapp_tienda)
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Menú">
      <nav aria-label="Principal" className="flex flex-col gap-1">
        {MENU_SITIO.map((m) => (
          <NavLink
            key={m.ruta}
            to={m.ruta}
            end={m.ruta === '/'}
            onClick={onCerrar}
            className={({ isActive }) => cn('flex min-h-12 items-center rounded-control px-3 text-base', isActive ? 'bg-superficie-2 font-medium text-texto' : 'text-texto-suave')}
          >
            {m.etiqueta}
          </NavLink>
        ))}
        {wsp && (
          <a href={wsp} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-whatsapp px-4 text-base font-medium text-sobre-tinta">
            <MessageCircle size={20} strokeWidth={1.75} aria-hidden /> Escribinos por WhatsApp
          </a>
        )}
      </nav>
    </Sheet>
  )
}
