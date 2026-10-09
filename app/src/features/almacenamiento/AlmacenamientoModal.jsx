import { useState } from 'react'
import { Archive, Database, FileSpreadsheet, History, ImageOff, Images, Info, PackageX, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Sheet, useToast } from '../../components/ui/index.js'
import { useConsulta } from '../../data/hooks.js'
import { almacenamiento, ventas } from '../../data/repos/index.js'
import { hayBackend } from '../../data/supabase.js'
import { formatoBytes, UMBRAL_AVISO, UMBRAL_URGENTE } from '../../lib/almacenamiento.js'
import { cn } from '../../lib/cn.js'
import { crearLibro, descargarArchivo, nombreArchivo } from '../../lib/excel.js'
import { desdeDeFecha, fechaDeInput } from '../../lib/periodos.js'
import { useAuth } from '../auth/AuthContext.js'
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

// Una acción de limpieza: qué borra, cuánto libera y un botón que SIEMPRE pide confirmación.
function Accion({ icono: Icono, titulo, descripcion, cantidad, unidad, bytes, nota, bloqueo, confirmar, onBorrar, children }) {
  const avisar = useToast()
  const [preguntando, setPreguntando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const vacio = !cantidad
  const borrar = async () => {
    setBorrando(true)
    try {
      const n = await onBorrar()
      avisar(`Listo: se borraron ${n} ${unidad}.`, 'exito')
      setPreguntando(false)
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setBorrando(false)
    }
  }
  return (
    <li className="flex flex-col gap-3 rounded-tarjeta border border-borde p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-superficie-2 text-texto-suave"><Icono size={18} strokeWidth={1.75} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{titulo}</p>
          <p className="text-sm text-texto-suave">{descripcion}</p>
          {cantidad !== undefined && (
            <p className="mt-1 text-sm tabular-nums">
              {vacio ? <span className="text-texto-tenue">No hay nada para borrar.</span> : <><strong>{cantidad}</strong> {unidad} · libera ~{formatoBytes(bytes)}</>}
            </p>
          )}
          {nota && <p className="mt-1 text-xs text-texto-suave">{nota}</p>}
        </div>
      </div>
      {children}
      <Button variante="secundario" icono={Trash2} deshabilitado={vacio || !!bloqueo} onClick={() => setPreguntando(true)} className="self-start">
        Borrar…
      </Button>
      {bloqueo && !vacio && <p className="-mt-1 text-xs text-texto-suave">{bloqueo}</p>}
      <Modal abierto={preguntando} onCerrar={() => setPreguntando(false)} titulo={`¿Borrar ${titulo.toLowerCase()}?`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm">{confirmar}</p>
          <p className="rounded-control bg-error-fondo p-3 text-sm text-error"><strong>No se puede deshacer.</strong> Se van a borrar {cantidad} {unidad}.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variante="fantasma" onClick={() => setPreguntando(false)}>Cancelar</Button>
            <Button variante="peligro" icono={Trash2} cargando={borrando} onClick={borrar}>Sí, borrar</Button>
          </div>
        </div>
      </Modal>
    </li>
  )
}

export default function AlmacenamientoModal({ abierto, onCerrar, uso, actualizar }) {
  const { usuario } = useAuth()
  const avisar = useToast()
  const [fecha, setFecha] = useState('')
  const [respaldoDe, setRespaldoDe] = useState(null)
  const [respaldando, setRespaldando] = useState(false)
  const antesDe = desdeDeFecha(fecha) ?? undefined
  const prev = useConsulta(() => (abierto && !hayBackend ? almacenamiento.previsualizar({ antesDe }) : null), [abierto, antesDe])
  const p = prev.datos
  const por = { por: usuario.id }
  const hecho = (fn) => async () => {
    const n = await fn()
    actualizar()
    return n
  }

  const respaldar = async () => {
    setRespaldando(true)
    try {
      const lista = await ventas.listarConItems({ hasta: new Date(new Date(antesDe).getTime() - 1).toISOString() })
      descargarArchivo(await crearLibro(libroVentas(lista, [['Ventas anteriores al', fechaDeInput(fecha)], ['Motivo', 'Respaldo antes de liberar espacio']])), nombreArchivo('respaldo-ventas'))
      setRespaldoDe(antesDe)
      avisar('Respaldo descargado. Guardalo en un lugar seguro.', 'exito')
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setRespaldando(false)
    }
  }

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
              {uso.nivel === 'urgente' && <p><strong>Estás casi sin espacio.</strong> Cuando se llene, no se van a poder guardar ventas nuevas. Borrá datos antiguos cuanto antes.</p>}
              {uso.nivel === 'aviso' && <p><strong>Te estás acercando al límite.</strong> Te recomendamos borrar datos antiguos que ya no necesites (descargá un respaldo antes).</p>}
              {uso.nivel === 'ok' && <p><strong>Tenés espacio suficiente.</strong> Igual podés liberar espacio cuando quieras.</p>}
              <p>Si necesitás más espacio, contactá a tu proveedor para aumentar tu límite de almacenamiento.</p>
            </div>
          </div>

          <section aria-labelledby="liberar" className="flex flex-col gap-4">
            <div>
              <h3 id="liberar" className="text-lg">Liberar espacio</h3>
              <p className="text-sm text-texto-suave">Nada se borra solo. Cada acción pide confirmación y el stock nunca cambia.</p>
            </div>

            {hayBackend ? (
              <p className="rounded-control bg-info-fondo p-3 text-sm text-info">La limpieza se habilita cuando tu proveedor active esta función en el servidor.</p>
            ) : (
              <>
                <Input etiqueta="Fecha de corte (para ventas e historial)" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} ayuda="Se borra lo anterior a esta fecha. Elegí una fecha de la que ya no necesites el detalle." />
                <ul className="flex flex-col gap-3">
                  <Accion
                    icono={Archive}
                    titulo="Ventas antiguas"
                    descripcion="Notas de venta (y su detalle) anteriores a la fecha de corte, incluidas las anuladas."
                    cantidad={antesDe ? p?.ventas?.cantidad : undefined}
                    unidad="ventas"
                    bytes={p?.ventas?.bytes}
                    nota={!antesDe ? 'Elegí primero la fecha de corte.' : 'Las comisiones y totales de ese período dejan de verse en la app: quedan en el respaldo.'}
                    bloqueo={antesDe && respaldoDe !== antesDe ? 'Descargá primero el respaldo en Excel.' : !antesDe ? 'Elegí la fecha de corte.' : null}
                    confirmar={`Se borran todas las ventas anteriores al ${fechaDeInput(fecha)}. El stock queda igual.`}
                    onBorrar={hecho(() => almacenamiento.borrarVentas({ antesDe }, por))}
                  >
                    {antesDe && p?.ventas?.cantidad > 0 && (
                      <Button variante={respaldoDe === antesDe ? 'suave' : 'primario'} icono={FileSpreadsheet} cargando={respaldando} onClick={respaldar} className="self-start">
                        {respaldoDe === antesDe ? 'Respaldo descargado ✓ · descargar otra vez' : 'Descargar respaldo (Excel)'}
                      </Button>
                    )}
                  </Accion>
                  <Accion
                    icono={History}
                    titulo="Historial de stock antiguo"
                    descripcion="Entradas, salidas y ajustes anteriores a la fecha de corte se resumen en un saldo por color."
                    cantidad={antesDe ? p?.movimientos?.cantidad : undefined}
                    unidad="movimientos"
                    bytes={p?.movimientos?.bytes}
                    bloqueo={!antesDe ? 'Elegí la fecha de corte.' : null}
                    confirmar={`El historial anterior al ${fechaDeInput(fecha)} se reemplaza por un saldo por color. El stock actual queda exactamente igual.`}
                    onBorrar={hecho(() => almacenamiento.resumirMovimientos({ antesDe }, por))}
                  />
                  <Accion
                    icono={ImageOff}
                    titulo="Fotos de productos dados de baja"
                    descripcion="Las fotos son lo que más ocupa. Se borran solo las de productos que ya no están en el catálogo."
                    cantidad={p?.fotos?.cantidad}
                    unidad="fotos"
                    bytes={p?.fotos?.bytes}
                    confirmar="Se borran las fotos de los productos dados de baja. Si volvés a activar alguno, vas a tener que cargarle fotos de nuevo."
                    onBorrar={hecho(() => almacenamiento.borrarFotosDeBaja(por))}
                  />
                  <Accion
                    icono={PackageX}
                    titulo="Productos dados de baja"
                    descripcion="Se borran del todo los productos inactivos que nunca se vendieron."
                    cantidad={p?.productos?.cantidad}
                    unidad="productos"
                    bytes={p?.productos?.bytes}
                    nota={p?.productos?.conVentas ? `${p.productos.conVentas} productos dados de baja tienen ventas: no se borran para que las notas sigan completas.` : null}
                    confirmar="Se borran los productos dados de baja que nunca se vendieron, con sus colores, fotos y stock."
                    onBorrar={hecho(() => almacenamiento.borrarProductosDeBaja(por))}
                  />
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </Sheet>
  )
}
