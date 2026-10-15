import { useState } from 'react'
import { Menu, Search, ShoppingBag } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'
import { useCarritoItems } from '../../data/hooks.js'
import { cn } from '../../lib/cn.js'
import { MENU_SITIO } from '../../app/navegacion.js'
import MenuMovil from './MenuMovil.jsx'

const enlace = ({ isActive }) =>
  cn('inline-flex min-h-11 shrink-0 items-center px-3 text-sm font-medium', isActive ? 'text-texto underline decoration-tinta decoration-2 underline-offset-[6px]' : 'text-texto-suave hover:text-texto')

// Cabecera del sitio. Fila 1 (fija): menú, logo, buscar y carrito, todos de 44 px. Fila 2 solo en celular: los
// enlaces principales a la vista (el catálogo ya no queda escondido en la hamburguesa); se va con el scroll para no
// comer pantalla. En escritorio es una sola fila. El lema vive en el pie.
export default function Cabecera() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const items = useCarritoItems()
  const cantidad = (items.datos ?? []).reduce((t, i) => t + i.cantidad, 0)

  return (
    <>
      <header className="sticky top-0 z-20 bg-superficie">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-2 md:px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              className="flex size-11 items-center justify-center rounded-control text-texto hover:bg-superficie-2 md:hidden"
            >
              <Menu size={22} strokeWidth={1.75} aria-hidden />
            </button>
            <nav aria-label="Principal" className="hidden items-center md:flex">
              {MENU_SITIO.map((m) => (
                <NavLink key={m.ruta} to={m.ruta} end={m.ruta === '/'} className={enlace}>
                  {m.etiqueta}
                </NavLink>
              ))}
            </nav>
          </div>
          <Link to="/" aria-label="Modas Naty, ir al inicio" className="flex min-h-11 items-center justify-center px-2">
            <Logo />
          </Link>
          <div className="flex items-center justify-end">
            <Link to="/catalogo" aria-label="Buscar en el catálogo" className="flex size-11 items-center justify-center rounded-control text-texto hover:bg-superficie-2">
              <Search size={22} strokeWidth={1.75} aria-hidden />
            </Link>
            <Link to="/carrito" aria-label={cantidad > 0 ? `Carrito, ${cantidad} ${cantidad === 1 ? 'artículo' : 'artículos'}` : 'Carrito vacío'} className="relative flex size-11 items-center justify-center rounded-control text-texto hover:bg-superficie-2">
              <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
              {cantidad > 0 && (
                <span key={cantidad} aria-hidden className="pop absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-pildora bg-tinta px-1 text-[11px] font-semibold tabular-nums text-sobre-tinta">{cantidad > 99 ? '99+' : cantidad}</span>
              )}
            </Link>
          </div>
        </div>
        <MenuMovil abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      </header>
      {/* Fila 2 de celular: fuera del header fijo, así se va con el scroll. */}
      <nav aria-label="Secciones" className="flex overflow-x-auto bg-superficie px-2 [scrollbar-width:none] md:hidden">
        {MENU_SITIO.filter((m) => m.ruta !== '/').map((m) => (
          <NavLink key={m.ruta} to={m.ruta} className={enlace}>
            {m.etiqueta}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
