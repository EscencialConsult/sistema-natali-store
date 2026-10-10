import { useState } from 'react'
import { Pencil, Power, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, TARJETA, useToast } from '../../../components/ui/index.js'
import { productos } from '../../../data/repos/index.js'
import { cn } from '../../../lib/cn.js'
import { formatear } from '../../../lib/moneda.js'
import Foto from '../Foto.jsx'

const ACCION = 'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-1.5 text-[0.8125rem] font-medium transition-colors disabled:opacity-50 sm:flex-none sm:px-3 sm:text-sm'

// Tarjeta del listado de administración: foto + datos (abre la edición) y acciones rápidas sin abrir el formulario.
// onEliminar: solo si quien mira puede eliminar productos.
export default function TarjetaProductoAdmin({ producto: p, categoria, onEditar, onDarDeBaja, onEliminar }) {
  const avisar = useToast()
  const [ocupado, setOcupado] = useState(false)

  const correr = async (fn, aviso) => {
    setOcupado(true)
    try {
      await fn()
      avisar(aviso, 'exito')
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <article className={cn(TARJETA, 'flex h-full flex-col overflow-hidden transition-shadow hover:shadow-elevada', !p.activo && 'bg-superficie-2/60')}>
      <Link to={`/catalogo/admin/${p.id}`} onClick={onEditar} className="group flex min-w-0 flex-1 items-center gap-3 p-3">
        <Foto foto={p.fotos[0]} alt="" className={cn('size-20 shrink-0 rounded-control', !p.activo && 'opacity-50 grayscale')} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold tabular-nums text-tinta">{p.codigo}</span>
            {p.nuevo && <Badge tono="tinta">Nuevo</Badge>}
            {!p.activo && <Badge tono="neutro">De baja</Badge>}
          </span>
          <span className="truncate font-medium group-hover:text-tinta">{p.nombre}</span>
          <span className="truncate text-xs text-texto-suave">{categoria ?? 'Sin categoría'} · {p.colores[0]?.nombre ?? 'Sin color'} · {p.fotos.length} fotos</span>
          <span className="text-sm font-semibold tabular-nums">{formatear(p.precio_docena_usd_cent, 'usd')} <span className="font-normal text-texto-suave">/ docena</span></span>
        </span>
      </Link>

      <div className="flex items-center gap-1 border-t border-borde bg-superficie-2/50 p-1.5" role="group" aria-label={`Acciones rápidas de ${p.codigo}`}>
        <button
          type="button"
          aria-pressed={p.nuevo}
          disabled={ocupado || !p.activo}
          onClick={() => correr(() => productos.marcarNuevo(p.id, !p.nuevo), p.nuevo ? `${p.codigo}: se quitó “Nuevo”` : `${p.codigo} marcado como Nuevo`)}
          className={cn(ACCION, p.nuevo ? 'bg-tinte text-sobre-tinte hover:bg-tinte-2' : 'text-texto-suave hover:bg-superficie hover:text-texto')}
        >
          <Sparkles size={16} strokeWidth={1.9} aria-hidden /> Nuevo
        </button>
        {p.activo ? (
          <button type="button" disabled={ocupado} onClick={onDarDeBaja} className={cn(ACCION, 'text-texto-suave hover:bg-error-fondo hover:text-error')}>
            <Power size={16} strokeWidth={1.9} aria-hidden /> <span>Dar de baja</span>
          </button>
        ) : (
          <button type="button" disabled={ocupado} onClick={() => correr(() => productos.reactivar(p.id), `${p.codigo} reactivado`)} className={cn(ACCION, 'text-exito hover:bg-exito-fondo')}>
            <RotateCcw size={16} strokeWidth={1.9} aria-hidden /> Reactivar
          </button>
        )}
        {onEliminar && (
          <button type="button" disabled={ocupado} onClick={onEliminar} aria-label={`Eliminar ${p.codigo}`} title="Eliminar" className={cn(ACCION, 'flex-none px-2.5 text-texto-suave hover:bg-error-fondo hover:text-error sm:px-2.5')}>
            <Trash2 size={16} strokeWidth={1.9} aria-hidden />
          </button>
        )}
        <Link to={`/catalogo/admin/${p.id}`} onClick={onEditar} className={cn(ACCION, 'text-tinta hover:bg-tinte sm:ml-auto')}>
          <Pencil size={16} strokeWidth={1.9} aria-hidden /> Editar
        </Link>
      </div>
    </article>
  )
}
