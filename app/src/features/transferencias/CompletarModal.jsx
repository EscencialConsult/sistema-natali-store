import { useEffect, useRef, useState } from 'react'
import { CircleAlert, ExternalLink, FileText, Loader2, Paperclip, RotateCcw, UploadCloud } from 'lucide-react'
import { Button, Modal, useToast } from '../../components/ui/index.js'
import { urlComprobante } from '../../data/comprobantes.js'
import { ventas as repoVentas } from '../../data/repos/index.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear } from '../../lib/moneda.js'
import { esPdf, prepararComprobante, tieneComprobante, transferenciaPendiente } from '../../lib/transferencias.js'

// El archivo de un comprobante: foto en miniatura o, si es PDF, un enlace para abrirlo.
function Vista({ url, pdf, nombre }) {
  if (pdf) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-control border border-borde bg-superficie-2 px-4 text-sm font-medium hover:border-borde-fuerte">
        <FileText size={22} strokeWidth={1.75} aria-hidden className="shrink-0 text-tinta" />
        <span className="min-w-0 flex-1 truncate">{nombre ?? 'Comprobante (PDF)'}</span>
        <ExternalLink size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-texto-suave" />
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-control border border-borde bg-superficie-2">
      <img src={url} alt="Comprobante de la transferencia" className="mx-auto max-h-72 w-auto object-contain" />
    </a>
  )
}

