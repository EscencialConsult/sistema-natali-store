import { useEffect, useState } from 'react'
import { Input, useToast } from '../../../../components/ui/index.js'
import { leerModelos, marcarOculto } from '../api.js'

// Qué modelos se ven en la tienda. Ocultar es editorial: saca el modelo de la tienda, no del catálogo interno ni de las notas.
// No borra nada: «mostrar de nuevo» es poner oculto = false en `tienda_oculto`.
export default function Modelos({ soloLectura }) {
  const avisar = useToast()
  const [estado, setEstado] = useState({ cargando: true, productos: [], ocultos: new Set(), error: '' })
  const [q, setQ] = useState('')

  useEffect(() => {
    let vigente = true
    leerModelos()
      .then((r) => vigente && setEstado({ cargando: false, error: '', ...r }))
      .catch(() => vigente && setEstado({ cargando: false, productos: [], ocultos: new Set(), error: 'No pudimos cargar los modelos.' }))
    return () => {
      vigente = false
    }
  }, [])

  const poner = (id, oculto) =>
    setEstado((e) => {
      const ocultos = new Set(e.ocultos)
      if (oculto) ocultos.add(id)
      else ocultos.delete(id)
      return { ...e, ocultos }
    })

  // El cambio se ve al instante; si el servidor no lo acepta, la casilla vuelve a como estaba.
  const cambiar = async (p, mostrar) => {
    poner(p.id, !mostrar)
    try {
      await marcarOculto(p.id, !mostrar)
    } catch {
      poner(p.id, mostrar)
      avisar('No se pudo guardar. Revisá tu conexión.', 'error')
    }
  }

  const texto = q.trim().toLowerCase()
  const visibles = estado.productos.filter((p) => !texto || p.codigo.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto)).slice(0, 60)

  return (
    <section className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5" aria-labelledby="modelos-tienda">
      <div>
        <h3 id="modelos-tienda" className="text-lg">Modelos visibles</h3>
        <p className="text-sm text-texto-suave">
          Se muestran los modelos activos que tienen foto. Destildá uno para sacarlo de la tienda; sigue en el catálogo y en las notas.
          {estado.ocultos.size > 0 && ` Ocultos ahora: ${estado.ocultos.size}.`}
        </p>
      </div>
      <Input etiqueta="Buscar modelo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre" />
      {estado.cargando && <p className="text-sm text-texto-suave">Cargando…</p>}
      {estado.error && <p role="alert" className="text-sm text-error">{estado.error}</p>}
      <ul className="flex max-h-96 flex-col overflow-y-auto">
        {visibles.map((p) => (
          <li key={p.id}>
            <label className="flex min-h-11 items-center gap-3 border-t border-borde/50 text-base">
              <input type="checkbox" disabled={soloLectura} checked={!estado.ocultos.has(p.id)} onChange={(e) => cambiar(p, e.target.checked)} className="size-5 accent-tinta" />
              <span className="text-sm text-texto-suave">{p.codigo}</span>
              <span className="min-w-0 truncate">{p.nombre}</span>
            </label>
          </li>
        ))}
      </ul>
      {!estado.cargando && estado.productos.length > visibles.length && !texto && (
        <p className="text-sm text-texto-suave">Mostrando los primeros {visibles.length}. Buscá por código o nombre para encontrar otros.</p>
      )}
    </section>
  )
}
