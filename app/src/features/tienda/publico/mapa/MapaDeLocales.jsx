import { Component, lazy, Suspense, useMemo, useState } from 'react'
import { Clock, MapPin, Navigation } from 'lucide-react'
import { enlaceComoLlegar } from '../../lib/configTienda.js'

// El mapa y maplibre-gl viven en su propio chunk: solo se bajan en las páginas que muestran locales.
const MapaLibre = lazy(() => import('./MapaLibre.jsx'))

// Si el chunk no baja (sin conexión) o el mapa se rompe, la lista de locales sigue funcionando.
class Contencion extends Component {
  state = { fallo: false }
  static getDerivedStateFromError() {
    return { fallo: true }
  }
  render() {
    return this.state.fallo ? this.props.alternativa : this.props.children
  }
}

const AvisoSinMapa = () => (
  <p role="status" className="t-suave rounded-2xl border border-(--t-beige) bg-white/60 p-4 text-sm">
    No pudimos cargar el mapa. Podés llegar igual con las direcciones y el botón “Cómo llegar”.
  </p>
)

/**
 * Locales en lista (con dirección, horario y "Cómo llegar") y, si alguno tiene coordenadas, el mapa al lado.
 * Un local sin lat/lng aparece en la lista pero no en el mapa. Sin ninguna coordenada, no hay mapa.
 * @param {{ locales: Array<any>, conIndicaciones?: boolean }} props
 */
export default function MapaDeLocales({ locales, conIndicaciones = false }) {
  const [activo, setActivo] = useState(null)
  const [fallo, setFallo] = useState(false)

  // La configuración se valida en cada render y devuelve listas nuevas: se compara por contenido para no recrear el mapa.
  const firma = JSON.stringify(locales)
  const conId = useMemo(() => JSON.parse(firma).map((l, i) => ({ ...l, id: `local-${i}` })), [firma])
  const ubicables = useMemo(() => conId.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)), [conId])
  const hayMapa = ubicables.length > 0

  const elegir = (id) => setActivo((previo) => ({ id, vez: (previo?.vez ?? 0) + 1 }))
  const desdeMapa = (id) => setActivo((previo) => (previo?.id === id ? previo : { id, vez: (previo?.vez ?? 0) + 1 }))

  return (
    <div className={`grid items-start gap-6 ${hayMapa ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-10' : ''}`}>
      <ul className="flex flex-col gap-4">
        {conId.map((l) => {
          const llegar = enlaceComoLlegar(l)
          const enMapa = Number.isFinite(l.lat) && Number.isFinite(l.lng)
          const seleccionado = enMapa && !fallo && activo?.id === l.id
          return (
            <li key={l.id} className={`flex flex-col gap-3 rounded-2xl border bg-white/60 p-5 ${seleccionado ? 'border-(--t-vino)' : 'border-(--t-beige)'}`}>
              <h3 className="font-titulo text-xl font-semibold tracking-tight">{l.nombre}</h3>
              <div className="flex flex-col gap-1.5 text-[0.9375rem]">
                {l.direccion && <p className="flex items-start gap-2"><MapPin size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{l.direccion}</p>}
                {l.horario && <p className="flex items-start gap-2"><Clock size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{l.horario}</p>}
                {conIndicaciones && l.indicaciones && <p className="t-suave pl-6 text-sm">{l.indicaciones}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {llegar && (
                  <a href={llegar} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-(--t-vino) px-4 text-sm font-medium text-white hover:bg-(--t-vino-oscuro)">
                    <Navigation size={15} aria-hidden /> Cómo llegar
                  </a>
                )}
                {enMapa && !fallo && (
                  <button
                    type="button"
                    onClick={() => elegir(l.id)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-(--t-beige) px-4 text-sm font-medium hover:bg-(--t-beige)/50"
                  >
                    Ver en el mapa
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hayMapa && (
        <div className="flex flex-col gap-2 lg:sticky lg:top-6">
          {fallo ? (
            <AvisoSinMapa />
          ) : (
            <>
              <div className="h-80 overflow-hidden rounded-2xl border border-(--t-beige) bg-(--t-beige)/40 lg:h-[26rem]">
                <Contencion alternativa={<AvisoSinMapa />}>
                  <Suspense fallback={<div className="t-suave flex size-full items-center justify-center text-sm">Cargando mapa…</div>}>
                    <MapaLibre key={firma} locales={ubicables} activo={activo} onActivo={desdeMapa} onFalla={() => setFallo(true)} />
                  </Suspense>
                </Contencion>
              </div>
              <p className="t-suave text-xs">
                Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">OpenStreetMap contributors</a>
                {' '}· <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">OpenFreeMap</a>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
