import { Plus, Trash2 } from 'lucide-react'
import { Button, Chip } from '../../../components/ui/index.js'
import { COLORES_CONOCIDOS, hexDeNombre } from '../../../lib/colores.js'
import { nuevoId } from '../../../lib/id.js'

// colores: [{ id, nombre, hex, existente, stock_inicial }]. El stock inicial solo se pide para colores nuevos;
// después el stock se mueve desde Inventario (queda el historial).
export default function ColoresEditor({ colores, onChange, error }) {
  const cambiar = (i, parcial) => onChange(colores.map((c, k) => (k === i ? { ...c, ...parcial } : c)))
  const quitar = (i) => onChange(colores.filter((_, k) => k !== i))
  const agregar = (nombre = '') => onChange([...colores, { id: nuevoId(), nombre, hex: nombre ? hexDeNombre(nombre) : '#cccccc', existente: false, stock_inicial: '' }])
  const usados = new Set(colores.map((c) => c.nombre.toLowerCase()))

  return (
    <section aria-labelledby="colores-t" className="flex flex-col gap-3">
      <h2 id="colores-t" className="text-lg">Colores disponibles</h2>
      {colores.length === 0 && <p className="text-sm text-texto-suave">Todavía no hay colores.</p>}
      <ul className="flex flex-col gap-2">
        {colores.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-tarjeta border border-borde/70 bg-superficie p-2 shadow-tarjeta">
            <input type="color" aria-label={`Muestra de ${c.nombre || 'color'}`} value={c.hex} onChange={(e) => cambiar(i, { hex: e.target.value })} className="size-11 shrink-0 cursor-pointer rounded-control border border-borde-fuerte bg-transparent p-1" />
            <input
              aria-label="Nombre del color"
              value={c.nombre}
              onChange={(e) => cambiar(i, { nombre: e.target.value })}
              placeholder="Nombre (ej. Rojo)"
              className="min-h-11 min-w-0 flex-1 basis-32 rounded-control border border-borde-fuerte bg-superficie px-3 text-base"
            />
            {!c.existente && (
              <input
                aria-label="Stock inicial en unidades"
                inputMode="numeric"
                value={c.stock_inicial}
                onChange={(e) => cambiar(i, { stock_inicial: e.target.value.replace(/\D/g, '') })}
                placeholder="Stock (u.)"
                className="min-h-11 w-24 rounded-control border border-borde-fuerte bg-superficie px-3 text-base"
              />
            )}
            <button type="button" aria-label={`Quitar ${c.nombre || 'color'}`} onClick={() => quitar(i)} className="flex size-11 items-center justify-center rounded-control text-error hover:bg-error-fondo">
              <Trash2 size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex flex-col gap-2">
        <Button variante="secundario" icono={Plus} onClick={() => agregar()} className="self-start">Agregar color</Button>
        <p className="text-sm text-texto-suave">O tocá uno de uso común:</p>
        <div className="flex flex-wrap gap-2">
          {COLORES_CONOCIDOS.filter(([n]) => !usados.has(n.toLowerCase())).map(([n, hex]) => (
            <Chip key={n} muestra={hex} onClick={() => agregar(n)}>{n}</Chip>
          ))}
        </div>
      </div>
    </section>
  )
}
