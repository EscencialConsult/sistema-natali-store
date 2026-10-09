import { useState } from 'react'
import { Search, SearchX, Settings2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Chip, EmptyState, ErrorState, Sheet, Skeleton } from '../../components/ui/index.js'
import { useBusquedaCodigo } from '../../data/hooks.js'
import { puntajeCodigo } from '../../lib/codigo.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import FilaResultado from './FilaResultado.jsx'
import GrillaProductos from './GrillaProductos.jsx'
import ProductoFicha from './ProductoFicha.jsx'
import { useRecientes } from './useRecientes.js'

// Pantalla principal del vendedor: escribe un código y ve foto + colores al instante.
export default function BuscadorPage() {
  const { usuario } = useAuth()
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(null)
  const { recientes, agregar } = useRecientes()
  const q = texto.trim()
  const res = useBusquedaCodigo(q, 12)

  const abrir = (p) => {
    agregar(p.codigo)
    setAbierto(p)
  }

  const lista = res.datos ?? []
  const exacto = lista[0] && puntajeCodigo(q, lista[0].codigo) === 0 ? lista[0] : null
  const otros = exacto ? lista.slice(1) : lista

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl md:text-3xl">Buscar modelo</h1>
        {puede(usuario.rol, 'catalogo.editar') && (
          <Link to="/catalogo/admin">
            <Button variante="secundario" icono={Settings2}>Administrar</Button>
          </Link>
        )}
      </div>

      <form role="search" onSubmit={(e) => { e.preventDefault(); if (lista[0]) abrir(lista[0]) }} className="relative">
        <label htmlFor="codigo" className="sr-only">Código del modelo</label>
        <Search size={22} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-tenue" />
        <input
          id="codigo"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="characters"
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Código (ej. MN-005 o 5)"
          className="min-h-14 w-full rounded-control border border-borde-fuerte bg-superficie pl-12 pr-12 text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        {texto && (
          <button type="button" aria-label="Borrar búsqueda" onClick={() => setTexto('')} className="absolute right-1 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-texto-suave">
            <X size={20} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </form>

      {!q && recientes.length > 0 && (
        <section aria-label="Últimos modelos vistos" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-texto-suave">Últimos que viste</h2>
          <div className="flex flex-wrap gap-2">
            {recientes.map((c) => <Chip key={c} onClick={() => setTexto(c)}>{c}</Chip>)}
          </div>
        </section>
      )}

      {!q && <GrillaProductos onAbrir={abrir} />}

      {q && res.cargando && <Skeleton className="h-64" />}
      {q && res.error && <ErrorState mensaje="No pudimos buscar. Probá de nuevo." onReintentar={res.reintentar} />}
      {q && res.datos && lista.length === 0 && (
        <EmptyState
          icono={SearchX}
          titulo={`No hay ningún modelo “${q}”`}
          texto="Revisá el código o probá con una parte del nombre."
          accion={<Button variante="secundario" onClick={() => setTexto('')}>Ver todo el catálogo</Button>}
        />
      )}

      {exacto && (
        <section aria-label="Mejor coincidencia" className="rounded-tarjeta border border-borde bg-superficie p-4">
          <ProductoFicha productoId={exacto.id} compacta />
        </section>
      )}

      {otros.length > 0 && (
        <section aria-label="Resultados" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-texto-suave">{exacto ? 'Otros parecidos' : `${otros.length} resultados`}</h2>
          <ul className="flex flex-col gap-2">
            {otros.map((p) => <li key={p.id}><FilaResultado producto={p} onAbrir={abrir} /></li>)}
          </ul>
        </section>
      )}

      <Sheet abierto={!!abierto} onCerrar={() => setAbierto(null)} titulo={abierto?.codigo ?? ''} className="sm:w-[min(94vw,52rem)]">
        {abierto && <ProductoFicha productoId={abierto.id} />}
      </Sheet>
    </div>
  )
}
