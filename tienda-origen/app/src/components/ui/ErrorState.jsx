import { TriangleAlert } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({ mensaje = 'Algo salió mal.', onReintentar }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <TriangleAlert size={32} strokeWidth={1.5} aria-hidden className="text-error" />
      <p className="max-w-sm text-sm text-texto">{mensaje}</p>
      {onReintentar && <Button variante="secundario" onClick={onReintentar}>Reintentar</Button>}
    </div>
  )
}
