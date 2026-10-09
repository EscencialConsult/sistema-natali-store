import { useState } from 'react'
import { History, SearchX, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, CampoBusqueda, Chip, Encabezado, EmptyState, ErrorState, Sheet, Skeleton, TARJETA } from '../../components/ui/index.js'
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
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Catálogo"
        descripcion="Escribí el código del modelo para ver fotos, colores y stock al instante."
        acciones={puede(usuario.rol, 'catalogo.editar') && (
          <Link to="/catalogo/admin">
            <Button variante="secundario" icono={Settings2}>Administrar</Button>
          </Link>
        )}
      />

      <form onSubmit={(e) => { e.preventDefault(); if (lista[0]) abrir(lista[0]) }} className="flex flex-col gap-3">
        <CampoBusqueda
          id="codigo"
          etiqueta="Código del modelo"
          grande
          enterKeyHint="search"
          autoCapitalize="characters"
          autoFocus
          valor={texto}
          onCambiar={setTexto}
          placeholder="Código (ej. MN-005 o 5)"
        />
        {!q && recientes.length > 0 && (
          <section aria-label="Últimos modelos vistos" className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-sm text-texto-suave"><History size={16} strokeWidth={1.75} aria-hidden /> Recientes:</h2>
            {recientes.map((c) => <Chip key={c} onClick={() => setTexto(c)} className="min-h-9 px-3 tabular-nums">{c}</Chip>)}
          </section>
        )}
      </form>

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
        <section aria-label="Mejor coincidencia" className={`${TARJETA} p-4 sm:p-6`}>
          <ProductoFicha productoId={exacto.id} compacta />
        </section>
      )}

      {otros.length > 0 && (
        <section aria-label="Resultados" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-texto-suave">{exacto ? 'Otros parecidos' : `${otros.length} resultados`}</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
