import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchX, WifiOff } from 'lucide-react'
import { CampoBusqueda, EmptyState, Skeleton } from '../../components/ui/index.js'
import { useCatalogo, useCategorias } from './data/catalogo.js'
import { supabaseUrl } from './data/clientePublico.js'
import { useAjustesTienda } from './contexto.js'
import { fotosDe } from './lib/fotos.js'
import { rutaProducto } from './rutas.js'
import PrecioBloque from './PrecioBloque.jsx'

function Tarjeta({ producto, ajustes }) {
  const foto = fotosDe(producto, supabaseUrl)[0]
  return (
    <li>
      <Link to={rutaProducto(producto.id)} className="group flex flex-col gap-2">
        <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-superficie">
          {foto ? (
            <img src={foto} alt={producto.nombre} loading="lazy" decoding="async" width="600" height="800" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          ) : (
            <span className="flex size-full items-center justify-center text-sm text-texto-suave">Sin foto</span>
          )}
          {producto.nuevo && <span className="absolute left-2 top-2 rounded-pildora bg-tinta px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-sobre-tinta">Nuevo</span>}
        </span>
        <span className="text-xs uppercase tracking-wide text-texto-suave">{producto.codigo}</span>
        <span className="-mt-1 line-clamp-2 font-medium leading-snug">{producto.nombre}</span>
        <PrecioBloque producto={producto} ajustes={ajustes} compacto />
      </Link>
    </li>
  )
}

export default function CatalogoPage() {
  const [texto, setTexto] = useState('')
  const [buscar, setBuscar] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const { ajustes } = useAjustesTienda()
  const categorias = useCategorias().datos ?? []

  // Espera a que la persona termine de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => setBuscar(texto.trim()), 300)
    return () => clearTimeout(t)
  }, [texto])

  const c = useCatalogo({ texto: buscar, categoriaId })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl tracking-tight md:text-5xl">Catálogo</h1>
        <p className="max-w-md text-texto-suave">Elegí un modelo para ver sus fotos y precios por docena.</p>
      </div>

      <CampoBusqueda id="q-tienda" etiqueta="Buscar modelo" grande valor={texto} onCambiar={setTexto} placeholder="Buscar por código o nombre" className="mx-auto w-full max-w-xl" />

      {categorias.length > 1 && (
        <div role="group" aria-label="Categorías" className="flex flex-wrap justify-center gap-2">
          {[{ id: '', nombre: 'Todas' }, ...categorias].map((k) => (
            <button
              key={k.id || 'todas'}
              type="button"
              aria-pressed={categoriaId === k.id}
              onClick={() => setCategoriaId(k.id)}
              className={`min-h-11 rounded-pildora px-4 text-sm font-medium ${categoriaId === k.id ? 'bg-tinta text-sobre-tinta' : 'bg-superficie text-texto-suave hover:text-tinta'}`}
            >
              {k.nombre}
            </button>
          ))}
        </div>
      )}

      {c.desdeCache && (
        <p role="status" className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl bg-superficie px-4 py-3 text-sm text-texto-suave">
          <WifiOff size={16} aria-hidden /> Sin conexión: te mostramos la última lista guardada. Los precios pueden no estar al día.
        </p>
      )}

      {c.cargando && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => <li key={i}><Skeleton className="aspect-[3/4]" /></li>)}
        </ul>
      )}

      {!c.cargando && c.error && !c.items.length && (
        <EmptyState icono={WifiOff} titulo="No pudimos cargar el catálogo" texto="Revisá tu conexión e intentá de nuevo." />
      )}

      {!c.cargando && !c.error && c.items.length === 0 && (
        <EmptyState icono={SearchX} titulo={buscar ? `No encontramos “${buscar}”` : 'Todavía no hay modelos publicados'} texto={buscar ? 'Probá con otro código o con parte del nombre.' : 'Volvé pronto.'} />
      )}

      {c.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {c.items.map((p) => <Tarjeta key={p.id} producto={p} ajustes={ajustes} />)}
        </ul>
      )}

      {c.hayMas && (
        <button type="button" onClick={c.cargarMas} disabled={c.cargandoMas} className="mx-auto min-h-11 rounded-pildora bg-tinta px-6 text-sm font-medium text-sobre-tinta disabled:opacity-60">
          {c.cargandoMas ? 'Cargando…' : 'Ver más modelos'}
        </button>
      )}
    </div>
  )
}
