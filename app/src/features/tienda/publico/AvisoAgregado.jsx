import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useUltimoAgregado } from '../data/avisosCarrito.js'
import { textoCantidad } from '../../../lib/docenas.js'
import { RUTA_PEDIDO } from '../rutas.js'

const DURACION_MS = 3800
const VUELO_MS = 700
const sinMovimiento = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

const cantidadTexto = (c) => (c === 0.5 ? 'Media docena agregada' : c === 1 ? '1 docena agregada' : `${textoCantidad(c)} docenas agregadas`)

// La foto del modelo "vuela" desde el botón hasta el ícono del pedido (Web Animations). Sin foto, sin destino o con
// «reducir movimiento» activado, se salta el vuelo y se pasa directo al aviso.
function volar(evento, destino, alTerminar) {
  const { desde, foto } = evento
  if (!foto || !desde || !destino || sinMovimiento() || typeof HTMLElement.prototype.animate !== 'function') return alTerminar()
  const tamano = 56
  const img = document.createElement('img')
  img.src = foto
  img.alt = ''
  Object.assign(img.style, {
    position: 'fixed',
    left: `${desde.x + desde.w / 2 - tamano / 2}px`,
    top: `${desde.y + desde.h / 2 - tamano / 2}px`,
    width: `${tamano}px`,
    height: `${tamano}px`,
    objectFit: 'cover',
    borderRadius: '14px',
    zIndex: 60,
    pointerEvents: 'none',
    boxShadow: '0 8px 24px rgb(43 29 34 / 0.25)',
  })
  document.body.append(img)
  const dx = destino.x + destino.w / 2 - (desde.x + desde.w / 2)
  const dy = destino.y + destino.h / 2 - (desde.y + desde.h / 2)
  const anim = img.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(0.85)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.35 },
    ],
    { duration: VUELO_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  )
  const fin = () => {
    img.remove()
    alTerminar()
  }
  anim.onfinish = fin
  anim.oncancel = fin
}

/**
 * Aviso de "agregado al pedido": vuelo de la foto, saltito del ícono (onLlego) y tarjeta con «Ver pedido».
 * @param {{ idIcono?: string, onLlego?: () => void }} props
 */
export default function AvisoAgregado({ idIcono = 'icono-pedido', onLlego }) {
  const evento = useUltimoAgregado()
  const [visible, setVisible] = useState(null)
  const { pathname } = useLocation()
  const timer = useRef(null)
  // El callback del padre cambia por render; se guarda en una ref (fuera del render) para no reiniciar la animación.
  const llego = useRef(onLlego)
  useEffect(() => {
    llego.current = onLlego
  }, [onLlego])

  useEffect(() => {
    if (!evento) return undefined
    const destino = document.getElementById(idIcono)?.getBoundingClientRect()
    volar(evento, destino, () => {
      llego.current?.()
      setVisible(evento)
    })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible((v) => (v?.id === evento.id ? null : v)), DURACION_MS + VUELO_MS)
    return () => clearTimeout(timer.current)
  }, [evento, idIcono])

  if (!visible || pathname === RUTA_PEDIDO) return null
  return (
    <div className="fixed bottom-5 left-4 right-24 z-50 sm:left-1/2 sm:right-auto sm:w-[26rem] sm:-translate-x-1/2">
      <div role="status" aria-live="polite" className="t-entra flex items-center gap-3 rounded-2xl border border-(--t-beige) bg-white p-3 shadow-xl shadow-(--t-vino)/15">
        {visible.foto ? (
          <img src={visible.foto} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--t-rosa)"><Check size={20} className="text-(--t-vino)" aria-hidden /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{visible.nombre}</p>
          <p className="t-suave text-xs">{cantidadTexto(visible.cantidad)} a tu pedido</p>
        </div>
        <Link to={RUTA_PEDIDO} onClick={() => setVisible(null)} className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-(--t-vino) px-3 text-sm font-semibold text-white hover:bg-(--t-vino-oscuro)">
          Ver pedido
        </Link>
        <button type="button" onClick={() => setVisible(null)} aria-label="Cerrar aviso" className="t-suave inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-(--t-beige)/50">
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}
