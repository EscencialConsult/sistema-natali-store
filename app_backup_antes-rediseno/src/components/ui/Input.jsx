import { useId } from 'react'
import { cn } from '../../lib/cn.js'

export default function Input({ etiqueta, error, ayuda, className, ref, ...resto }) {
  const id = useId()
  const descId = error || ayuda ? `${id}-desc` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-texto">
          {etiqueta}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={descId}
        className={cn(
          'min-h-11 w-full rounded-control border bg-superficie px-3 text-base text-texto placeholder:text-texto-tenue',
          error ? 'border-error' : 'border-borde-fuerte',
        )}
        {...resto}
      />
      {(error || ayuda) && (
        <p id={descId} className={cn('text-sm', error ? 'text-error' : 'text-texto-suave')}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}
