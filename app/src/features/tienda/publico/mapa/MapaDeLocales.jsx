import { Component, lazy, Suspense, useMemo, useState } from 'react'
import { Clock, MapPin, Navigation } from 'lucide-react'
import { enlaceComoLlegar } from '../../lib/configTienda.js'

// El mapa y maplibre-gl viven en su propio chunk: solo se bajan en las páginas que muestran locales.
const MapaLibre = lazy(() => import('./MapaLibre.jsx'))

// Si el chunk no baja (sin conexión) o el mapa se rompe, la tarjeta del local sigue mostrando dirección y "Cómo llegar".
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
  <p role="status" className="t-suave flex size-full items-center justify-center p-4 text-center text-sm">
    No pudimos cargar el mapa. Podés llegar igual con la dirección y el botón “Cómo llegar”.
  </p>
)

const Atribucion = () => (
  <p className="t-suave text-xs">
    Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">OpenStreetMap contributors</a>
    {' '}· <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">OpenFreeMap</a>
  </p>
)

// Una tarjeta por local, cada una con su propio mapa centrado en su esquina. Sin coordenadas, la tarjeta va sin mapa.
function TarjetaLocal({ local, conIndicaciones }) {
  const [fallo, setFallo] = useState(false)
  const enMapa = Number.isFinite(local.lat) && Number.isFinite(local.lng)
  const llegar = enlaceComoLlegar(local)
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-(--t-beige) bg-white/60">
      {enMapa && (
        <div className="h-56 border-b border-(--t-beige) bg-(--t-beige)/40 md:h-64">
          {fallo ? (
            <AvisoSinMapa />
          ) : (
            <Contencion alternativa={<AvisoSinMapa />}>
              <Suspense fallback={<div className="t-suave flex size-full items-center justify-center text-sm">Cargando mapa…</div>}>
                <MapaLibre key={`${local.lat},${local.lng}`} locales={[local]} onFalla={() => setFallo(true)} />
              </Suspense>
            </Contencion>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 p-5">
        <h3 className="font-titulo text-xl font-semibold tracking-tight">{local.nombre}</h3>
        <div className="flex flex-col gap-1.5 text-[0.9375rem]">
          {local.direccion && <p className="flex items-start gap-2"><MapPin size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{local.direccion}</p>}
          {local.horario && <p className="flex items-start gap-2"><Clock size={16} aria-hidden className="mt-1 shrink-0 text-(--t-vino)" />{local.horario}</p>}
          {conIndicaciones && local.indicaciones && <p className="t-suave pl-6 text-sm">{local.indicaciones}</p>}
        </div>
        {llegar && (
          <a href={llegar} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg bg-(--t-vino) px-4 text-sm font-medium text-white hover:bg-(--t-vino-oscuro)">
            <Navigation size={15} aria-hidden /> Cómo llegar
          </a>
        )}
        {enMapa && !fallo && <Atribucion />}
      </div>
    </li>
  )
}

/**
 * Locales en tarjetas, una por local, cada una con su mapa (si tiene coordenadas), dirección, horario y "Cómo llegar".
 * @param {{ locales: Array<any>, conIndicaciones?: boolean }} props
 */
export default function MapaDeLocales({ locales, conIndicaciones = false }) {
  // La configuración se valida en cada render y devuelve listas nuevas: se compara por contenido para no recrear los mapas.
  const firma = JSON.stringify(locales)
  const conId = useMemo(() => JSON.parse(firma).map((l, i) => ({ ...l, id: `local-${i}` })), [firma])
  return (
    <ul className={`grid gap-6 ${conId.length > 1 ? 'md:grid-cols-2' : ''}`}>
      {conId.map((l) => <TarjetaLocal key={l.id} local={l} conIndicaciones={conIndicaciones} />)}
    </ul>
  )
}
