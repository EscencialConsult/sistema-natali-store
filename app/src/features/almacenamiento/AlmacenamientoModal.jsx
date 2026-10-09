import { Database, Images, Info } from 'lucide-react'
import { Sheet } from '../../components/ui/index.js'
import { formatoBytes, UMBRAL_AVISO, UMBRAL_URGENTE } from '../../lib/almacenamiento.js'
import { cn } from '../../lib/cn.js'

const COLOR_NIVEL = { ok: 'bg-exito', aviso: 'bg-alerta', urgente: 'bg-error' }
const TEXTO_NIVEL = { ok: 'text-exito', aviso: 'text-alerta', urgente: 'text-error' }

function Barra({ icono: Icono, titulo, detalle, info }) {
  const nivel = info.pct >= UMBRAL_URGENTE ? 'urgente' : info.pct >= UMBRAL_AVISO ? 'aviso' : 'ok'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium"><Icono size={16} strokeWidth={1.75} aria-hidden /> {titulo}</p>
        <p className={cn('font-titulo text-xl font-semibold tabular-nums', TEXTO_NIVEL[nivel])}>{String(info.pct).replace('.', ',')} %</p>
      </div>
      <div role="progressbar" aria-label={titulo} aria-valuenow={info.pct} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-superficie-2 ring-1 ring-inset ring-borde">
        <div className={cn('h-full rounded-full transition-[width] duration-500', COLOR_NIVEL[nivel])} style={{ width: `${Math.max(info.pct, 1)}%` }} />
      </div>
      <p className="text-xs text-texto-suave tabular-nums">{formatoBytes(info.usados)} de {formatoBytes(info.limite)} · {detalle}</p>
    </div>
  )
}

// Una acción de limpieza: qué borra, cuánto libera y un botón que SIEMPRE pide confirmación.

// Detalle del almacenamiento (solo superadmin): porcentaje de datos y de fotos, recomendación y contacto con el proveedor.
export default function AlmacenamientoModal({ abierto, onCerrar, uso }) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Almacenamiento" className="sm:w-[min(94vw,40rem)]">
      {!uso ? (
        <p className="py-6 text-center text-sm text-texto-suave">No pudimos medir el espacio ahora. Probá de nuevo con conexión.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section aria-label="Espacio usado" className="flex flex-col gap-5 rounded-tarjeta bg-superficie-2/70 p-4">
            <Barra icono={Database} titulo="Datos" detalle="ventas, productos, stock y usuarios" info={uso.datos} />
            <Barra icono={Images} titulo="Fotos" detalle="fotos de los productos" info={uso.fotos} />
          </section>

          <div className={cn('flex gap-3 rounded-control p-3 text-sm', uso.nivel === 'urgente' ? 'bg-error-fondo text-error' : uso.nivel === 'aviso' ? 'bg-alerta-fondo text-alerta' : 'bg-exito-fondo text-exito')}>
            <Info size={18} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              {uso.nivel === 'urgente' && <p><strong>Estás casi sin espacio.</strong> Cuando se llene, no se van a poder guardar ventas nuevas. Conviene borrar datos antiguos cuanto antes.</p>}
              {uso.nivel === 'aviso' && <p><strong>Te estás acercando al límite.</strong> Te recomendamos borrar datos antiguos que ya no necesites (descargá un respaldo en Excel antes).</p>}
              {uso.nivel === 'ok' && <p><strong>Tenés espacio suficiente.</strong></p>}
              <p>Si necesitás más espacio, contactá a tu proveedor para aumentar tu límite de almacenamiento.</p>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  )
}
