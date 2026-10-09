import { useId } from 'react'
import { cn } from '../../lib/cn.js'
import { CAMPO } from './estilos.js'

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
        className={cn(CAMPO, error ? 'border-error focus:border-error focus:ring-error/12' : 'border-borde-campo')}
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
