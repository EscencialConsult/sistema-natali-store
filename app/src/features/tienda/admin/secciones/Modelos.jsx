import { useEffect, useRef, useState } from 'react'
import { Input, useToast } from '../../../../components/ui/index.js'
import { leerModelos, marcarOculto } from '../api.js'

// Qué modelos se ven en la tienda. Ocultar es editorial: saca el modelo de la tienda, no del catálogo interno ni de las notas.
// No borra nada: «mostrar de nuevo» es poner oculto = false en `tienda_oculto`.
export default function Modelos({ soloLectura }) {
  const avisar = useToast()
  const [estado, setEstado] = useState({ cargando: true, productos: [], ocultos: new Set(), error: '' })
  const [q, setQ] = useState('')
  const [guardando, setGuardando] = useState(() => new Set())
  const enCurso = useRef(new Set())
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    leerModelos()
      .then((r) => vigente && setEstado({ cargando: false, error: '', ...r }))
      .catch(() => vigente && setEstado({ cargando: false, productos: [], ocultos: new Set(), error: 'No pudimos cargar los modelos.' }))
    return () => {
      vigente = false
    }
  }, [intento])

  const poner = (id, oculto) =>
    setEstado((e) => {
      const ocultos = new Set(e.ocultos)
      if (oculto) ocultos.add(id)
      else ocultos.delete(id)
      return { ...e, ocultos }
    })

  // El cambio se ve al instante; si el servidor no lo acepta, la casilla vuelve a como estaba.
  // Un modelo no admite dos escrituras a la vez: la casilla queda inactiva hasta que el servidor responde.
  const cambiar = async (p, mostrar) => {
    if (enCurso.current.has(p.id)) return
    enCurso.current.add(p.id)
    setGuardando(new Set(enCurso.current))
    poner(p.id, !mostrar)
    try {
      await marcarOculto(p.id, !mostrar)
    } catch {
      poner(p.id, mostrar)
      avisar('No se pudo guardar. Revisá tu conexión.', 'error')
    } finally {
      enCurso.current.delete(p.id)
      setGuardando(new Set(enCurso.current))
    }
  }

  const texto = q.trim().toLowerCase()
  const coinciden = estado.productos.filter((p) => !texto || p.codigo.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto))
  const visibles = coinciden.slice(0, 60)

  return (
    <section className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5" aria-labelledby="modelos-tienda">
      <div>
        <h3 id="modelos-tienda" className="text-lg">Modelos visibles</h3>
        <p className="text-sm text-texto-suave">
          Esta lista trae todos los modelos activos; la tienda muestra los que además tienen foto. Destildá uno para sacarlo de la tienda: sigue en el catálogo y en las notas.
          {estado.ocultos.size > 0 && ` Ocultos ahora: ${estado.ocultos.size}.`}
        </p>
      </div>
      <Input etiqueta="Buscar modelo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre" />
      {estado.cargando && <p className="text-sm text-texto-suave">Cargando…</p>}
      {estado.error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
          <span>{estado.error}</span>
          <button
            type="button"
            onClick={() => {
              setEstado({ cargando: true, productos: [], ocultos: new Set(), error: '' })
              setIntento((n) => n + 1)
            }}
            className="min-h-11 rounded-control border border-error px-4 font-medium"
          >
            Reintentar
          </button>
        </div>
      )}
      <ul className="flex max-h-96 flex-col overflow-y-auto">
        {visibles.map((p) => (
          <li key={p.id}>
            <label className="flex min-h-11 items-center gap-3 border-t border-borde/50 text-base">
              <input type="checkbox" disabled={soloLectura || guardando.has(p.id)} checked={!estado.ocultos.has(p.id)} onChange={(e) => cambiar(p, e.target.checked)} className="size-5 accent-tinta" />
              <span className="text-sm text-texto-suave">{p.codigo}</span>
              <span className="min-w-0 truncate">{p.nombre}</span>
            </label>
          </li>
        ))}
      </ul>
      {!estado.cargando && !estado.error && estado.productos.length === 0 && <p className="text-sm text-texto-suave">No hay modelos activos todavía.</p>}
      {!estado.cargando && estado.productos.length > 0 && coinciden.length === 0 && <p className="text-sm text-texto-suave">Ningún modelo coincide con «{q.trim()}».</p>}
      {!estado.cargando && coinciden.length > visibles.length && (
        <p className="text-sm text-texto-suave">Mostrando {visibles.length} de {coinciden.length}. Afiná la búsqueda por código o nombre para encontrar otros.</p>
      )}
    </section>
  )
}
