import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigationType, useSearchParams } from 'react-router-dom'
import { Search, SearchX, WifiOff } from 'lucide-react'
import { EmptyState, Skeleton } from '../../components/ui/index.js'
import { guardarScroll, leerScroll, useCatalogoCompleto } from './data/catalogo.js'
import { useAjustesTienda } from './contexto.js'
import { contarPorCategoria, filtrarYOrdenar, ORDENES, textoModelos } from './lib/catalogo.js'
import TarjetaProducto from './TarjetaProducto.jsx'

// El estado del catálogo vive en la dirección (?q=…&categoria=…&orden=…): el botón "atrás" desde una ficha lo recupera
// tal cual, y el enlace "Catálogo" del menú siempre arranca limpio.
export default function CatalogoPage() {
  const [params, setParams] = useSearchParams()
  const tipoNavegacion = useNavigationType()
  const { ajustes } = useAjustesTienda()
  const c = useCatalogoCompleto()

  const q = params.get('q') ?? ''
  const categoriaId = params.get('categoria') ?? ''
  const pedido = params.get('orden')
  const orden = ORDENES.some((o) => o.valor === pedido) ? pedido : 'novedades'

  const actualizar = (cambios) =>
    setParams(
      (anterior) => {
        const nuevo = new URLSearchParams(anterior)
        for (const [k, v] of Object.entries(cambios)) {
          if (v) nuevo.set(k, v)
          else nuevo.delete(k)
        }
        nuevo.delete('foco')
        return nuevo
      },
      { replace: true },
    )

  // Lo que se escribe se refleja en la dirección cuando la persona hace una pausa.
  const [texto, setTexto] = useState(q)
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto.trim() !== q) actualizar({ q: texto.trim() })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  const buscador = useRef(null)
  useEffect(() => {
    if (params.get('foco')) buscador.current?.focus()
  }, [params])

  const items = useMemo(() => c.items ?? [], [c.items])
  const categorias = useMemo(() => contarPorCategoria(items), [items])
  const lista = useMemo(() => filtrarYOrdenar(items, { texto: q, categoriaId, orden }), [items, q, categoriaId, orden])
  const visible = !c.cargando && items.length > 0

  // Posición: al volver (atrás) se restaura; al entrar por un enlace se empieza arriba.
  const resuelto = useRef(false)
  useLayoutEffect(() => {
    if (resuelto.current || c.cargando) return
    resuelto.current = true
    window.scrollTo(0, tipoNavegacion === 'POP' ? leerScroll() : 0)
  }, [c.cargando, tipoNavegacion])
  useEffect(() => {
    if (!visible) return undefined
    const guardar = () => guardarScroll(window.scrollY)
    window.addEventListener('scroll', guardar, { passive: true })
    return () => window.removeEventListener('scroll', guardar)
  }, [visible])

  const elegirCategoria = (id) => actualizar({ categoria: id })
  const botonCategoria = (id, nombre, cantidad) => (
    <button
      key={id || 'todas'}
      type="button"
      aria-pressed={categoriaId === id}
      onClick={() => elegirCategoria(id)}
      className={`flex min-h-10 shrink-0 items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors md:w-full ${
        categoriaId === id ? 'bg-(--t-vino) text-white' : 't-suave hover:bg-(--t-beige)/60 hover:text-(--t-tinta)'
      }`}
    >
      <span className="uppercase tracking-wide">{nombre}</span>
      <span className={`text-xs tabular-nums ${categoriaId === id ? 'text-white/80' : ''}`}>{cantidad}</span>
    </button>
  )

  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="font-titulo text-3xl font-semibold tracking-tight md:text-4xl">Catálogo</h1>
          <p className="t-suave">Elegí un modelo para ver sus fotos y precios por docena.</p>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
          <aside aria-label="Filtros" className="flex min-w-0 flex-col gap-4">
            <label className="relative block">
              <span className="sr-only">Buscar modelo</span>
              <Search size={16} aria-hidden className="t-suave pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={buscador}
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar modelo"
                className="min-h-11 w-full rounded-xl border border-(--t-beige) bg-white/70 pl-9 pr-3 text-sm placeholder:text-(--t-suave)"
              />
            </label>
            {categorias.length > 0 && (
              <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0">
                {botonCategoria('', 'Todas', items.length)}
                {categorias.map((k) => botonCategoria(k.id, k.nombre, k.cantidad))}
              </nav>
            )}
          </aside>

          <section aria-label="Modelos" className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="t-suave text-sm" aria-live="polite">{visible ? textoModelos(lista.length) : ' '}</p>
              <label className="flex items-center gap-2 text-sm">
                <span className="t-suave">Ordenar</span>
                <select
                  value={orden}
                  onChange={(e) => actualizar({ orden: e.target.value === 'novedades' ? '' : e.target.value })}
                  className="min-h-10 rounded-xl border border-(--t-beige) bg-white/70 px-3"
                >
                  {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                </select>
              </label>
            </div>

            {c.desdeCache && (
              <p role="status" className="flex items-center gap-2 rounded-2xl bg-(--t-beige)/60 px-4 py-3 text-sm">
                <WifiOff size={16} aria-hidden /> Sin conexión: te mostramos la última lista guardada. Los precios pueden no estar al día.
              </p>
            )}

            {c.cargando && (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
                {Array.from({ length: 8 }, (_, i) => <li key={i}><Skeleton className="aspect-[3/4]" /></li>)}
              </ul>
            )}

            {!c.cargando && c.error && <EmptyState icono={WifiOff} titulo="No pudimos cargar el catálogo" texto="Revisá tu conexión e intentá de nuevo." />}

            {visible && lista.length === 0 && (
              <EmptyState
                icono={SearchX}
                titulo={q ? `No encontramos “${q}”` : 'No hay modelos en esta categoría'}
                texto="Probá con otra búsqueda o mirá todas las categorías."
              />
            )}
            {!c.cargando && !c.error && items.length === 0 && (
              <EmptyState icono={SearchX} titulo="Todavía no hay modelos publicados" texto="Volvé pronto." />
            )}

            {lista.length > 0 && (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {lista.map((p) => <TarjetaProducto key={p.id} producto={p} ajustes={ajustes} />)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
