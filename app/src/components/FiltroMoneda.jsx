import { META_MONEDA, MONEDAS } from '../lib/moneda.js'
import { Chip } from './ui/index.js'

// Filtro por moneda para cualquier listado con dinero. valor '' = todas. Las monedas nunca se suman entre sí.
export default function FiltroMoneda({ valor, onChange, className }) {
  return (
    <div role="group" aria-label="Filtrar por moneda" className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Chip activo={valor === ''} onClick={() => onChange('')} className="min-h-9 px-3">Todas las monedas</Chip>
      {MONEDAS.map((m) => (
        <Chip key={m} activo={valor === m} onClick={() => onChange(m)} className="min-h-9 px-3">
          {META_MONEDA[m].simbolo} · {META_MONEDA[m].nombre}
        </Chip>
      ))}
    </div>
  )
}
