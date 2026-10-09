import { useRef, useState } from 'react'
import { Modal } from '../../components/ui/index.js'
import { cn } from '../../lib/cn.js'
import Foto from './Foto.jsx'

// Foto principal grande que se desliza con el dedo, miniaturas para saltar y zoom al tocar.
export default function Galeria({ fotos, nombre }) {
  const carril = useRef(null)
  const [actual, setActual] = useState(0)
  const [zoom, setZoom] = useState(false)

  const ir = (i) => {
    const el = carril.current
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActual(i)
  }
  const alDeslizar = () => {
    const el = carril.current
    if (el) setActual(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (fotos.length === 0) return <Foto foto={null} alt={nombre} className="aspect-[3/4] w-full rounded-tarjeta" />

  return (
    <div className="flex flex-col gap-2">
      <div ref={carril} onScroll={alDeslizar} className="flex snap-x snap-mandatory overflow-x-auto rounded-tarjeta bg-superficie-2 ring-1 ring-borde/70 [scrollbar-width:none]">
        {fotos.map((f, i) => (
          <button key={f.id ?? i} type="button" onClick={() => setZoom(true)} aria-label={`Ampliar foto ${i + 1} de ${fotos.length}`} className="w-full shrink-0 snap-center">
            <Foto foto={f} alt={`${nombre}, foto ${i + 1}`} prioridad={i === 0} className="aspect-[3/4] w-full object-contain" />
          </button>
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="flex flex-wrap gap-2.5 p-1">
          {fotos.map((f, i) => (
            <button
              key={f.id ?? i}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className={cn('size-16 shrink-0 overflow-hidden rounded-control ring-2 ring-offset-2 ring-offset-superficie transition-[box-shadow,opacity]', i === actual ? 'ring-tinta' : 'opacity-70 ring-transparent hover:opacity-100')}
            >
              <Foto foto={f} className="size-full" />
            </button>
          ))}
        </div>
      )}
      <Modal abierto={zoom} onCerrar={() => setZoom(false)} titulo={nombre} ancho="w-[min(96vw,48rem)]">
        <Foto foto={fotos[actual]} alt={nombre} className="max-h-[70dvh] w-full object-contain" />
      </Modal>
    </div>
  )
}
