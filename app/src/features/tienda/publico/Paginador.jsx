import { ChevronLeft, ChevronRight } from 'lucide-react'
import { paginasVisibles, textoRango } from '../lib/catalogo.js'

const base = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors'

// Paginador accesible: anterior, números con elipsis y siguiente. La página actual lleva aria-current="page".
export default function Paginador({ paginacion, onIr }) {
  const { pagina, totalPaginas } = paginacion
  const numeros = paginasVisibles(pagina, totalPaginas)
  return (
    <nav aria-label="Paginación del catálogo" className="flex flex-col items-center gap-4 border-t border-(--t-beige) pt-6">
      <p className="t-suave text-sm">{textoRango(paginacion)}</p>
      {totalPaginas > 1 && (
        <ul className="flex flex-wrap items-center justify-center gap-1.5">
          <li>
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => onIr(pagina - 1)}
              className={`${base} gap-1 pr-4 hover:bg-(--t-beige)/60 disabled:pointer-events-none disabled:opacity-40`}
            >
              <ChevronLeft size={16} aria-hidden /> Anterior
            </button>
          </li>
          {numeros.map((n, i) =>
            n === null ? (
              <li key={`hueco-${i}`} aria-hidden="true" className="t-suave inline-flex min-h-11 w-6 items-center justify-center text-sm">…</li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  aria-label={`Página ${n}`}
                  aria-current={n === pagina ? 'page' : undefined}
                  onClick={() => n !== pagina && onIr(n)}
                  className={`${base} tabular-nums ${n === pagina ? 'bg-(--t-vino) text-white' : 'hover:bg-(--t-beige)/60'}`}
                >
                  {n}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => onIr(pagina + 1)}
              className={`${base} gap-1 pl-4 hover:bg-(--t-beige)/60 disabled:pointer-events-none disabled:opacity-40`}
            >
              Siguiente <ChevronRight size={16} aria-hidden />
            </button>
          </li>
        </ul>
      )}
    </nav>
  )
}
