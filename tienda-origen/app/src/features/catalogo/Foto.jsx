import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { urlsFoto } from '../../lib/fotos.js'

// Foto del catálogo: acepta una ruta o un blob, ofrece la miniatura cuando existe y no se rompe si falta o falla.
// Fallas en dos pasos: si falla la miniatura se retira el srcSet (queda la original); si falla la original, "Sin foto".
// `sizes` describe el ancho en pantalla: por defecto, grilla de 2 columnas en celular y 4 en escritorio.
export default function Foto({ foto, alt = '', className, prioridad = false, sizes = '(min-width: 768px) 22vw, 48vw' }) {
  const { src, srcSet } = urlsFoto(foto)
  const [fallas, setFallas] = useState({ src: null, nivel: 0 })
  const nivel = fallas.src === src ? fallas.nivel : 0

  if (!src || nivel >= 2) {
    return (
      <div role="img" aria-label={alt || 'Sin foto'} className={cn('flex items-center justify-center bg-superficie-2 text-texto-tenue', className)}>
        <ImageOff size={28} strokeWidth={1.5} aria-hidden />
      </div>
    )
  }
  const conMini = srcSet && nivel === 0
  return (
    <img
      src={src}
      srcSet={conMini ? srcSet : undefined}
      sizes={conMini ? sizes : undefined}
      alt={alt}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : undefined}
      decoding="async"
      onError={() => setFallas({ src, nivel: conMini ? 1 : 2 })}
      className={cn('bg-superficie-2 object-cover', className)}
    />
  )
}
