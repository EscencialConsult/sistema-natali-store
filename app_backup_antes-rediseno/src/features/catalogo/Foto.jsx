import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { urlDeImagen } from '../../lib/blobUrl.js'
import { cn } from '../../lib/cn.js'

// Foto del catálogo: acepta una ruta o un blob, y no se rompe si falta o falla.
export default function Foto({ foto, alt = '', className, prioridad = false }) {
  const url = urlDeImagen(foto)
  const [rota, setRota] = useState(null)

  if (!url || rota === url) {
    return (
      <div role="img" aria-label={alt || 'Sin foto'} className={cn('flex items-center justify-center bg-superficie-2 text-texto-tenue', className)}>
        <ImageOff size={28} strokeWidth={1.5} aria-hidden />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setRota(url)}
      className={cn('bg-superficie-2 object-cover', className)}
    />
  )
}
