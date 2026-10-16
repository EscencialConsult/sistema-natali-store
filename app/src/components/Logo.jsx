import { useEffect } from 'react'
import { useMarca } from './useMarca.js'
import { cn } from '../lib/cn.js'

// Sin logo propio cargado en Ajustes se muestra el logo de fábrica de Modas Naty (imagotipo e isotipo).

const TAMANO_PROPIO = { md: 'size-9 rounded-[0.7rem]', lg: 'size-20 rounded-[1.1rem]' }
const TAMANO_FABRICA = { md: 'h-9 w-auto', lg: 'h-28 w-auto' }

export function MarcaIcono({ className, tamano = 'md' }) {
  const { logo, imagotipo, isotipo } = useMarca()
  if (logo) {
    return (
      <span aria-hidden className={cn('flex shrink-0 items-center justify-center overflow-hidden bg-superficie p-0.5 ring-1 ring-borde', TAMANO_PROPIO[tamano], className)}>
        <img src={logo} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    )
  }
  return <img aria-hidden alt="" src={tamano === 'lg' ? imagotipo : isotipo} className={cn('shrink-0 object-contain', TAMANO_FABRICA[tamano], className)} />
}

export default function Logo({ className, conBajada = false, soloMarca = false }) {
  const { nombre } = useMarca()
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <MarcaIcono />
      {!soloMarca && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className="truncate font-titulo text-xl font-semibold tracking-tight">{nombre}</span>
          {conBajada && <span className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-texto-suave">Mayorista</span>}
        </span>
      )}
      {soloMarca && <span className="sr-only">{nombre}</span>}
    </span>
  )
}

// Usa el logo de Ajustes como ícono de la pestaña del navegador (vuelve al de fábrica si se quita).
export function FaviconDinamico() {
  const { logo } = useMarca()
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]')
    if (!link) return
    const original = link.dataset.original ?? link.getAttribute('href')
    link.dataset.original = original
    link.setAttribute('href', logo ?? original)
    // El logo se guarda comprimido (JPEG): sin "type" el navegador detecta el formato solo.
    if (logo) link.removeAttribute('type')
    else link.setAttribute('type', 'image/svg+xml')
  }, [logo])
  return null
}
