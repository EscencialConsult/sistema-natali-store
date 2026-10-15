import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../../components/ui/index.js'
import { useCategorias } from '../../../data/hooks.js'
import { slugDe } from '../../../lib/slug.js'
import Foto from '../../catalogo/Foto.jsx'

// Una tarjeta por categoría con la foto del primer producto publicado de esa categoría.
export default function Categorias({ productos, cargando }) {
  const cats = useCategorias()
  const lista = useMemo(() => {
    if (!cats.datos) return []
    return cats.datos
      .map((c) => ({ ...c, foto: productos.find((p) => p.categoria_id === c.id)?.fotos[0] }))
      .filter((c) => c.foto)
  }, [cats.datos, productos])

  if (cargando || cats.cargando) {
    return (
      <section aria-label="Categorías" className="-mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0" role="status">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-36 shrink-0 md:w-auto md:flex-1" />)}
      </section>
    )
  }
  if (lista.length === 0) return null
  return (
    <section aria-labelledby="categorias-titulo" className="flex flex-col gap-4">
      <h2 id="categorias-titulo" className="text-2xl md:text-3xl">Categorías</h2>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0">
        {lista.map((c) => (
          <li key={c.id} className="w-[42%] shrink-0 snap-start sm:w-40 md:w-48">
            <Link to={`/catalogo/${slugDe(c.nombre)}`} className="group flex flex-col gap-2">
              <Foto foto={c.foto} alt="" className="aspect-[3/4] w-full rounded-tarjeta" />
              <span className="text-sm font-medium text-texto group-hover:underline">{c.nombre}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
