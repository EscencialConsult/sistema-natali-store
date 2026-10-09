import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, CheckCircle2, MessageCircle, Plus, Printer } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, Input, Modal, Skeleton, useToast } from '../../components/ui/index.js'
import { useConfig, useConsulta, usePerfiles, useVenta } from '../../data/hooks.js'
import { ultimoError } from '../../data/sync/cola.js'
import { ventas } from '../../data/repos/index.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import { compartirPorWhatsApp } from './compartir.js'
import NotaVenta from './NotaVenta.jsx'

const MM_A_PX = 96 / 25.4
const ANCHO_NOTA_PX = 148 * MM_A_PX

const SYNC = {
  pending: ['alerta', 'Pendiente de enviar'],
  synced: ['exito', 'Sincronizada'],
  error: ['error', 'Con problema al enviar'],
}

// Muestra la nota reducida para que entre en pantalla; la impresión usa la copia a tamaño real.
function VistaPrevia({ children }) {
  const caja = useRef(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const el = caja.current
    const medir = () => setZoom(Math.min(1, el.clientWidth / ANCHO_NOTA_PX))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={caja} className="overflow-hidden rounded-tarjeta border border-borde bg-white">
      <div style={{ zoom }}>{children}</div>
    </div>
  )
}

export default function NotaPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { usuario } = useAuth()
  const avisar = useToast()
  const venta = useVenta(id)
  const cfg = useConfig()
  const equipo = usePerfiles()
  const errorEnvio = useConsulta(() => ultimoError(id), [id, venta.datos?.sync_status])
  const copia = useRef(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [errorAnular, setErrorAnular] = useState('')
  const [enCurso, setEnCurso] = useState(false)

  if (venta.cargando || cfg.cargando || equipo.cargando) return <Skeleton className="h-96" />
  if (venta.error || cfg.error || equipo.error) return <ErrorState mensaje="No pudimos cargar la nota." onReintentar={() => { venta.reintentar(); cfg.reintentar(); equipo.reintentar() }} />
  const v = venta.datos
  if (!v) return <EmptyState titulo="Esa nota no existe" accion={<Link to="/venta"><Button variante="secundario">Nueva venta</Button></Link>} />
  const esPropia = v.vendedor_id === usuario.id
  if (!esPropia && !puede(usuario.rol, 'ventas.ver_todas')) return <EmptyState titulo="No tenés acceso a esta nota" texto="Solo podés ver tus propias ventas." />

  const compartir = async () => {
    setCompartiendo(true)
    try {
      const r = await compartirPorWhatsApp({ nodo: copia.current.querySelector('.nota'), venta: v, negocio: cfg.datos.negocio?.nombre ?? 'Modas Naty' })
      if (r === 'descargada') avisar('Se descargó la imagen de la nota: adjuntala en el chat de WhatsApp.')
    } catch (e) {
      avisar(e.message, 'error')
    } finally {
      setCompartiendo(false)
    }
  }

  const anular = async (e) => {
    e.preventDefault()
    setErrorAnular('')
    setEnCurso(true)
    try {
      await ventas.anular(v.id, { motivo, usuario_id: usuario.id })
      setAnulando(false)
      setMotivo('')
      avisar('Venta anulada. El stock volvió al inventario.')
    } catch (err) {
      setErrorAnular(err.message)
    } finally {
      setEnCurso(false)
    }
  }

  const [tono, textoSync] = SYNC[v.sync_status] ?? SYNC.pending
  const faltaQr = !cfg.datos.url_catalogo
  const esAdmin = puede(usuario.rol, 'ajustes.editar')

  return (
    <div className="flex flex-col gap-5">
      {state?.nueva && (
        <div role="status" className="flex items-center gap-3 rounded-control bg-exito-fondo p-4 text-exito">
          <CheckCircle2 size={28} strokeWidth={1.75} aria-hidden className="pop" />
          <div>
            <p className="text-lg font-semibold">Venta guardada</p>
            <p className="text-sm">Quedó en este dispositivo y se envía sola cuando haya conexión.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl md:text-3xl">Nota {v.numero}</h1>
        <Badge tono={tono}>{textoSync}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button icono={Printer} onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
        <Button variante="whatsapp" icono={MessageCircle} cargando={compartiendo} onClick={compartir}>Compartir por WhatsApp</Button>
        <Link to="/venta"><Button variante="secundario" icono={Plus}>Nueva venta</Button></Link>
        {puede(usuario.rol, 'ventas.anular') && v.estado === 'activa' && <Button variante="peligro" icono={Ban} onClick={() => setAnulando(true)}>Anular venta</Button>}
      </div>

      {v.sync_status === 'error' && errorEnvio.datos && (
        <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">
          <strong>El servidor no aceptó esta nota.</strong> {errorEnvio.datos} Avisale a la administración: la nota sigue guardada en este dispositivo.
        </p>
      )}

      {v.estado === 'anulada' && (
        <p role="status" className="rounded-control bg-error-fondo p-3 text-sm text-error">
          <strong>Venta anulada.</strong> Motivo: {v.anulacion_motivo}
        </p>
      )}

      {faltaQr && (
        <p role="status" className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">
          Falta la dirección del catálogo: esta nota sale sin código QR. {esAdmin ? <Link to="/ajustes" className="underline">Cargarla en Ajustes</Link> : 'Pedile a la administración que la cargue en Ajustes.'}
        </p>
      )}

      <VistaPrevia>
        <NotaVenta venta={v} cfg={cfg.datos} equipo={equipo.datos} />
      </VistaPrevia>

      <Modal abierto={anulando} onCerrar={() => setAnulando(false)} titulo="¿Anular esta venta?">
        <form onSubmit={anular} noValidate className="flex flex-col gap-3">
          <p className="text-sm text-texto-suave">La nota queda marcada como anulada (no se borra) y las prendas vuelven al inventario. Esto no se puede deshacer.</p>
          <Input etiqueta="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} error={errorAnular} autoFocus />
          <div className="flex gap-2">
            <Button type="submit" variante="peligro" cargando={enCurso} deshabilitado={!motivo.trim()}>Sí, anular</Button>
            <Button variante="fantasma" onClick={() => setAnulando(false)}>Volver</Button>
          </div>
        </form>
      </Modal>

      {createPortal(
        <div className="print-root" ref={copia} aria-hidden>
          <NotaVenta venta={v} cfg={cfg.datos} equipo={equipo.datos} />
        </div>,
        document.body,
      )}
    </div>
  )
}
