import { useEffect, useState } from 'react'
import { Archive, Database, FileSpreadsheet, History, Images, Info, PackageX, Trash2 } from 'lucide-react'
import { Button, Input, Sheet, useToast } from '../../components/ui/index.js'
import ConfirmarBorrado from '../../components/ConfirmarBorrado.jsx'
import { limpieza } from '../../data/limpieza.js'
import { ventas } from '../../data/repos/index.js'
import { formatoBytes, UMBRAL_AVISO, UMBRAL_URGENTE } from '../../lib/almacenamiento.js'
import { cn } from '../../lib/cn.js'
import { crearLibro, descargarArchivo, nombreArchivo } from '../../lib/excel.js'
import { desdeDeFecha, fechaDeInput } from '../../lib/periodos.js'
import { libroVentas } from '../ventas/exportarVentas.js'

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

// Cuánto se borraría (lo cuenta el servidor). null mientras se consulta o sin conexión.
function usePrevia(antesDe, version) {
  const clave = `${antesDe}|${version}`
  const [previa, setPrevia] = useState({ clave: null, datos: null })
  useEffect(() => {
    let vigente = true
    limpieza.previsualizar({ antesDe }).then((datos) => vigente && setPrevia({ clave, datos })).catch(() => {})
    return () => {
      vigente = false
    }
  }, [antesDe, clave])
  return previa.clave === clave ? previa.datos : null
}

// Una acción de limpieza: qué borra, cuántos registros y un botón que SIEMPRE pide confirmación.
function Accion({ icono: Icono, titulo, descripcion, cantidad, unidad, nota, bloqueo, tituloConfirmar, confirmar, onBorrar, children }) {
  const avisar = useToast()
  const [preguntando, setPreguntando] = useState(false)
  const vacio = !cantidad
  const borrar = async () => {
    const n = await onBorrar()
    avisar(`Listo: se borraron ${n} ${unidad}.`, 'exito')
  }
  return (
    <li className="flex flex-col gap-3 rounded-tarjeta border border-borde p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-superficie-2 text-texto-suave"><Icono size={18} strokeWidth={1.75} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{titulo}</p>
          <p className="text-sm text-texto-suave">{descripcion}</p>
        </div>
      </div>
      {children}
      {cantidad !== undefined && (
        <p className="text-sm tabular-nums">
          {cantidad === null ? <span className="text-texto-tenue">Contando…</span> : vacio ? <span className="text-texto-tenue">No hay nada para borrar.</span> : <><strong>{cantidad}</strong> {unidad} para borrar</>}
        </p>
      )}
      {nota && <p className="text-xs text-texto-suave">{nota}</p>}
      <Button variante="secundario" icono={Trash2} deshabilitado={vacio || !!bloqueo} onClick={() => setPreguntando(true)} className="self-start">
        Borrar…
      </Button>
      {bloqueo && !vacio && <p className="-mt-1 text-xs text-texto-suave">{bloqueo}</p>}
      <ConfirmarBorrado abierto={preguntando} onCerrar={() => setPreguntando(false)} titulo={tituloConfirmar} etiqueta="Sí, borrar" onConfirmar={borrar}>
        <p className="text-texto">{confirmar}</p>
        <p>Se van a borrar <strong>{cantidad}</strong> {unidad}.</p>
      </ConfirmarBorrado>
    </li>
  )
}

const hoy = () => new Date().toLocaleDateString('en-CA')
const CampoFecha = ({ valor, max, onChange }) => (
  <Input etiqueta="Borrar lo anterior a" type="date" value={valor} max={max} onChange={(e) => onChange(e.target.value)} className="sm:max-w-56" />
)

