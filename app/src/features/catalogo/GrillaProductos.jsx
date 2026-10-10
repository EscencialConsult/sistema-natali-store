import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { Chip, EmptyState, ErrorState, Select, Skeleton } from '../../components/ui/index.js'
import { useCategorias, useConfig, useProductos, useStockResumen } from '../../data/hooks.js'
import ProductoCard from './ProductoCard.jsx'

const TANDA = 24
const ORDENES = [
  { valor: 'codigo', etiqueta: 'Por código' },
  { valor: 'nombre', etiqueta: 'Por nombre' },
  { valor: 'precio', etiqueta: 'Menor precio' },
]
const ordenar = {
  codigo: (a, b) => a.codigo.localeCompare(b.codigo),
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  precio: (a, b) => a.precio_docena_usd_cent - b.precio_docena_usd_cent,
}

// Grilla con filtro por categoría y carga por tandas (no se piden 138 fotos juntas).
export default function GrillaProductos({ onAbrir, publico = false }) {
  const [categoria, setCategoria] = useState(null)
  const [orden, setOrden] = useState('codigo')
  const [visibles, setVisibles] = useState(TANDA)
  const cats = useCategorias()
  const prods = useProductos({ categoria_id: categoria })
  const stock = useStockResumen()
  const cfg = useConfig()
  const centinela = useRef(null)

  const lista = useMemo(() => (prods.datos ? [...prods.datos].sort(ordenar[orden]) : []), [prods.datos, orden])

  useEffect(() => {
    const el = centinela.current
    if (!el) return
    const obs = new IntersectionObserver((e) => e[0].isIntersecting && setVisibles((v) => v + TANDA), { rootMargin: '400px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [lista.length, visibles])

  // Al cambiar el filtro se vuelve a la primera tanda.
  const elegirCategoria = (c) => {
    setCategoria(c)
    setVisibles(TANDA)
  }
  const elegirOrden = (o) => {
    setOrden(o)
    setVisibles(TANDA)
  }

  const mostrarPrecio = !publico || cfg.datos?.mostrar_precios_publico
  const agotado = (p) => !publico && !!stock.datos && (stock.datos[p.id] ?? 0) <= 0

  return (
    <section aria-label="Catálogo" className="flex flex-col gap-4">
      {/* Celular: selector (sin scroll horizontal). Tablet y escritorio: chips que bajan de línea. */}
      <Select
        etiqueta="Categoría"
        opciones={[{ valor: '', etiqueta: 'Todas las categorías' }, ...(cats.datos ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre }))]}
        valor={categoria ?? ''}
        onChange={(v) => elegirCategoria(v || null)}
        className="md:hidden"
      />
      <div className="hidden flex-wrap gap-2 md:flex">
        <Chip activo={categoria === null} onClick={() => elegirCategoria(null)}>Todos</Chip>
        {cats.datos?.map((c) => (
          <Chip key={c.id} activo={categoria === c.id} onClick={() => elegirCategoria(c.id)}>{c.nombre}</Chip>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-texto-suave" aria-live="polite">{prods.datos ? <><span className="font-semibold text-texto tabular-nums">{lista.length}</span> modelos</> : ''}</p>
        <Select ariaLabel="Ordenar modelos" opciones={ORDENES} valor={orden} onChange={elegirOrden} className="w-44" />
      </div>

      {prods.cargando && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Cargando catálogo">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
        </div>
      )}
      {prods.error && <ErrorState mensaje="No pudimos cargar el catálogo." onReintentar={prods.reintentar} />}
      {prods.datos && lista.length === 0 && (
        <EmptyState icono={PackageSearch} titulo="No hay modelos en esta categoría" texto="Probá con otra categoría o con “Todos”." />
      )}
      {lista.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-8">
          {lista.slice(0, visibles).map((p) => (
            <li key={p.id}>
              <ProductoCard producto={p} onAbrir={onAbrir} mostrarPrecio={mostrarPrecio} agotado={agotado(p)} />
            </li>
          ))}
        </ul>
      )}
      {visibles < lista.length && <div ref={centinela} className="h-10" aria-hidden />}
    </section>
  )
}
