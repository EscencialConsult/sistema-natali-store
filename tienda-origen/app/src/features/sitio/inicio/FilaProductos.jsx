import { Link } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../../components/ui/index.js'
import ProductoCard from '../../catalogo/ProductoCard.jsx'

// Fila de hasta 8 productos (nuevos ingresos, destacados). Si no hay datos, la sección no se muestra.
export default function FilaProductos({ titulo, productos, cargando, error, reintentar, verTodo }) {
  if (error) return <ErrorState mensaje="No pudimos cargar los modelos." onReintentar={reintentar} />
  if (cargando) {
    return (
      <section aria-label={titulo} role="status" className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
      </section>
    )
  }
  if (!productos?.length) return null
  const id = `fila-${titulo.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 id={id} className="text-2xl md:text-3xl">{titulo}</h2>
        {verTodo && <Link to={verTodo} className="min-h-11 inline-flex items-center text-sm font-medium underline underline-offset-4">Ver todo</Link>}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
        {productos.map((p) => (
          <li key={p.id}><ProductoCard producto={p} modo="tienda" /></li>
        ))}
      </ul>
    </section>
  )
}
