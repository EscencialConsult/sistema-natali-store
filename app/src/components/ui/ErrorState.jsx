import { TriangleAlert } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({ mensaje = 'Algo salió mal.', onReintentar }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-error-fondo text-error">
        <TriangleAlert size={26} strokeWidth={1.6} aria-hidden />
      </span>
      <p className="max-w-sm text-sm text-texto">{mensaje}</p>
      {onReintentar && <Button variante="secundario" onClick={onReintentar}>Reintentar</Button>}
    </div>
  )
}
