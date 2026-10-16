import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'

// Pestañas de la sección Productos: el catálogo, el stock y la búsqueda rápida por código son vistas de lo mismo.
// Cada pestaña es una ruta propia (los enlaces viejos siguen sirviendo) y solo aparece si el rol puede verla.
export default function SubnavProductos() {
  const { usuario } = useAuth()
  const items = [
    { to: '/administracion/productos', etiqueta: 'Catálogo', ver: puede(usuario.rol, 'catalogo.ver') },
    { to: '/administracion/stock', etiqueta: 'Stock', ver: puede(usuario.rol, 'stock.ver') },
    { to: '/administracion/buscar', etiqueta: 'Buscar por código', ver: puede(usuario.rol, 'catalogo.ver') },
  ].filter((i) => i.ver)
  if (items.length < 2) return null
  return (
    <nav aria-label="Secciones de productos" className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end
          className={({ isActive }) => cn('inline-flex min-h-11 shrink-0 items-center rounded-control px-3 text-sm font-medium', isActive ? 'text-texto underline decoration-tinta decoration-2 underline-offset-[6px]' : 'text-texto-suave hover:text-texto')}
        >
          {i.etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}
