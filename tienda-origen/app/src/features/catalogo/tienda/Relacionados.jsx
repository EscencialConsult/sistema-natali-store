import { useMemo } from 'react'
import { useProductosTienda } from '../../../data/hooks.js'
import ProductoCard from '../ProductoCard.jsx'

// Hasta 4 modelos de la misma categoría (sin el actual).
export default function Relacionados({ producto }) {
  const prods = useProductosTienda({ categoria_id: producto.categoria_id })
  const lista = useMemo(() => (prods.datos ?? []).filter((p) => p.id !== producto.id).slice(0, 4), [prods.datos, producto.id])
  if (lista.length === 0) return null
  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-4">
      <h2 id="relacionados-titulo" className="text-2xl">También te puede gustar</h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
        {lista.map((p) => (
          <li key={p.id}><ProductoCard producto={p} modo="tienda" /></li>
        ))}
      </ul>
    </section>
  )
}
