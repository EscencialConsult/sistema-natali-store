import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '../../components/ui/index.js'
import { CLAVE_MINIMA, normalizarCi } from '../../lib/clave.js'

export function CampoClave({ etiqueta, valor, onCambiar, error, autoFocus }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <Input etiqueta={etiqueta} type={ver ? 'text' : 'password'} autoComplete="new-password" value={valor} onChange={(e) => onCambiar(e.target.value)} error={error} autoFocus={autoFocus} className="[&_input]:pr-12" />
      <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver} className="absolute right-1 top-[1.625rem] flex size-11 items-center justify-center rounded-control text-texto-suave hover:text-texto">
        {ver ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
      </button>
    </div>
  )
}

// CI de una persona = su contraseña. Si se pega con puntos o complemento, avisa con qué número se queda.
export function CampoCi({ valor, onCambiar, etiqueta = 'CI (será su contraseña)', ayuda = 'Solo números, sin puntos ni complemento.', autoFocus }) {
  const numero = normalizarCi(valor)
  const seRecorta = valor.trim() !== '' && numero !== valor.trim()
  return (
    <Input
      etiqueta={etiqueta}
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      autoFocus={autoFocus}
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      ayuda={seRecorta ? (numero ? `Se usa solo el número: ${numero}` : 'No hay ningún número en lo que escribiste.') : ayuda}
    />
  )
}

// Botón con aspecto de enlace para cambiar de modo sin ocupar un botón entero (44 px de alto para el dedo).
export function EnlaceAccion({ children, ...resto }) {
  return (
    <button type="button" {...resto} className="min-h-11 self-start rounded-control px-1 text-sm font-medium text-tinta underline underline-offset-4 hover:text-tinta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta">
      {children}
    </button>
  )
}

// Contraseña de una persona: su CI (lo habitual) u otra a elección (la dueña, o quien no use su CI). `f` y `set` son los del formulario.
export function ElegirClave({ modo, onModo, f, set, enfocar, etiquetaCi, ayudaCi }) {
  if (modo === 'ci') {
    return (
      <div className="flex flex-col gap-1">
        <CampoCi valor={f.ci} onCambiar={set('ci')} autoFocus={enfocar} etiqueta={etiquetaCi} ayuda={ayudaCi} />
        <EnlaceAccion onClick={() => onModo('otra')}>Usar otra contraseña</EnlaceAccion>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoClave etiqueta="Contraseña" valor={f.clave} onCambiar={set('clave')} autoFocus={enfocar} />
        <CampoClave etiqueta="Repetir contraseña" valor={f.repetir} onCambiar={set('repetir')} />
      </div>
      <p className="text-xs text-texto-suave">Mínimo {CLAVE_MINIMA} caracteres. Pasásela a la persona en privado.</p>
      <EnlaceAccion onClick={() => onModo('ci')}>Usar su CI como contraseña</EnlaceAccion>
    </div>
  )
}
