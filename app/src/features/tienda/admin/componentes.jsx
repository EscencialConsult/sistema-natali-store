// Piezas de interfaz compartidas por las secciones del Gestor web. Mismo aspecto que las tarjetas de Ajustes de Renzo.
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, useToast } from '../../../components/ui/index.js'

const NIVELES = {
  alta: 'bg-error-fondo text-error',
  media: 'bg-alerta-fondo text-alerta',
  info: 'bg-superficie-2 text-texto-suave',
}

export function Aviso({ nivel = 'info', children }) {
  return (
    <p role={nivel === 'alta' ? 'alert' : 'note'} className={`rounded-control p-3 text-sm ${NIVELES[nivel]}`}>
      {children}
    </p>
  )
}

// Tarjeta con su propio botón Guardar. onGuardar devuelve una lista de problemas ([] = guardado).
export function Tarjeta({ titulo, ayuda, onGuardar, soloLectura, children }) {
  const avisar = useToast()
  const [errores, setErrores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const guardar = async (e) => {
    e.preventDefault()
    setErrores([])
    setGuardando(true)
    try {
      const problemas = await onGuardar()
      if (problemas?.length) setErrores(problemas)
      else avisar('Cambios guardados', 'exito')
    } catch (err) {
      setErrores([err.message])
    } finally {
      setGuardando(false)
    }
  }
  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5">
      <div>
        <h3 className="text-lg">{titulo}</h3>
        {ayuda && <p className="text-sm text-texto-suave">{ayuda}</p>}
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">{children}</fieldset>
      {errores.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 rounded-control bg-error-fondo p-3 text-sm text-error">
          {errores.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {!soloLectura && <Button type="submit" cargando={guardando} className="self-start">Guardar</Button>}
    </form>
  )
}

// Lista editable de filas con agregar y quitar. `children(fila, cambiar)` dibuja los campos de una fila.
export function Filas({ filas, setFilas, nueva, max, etiquetaAgregar, children }) {
  return (
    <div className="flex flex-col gap-4">
      {filas.map((f, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-control border border-borde/70 p-3">
          {children(f, (campo, valor) => setFilas(filas.map((x, k) => (k === i ? { ...x, [campo]: valor } : x))))}
          <button type="button" onClick={() => setFilas(filas.filter((_, k) => k !== i))} className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-texto-suave hover:text-tinta">
            <Trash2 size={16} aria-hidden /> Quitar
          </button>
        </div>
      ))}
      {filas.length < max && (
        <Button type="button" variante="secundario" icono={Plus} onClick={() => setFilas([...filas, nueva()])} className="self-start">{etiquetaAgregar}</Button>
      )}
    </div>
  )
}

export function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="break-words font-medium">{children || <span className="font-normal text-texto-suave">—</span>}</dd>
    </div>
  )
}
