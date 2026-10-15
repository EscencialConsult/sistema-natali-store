import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/cn.js'
import { slugDe } from '../../../lib/slug.js'

// Categoría: texto, sin recuadros. En celular, pestañas deslizables con subrayado; en escritorio, una lista con la
// cantidad de modelos. La activa va en el acento y en negrita (el estado no depende solo del color).
const item = (activo) =>
  cn(
    'inline-flex min-h-11 shrink-0 items-center justify-between gap-6 whitespace-nowrap text-sm transition-colors md:w-full md:min-h-9',
    activo ? 'font-semibold text-tinta' : 'text-texto-suave hover:text-texto',
  )

// Categorías como enlaces (cada una tiene URL), orden y buscador. `cuentas`: { [categoria_id]: modelos } y `total`.
export default function FiltrosCatalogo({ categorias, categoriaActiva, texto, onTexto, conQuery, cuentas = {}, total = null }) {
  const enlace = (cat) => (conQuery && texto ? `/catalogo${cat ? `/${slugDe(cat.nombre)}` : ''}?q=${encodeURIComponent(texto)}` : `/catalogo${cat ? `/${slugDe(cat.nombre)}` : ''}`)
  const cantidad = (n) => (Number.isInteger(n) ? <span className="hidden text-xs font-normal tabular-nums text-texto-tenue md:inline">{n}</span> : null)
  return (
    <>
      <div role="search" className="relative">
        <label htmlFor="buscar-catalogo" className="sr-only">Buscar modelo</label>
        <Search size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue" />
        <input
          id="buscar-catalogo"
          type="search"
          autoComplete="off"
          value={texto}
          onChange={(e) => onTexto(e.target.value)}
          placeholder="Buscar modelo"
          className="min-h-11 w-full rounded-t-control border-0 border-b-2 border-campo bg-superficie-2 pl-10 pr-11 text-base placeholder:text-texto-tenue [&::-webkit-search-cancel-button]:hidden"
        />
        {texto && (
          <button type="button" aria-label="Borrar búsqueda" onClick={() => onTexto('')} className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-texto-suave">
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      <nav aria-label="Categorías" className="-mx-4 flex gap-5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0">
        <Link to={enlace(null)} aria-current={!categoriaActiva ? 'page' : undefined} className={cn(item(!categoriaActiva), 'max-md:underline-offset-8', !categoriaActiva && 'max-md:underline max-md:decoration-2')}>
          Todos {cantidad(total)}
        </Link>
        {categorias.map((c) => {
          const activa = categoriaActiva?.id === c.id
          return (
            <Link key={c.id} to={enlace(c)} aria-current={activa ? 'page' : undefined} className={cn(item(activa), 'max-md:underline-offset-8', activa && 'max-md:underline max-md:decoration-2')}>
              {c.nombre} {cantidad(cuentas[c.id])}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