// Comprobante que ya tiene la venta (en el servidor o esperando subirse desde este dispositivo).
function useComprobanteActual(venta) {
  const [estado, setEstado] = useState({ url: null, error: null, cargando: tieneComprobante(venta) })
  const clave = venta.comprobante_local_id ?? venta.comprobante_ruta
  useEffect(() => {
    if (!clave) return setEstado({ url: null, error: null, cargando: false })
    let vigente = true
    let creada = null
    setEstado({ url: null, error: null, cargando: true })
    urlComprobante(venta).then(
      (url) => {
        if (url?.startsWith('blob:')) creada = url
        if (vigente) setEstado({ url, error: null, cargando: false })
        else if (creada) URL.revokeObjectURL(creada)
      },
      (e) => vigente && setEstado({ url: null, error: e.message, cargando: false }),
    )
    return () => {
      vigente = false
      if (creada) URL.revokeObjectURL(creada)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
  return estado
}

// Completar una transferencia adjuntando el comprobante, o sin él (se lo mostraron en persona).
// Si ya está completada: ver el comprobante, cambiarlo, adjuntarlo después o volver la venta a pendientes.
export default function CompletarModal({ venta, onCerrar }) {
  const avisar = useToast()
  const input = useRef(null)
  const pendiente = transferenciaPendiente(venta)
  const actual = useComprobanteActual(venta)
  const [archivo, setArchivo] = useState(null) // { blob, url, nombre }
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [confirmarReabrir, setConfirmarReabrir] = useState(false)

  useEffect(() => () => archivo && URL.revokeObjectURL(archivo.url), [archivo])

  const elegir = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setError(null)
    setProcesando(true)
    try {
      const blob = await prepararComprobante(f)
      setArchivo({ blob, url: URL.createObjectURL(blob), nombre: f.name })
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  const guardar = async (accion, mensaje) => {
    setGuardando(true)
    setError(null)
    try {
      await accion()
      avisar(mensaje, 'exito')
      onCerrar()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }
  const completar = (conArchivo) =>
    guardar(
      () => repoVentas.completarTransferencia(venta.id, { comprobante: conArchivo ? archivo.blob : undefined }),
      !pendiente ? 'Comprobante guardado.' : conArchivo ? 'Transferencia completada con comprobante.' : 'Transferencia completada sin comprobante.',
    )
  const reabrir = () => guardar(() => repoVentas.reabrirTransferencia(venta.id), 'La venta volvió a pendientes.')

  const tiene = tieneComprobante(venta)
  const textoZona = archivo ? 'Elegir otro archivo' : pendiente || !tiene ? 'Adjuntar comprobante' : 'Cambiar comprobante'

  return (
    <Modal abierto abajo onCerrar={onCerrar} titulo={pendiente ? 'Completar transferencia' : 'Transferencia completada'}>
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col gap-1.5 rounded-control bg-superficie-2 p-3 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-texto-suave">Nota</dt><dd className="font-medium tabular-nums">{venta.numero}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-texto-suave">Cliente</dt><dd className="truncate">{venta.cliente_nombre || 'Sin nombre'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-texto-suave">Fecha</dt><dd className="tabular-nums">{fechaCorta(venta.creada_en)}</dd></div>
          <div className="flex justify-between gap-3 border-t border-borde pt-1.5 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatear(venta.total_cent, venta.moneda)}</dd></div>
        </dl>

        {!pendiente && !archivo && (
          tiene ? (
            actual.cargando ? (
              <p className="flex items-center gap-2 text-sm text-texto-suave"><Loader2 size={16} className="animate-spin" aria-hidden /> Cargando comprobante…</p>
            ) : actual.error ? (
              <p className="flex items-center gap-2 text-sm text-texto-suave"><CircleAlert size={16} strokeWidth={1.75} aria-hidden /> {actual.error}</p>
            ) : actual.url && <Vista url={actual.url} pdf={esPdf(venta)} />
          ) : (
            <p className="text-sm text-texto-suave">Se completó sin comprobante (se mostró en persona). Si te lo mandan, lo podés adjuntar ahora.</p>
          )
        )}

        <input ref={input} type="file" accept="image/*,application/pdf" hidden onChange={elegir} />
        {archivo && <Vista url={archivo.url} pdf={archivo.blob.type === 'application/pdf'} nombre={archivo.nombre} />}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={procesando || guardando}
          className="flex min-h-14 items-center justify-center gap-2 rounded-tarjeta border-2 border-dashed border-borde-fuerte bg-superficie-2/50 px-4 text-sm font-medium transition-colors hover:border-tinta/60 hover:bg-tinte/50 disabled:opacity-60"
        >
          {procesando ? <Loader2 size={18} className="animate-spin text-tinta" aria-hidden /> : <UploadCloud size={18} strokeWidth={1.75} aria-hidden className="text-tinta" />}
          {procesando ? 'Procesando…' : textoZona}
          {!procesando && !archivo && <span className="font-normal text-texto-suave">· foto o PDF</span>}
        </button>

        {error && <p role="alert" className="text-sm text-error">{error}</p>}

        {confirmarReabrir ? (
          <div className="flex flex-col gap-3 rounded-control bg-alerta-fondo p-3">
            <p className="text-sm text-alerta">La venta vuelve a pendientes{tiene ? ' y se quita el comprobante' : ''}.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variante="fantasma" onClick={() => setConfirmarReabrir(false)} deshabilitado={guardando}>Cancelar</Button>
              <Button variante="peligro" icono={RotateCcw} onClick={reabrir} cargando={guardando}>Volver a pendientes</Button>
            </div>
          </div>
        ) : pendiente ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variante="secundario" onClick={() => completar(false)} deshabilitado={guardando || procesando}>Completar sin comprobante</Button>
            <Button icono={Paperclip} onClick={() => completar(true)} deshabilitado={!archivo || procesando} cargando={guardando}>Completar con comprobante</Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variante="peligro_suave" icono={RotateCcw} className="mr-auto" onClick={() => setConfirmarReabrir(true)} deshabilitado={guardando}>Volver a pendientes</Button>
            {archivo ? (
              <Button icono={Paperclip} onClick={() => completar(true)} deshabilitado={procesando} cargando={guardando}>Guardar comprobante</Button>
            ) : (
              <Button variante="fantasma" onClick={onCerrar}>Cerrar</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