// Liberar espacio: solo aparece cuando el almacenamiento avisa (desde el 80 %). Cada acción con su fecha y su confirmación.
function Limpieza({ actualizar }) {
  const avisar = useToast()
  const [version, setVersion] = useState(0)
  const [maxFecha] = useState(hoy) // no se puede elegir una fecha futura (borraría todo)
  const [fechaVentas, setFechaVentas] = useState('')
  const [fechaMovs, setFechaMovs] = useState('')
  const [respaldoDe, setRespaldoDe] = useState(null)
  const [respaldando, setRespaldando] = useState(false)
  const antesVentas = desdeDeFecha(fechaVentas)
  const antesMovs = desdeDeFecha(fechaMovs)
  const pVentas = usePrevia(antesVentas, version)
  const pMovs = usePrevia(antesMovs, version)
  const contar = (p, clave, fecha) => (!fecha ? undefined : p ? p[clave] : null)

  const hecho = (fn) => async () => {
    const n = await fn()
    setVersion((v) => v + 1)
    actualizar?.()
    return n
  }

  const respaldar = async () => {
    setRespaldando(true)
    try {
      const lista = await ventas.listarConItems({ hasta: new Date(new Date(antesVentas).getTime() - 1).toISOString() })
      descargarArchivo(await crearLibro(libroVentas(lista, [['Notas anteriores al', fechaDeInput(fechaVentas)], ['Motivo', 'Respaldo antes de liberar espacio']])), nombreArchivo('respaldo-notas-de-venta'))
      setRespaldoDe(antesVentas)
      avisar('Respaldo descargado. Guardalo en un lugar seguro.', 'exito')
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setRespaldando(false)
    }
  }

  return (
    <section aria-labelledby="liberar" className="flex flex-col gap-4">
      <div>
        <h3 id="liberar" className="text-lg">Liberar espacio</h3>
        <p className="text-sm text-texto-suave">Elegí qué borrar y desde qué fecha hacia atrás. Nada se borra sin confirmar y el stock nunca cambia. Necesita conexión.</p>
      </div>
      <ul className="flex flex-col gap-3">
        <Accion
          icono={Archive}
          titulo="Notas de venta"
          descripcion="Notas de venta y su detalle (también las anuladas) anteriores a la fecha."
          cantidad={contar(pVentas, 'ventas', fechaVentas)}
          unidad="notas de venta"
          nota="Las comisiones y totales de ese período dejan de verse en la app: quedan en el respaldo."
          bloqueo={!fechaVentas ? 'Elegí la fecha.' : respaldoDe !== antesVentas ? 'Descargá primero el respaldo en Excel.' : null}
          tituloConfirmar="¿Borrar las notas de venta?"
          confirmar={`Se borrarán todas las notas de venta anteriores al ${fechaDeInput(fechaVentas)}.`}
          onBorrar={hecho(() => limpieza.borrarVentas({ antesDe: antesVentas }))}
        >
          <CampoFecha valor={fechaVentas} max={maxFecha} onChange={setFechaVentas} />
          {fechaVentas && pVentas?.ventas > 0 && (
            <Button variante={respaldoDe === antesVentas ? 'suave' : 'primario'} icono={FileSpreadsheet} cargando={respaldando} onClick={respaldar} className="self-start">
              {respaldoDe === antesVentas ? 'Respaldo descargado ✓ · descargar otra vez' : 'Descargar respaldo (Excel)'}
            </Button>
          )}
        </Accion>
        <Accion
          icono={History}
          titulo="Historial de stock"
          descripcion="Entradas, salidas, ajustes y ventas anteriores a la fecha se resumen en un saldo por producto. El stock actual queda igual."
          cantidad={contar(pMovs, 'movimientos', fechaMovs)}
          unidad="movimientos"
          bloqueo={!fechaMovs ? 'Elegí la fecha.' : null}
          tituloConfirmar="¿Borrar el historial de stock?"
          confirmar={`Se borrará todo el historial de stock anterior al ${fechaDeInput(fechaMovs)} y se reemplazará por un saldo por producto. El stock actual queda exactamente igual.`}
          onBorrar={hecho(() => limpieza.resumirMovimientos({ antesDe: antesMovs }))}
        >
          <CampoFecha valor={fechaMovs} max={maxFecha} onChange={setFechaMovs} />
        </Accion>
        <Accion
          icono={PackageX}
          titulo="Productos dados de baja"
          descripcion="Se eliminan del todo, con sus fotos, colores e historial de stock. Las notas de venta conservan su código y nombre."
          cantidad={pVentas ? pVentas.productos_baja : null}
          unidad="productos"
          tituloConfirmar="¿Eliminar los productos dados de baja?"
          confirmar="Se eliminarán todos los productos dados de baja, con sus fotos, colores e historial de stock."
          onBorrar={hecho(() => limpieza.eliminarProductosDeBaja())}
        />
      </ul>
      <p className="text-xs text-texto-suave">Las fotos liberan espacio enseguida. En los datos, lo borrado se reutiliza para lo nuevo: el porcentaje puede tardar en bajar.</p>
    </section>
  )
}

// Detalle del almacenamiento (solo superadmin): porcentaje de datos y de fotos, recomendación y, si avisa, cómo liberar espacio.
export default function AlmacenamientoModal({ abierto, onCerrar, uso, actualizar }) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Almacenamiento" className="sm:w-[min(94vw,44rem)]">
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

          {uso.nivel !== 'ok' && <Limpieza actualizar={actualizar} />}
        </div>
      )}
    </Sheet>
  )
}
