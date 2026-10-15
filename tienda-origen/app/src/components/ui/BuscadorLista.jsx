import { useId, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* Lista larga con filtro. opciones: [{ valor, etiqueta, detalle? }] */
export default function BuscadorLista({ etiqueta, opciones, onElegir, placeholder = 'Buscar', maxResultados = 20, vacio = 'Sin resultados', className }) {
  const id = useId()
  const [texto, setTexto] = useState('')
  const filtradas = useMemo(() => {
    const q = norm(texto.trim())
    const lista = q ? opciones.filter((o) => norm(`${o.etiqueta} ${o.detalle ?? ''}`).includes(q)) : opciones
    return lista.slice(0, maxResultados)
  }, [texto, opciones, maxResultados])

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {etiqueta && <label htmlFor={id} className="text-sm font-medium">{etiqueta}</label>}
      <div className="relative">
        <Search size={18} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue" />
        <input
          id={id}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-h-11 w-full rounded-control border border-borde-fuerte bg-superficie pl-10 pr-3 text-base"
        />
      </div>
      <ul role="listbox" className="max-h-64 overflow-auto rounded-control border border-borde bg-superficie">
        {filtradas.length === 0 && <li className="px-3 py-3 text-sm text-texto-suave">{vacio}</li>}
        {filtradas.map((o) => (
          <li key={o.valor} role="option" aria-selected={false}>
            <button type="button" onClick={() => onElegir(o)} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-base hover:bg-superficie-2">
              <span>{o.etiqueta}</span>
              {o.detalle && <span className="text-sm text-texto-suave">{o.detalle}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
