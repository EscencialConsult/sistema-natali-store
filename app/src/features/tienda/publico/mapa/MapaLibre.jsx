import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// El worker se empaqueta con la propia aplicación: no depende de un CDN externo ni de una política de contenido abierta.
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { enlaceComoLlegar } from '../../lib/configTienda.js'

// Mapa interactivo de un local (o varios), armado directo sobre maplibre-gl (la misma base que mapcn, sin sus dependencias de shadcn).
// Estilo: OpenFreeMap "liberty" (gratis, sin clave, datos de OpenStreetMap). Se carga perezosamente: ver MapaDeLocales.
maplibregl.setWorkerUrl(urlWorker)

export const ESTILO_MAPA = 'https://tiles.openfreemap.org/styles/liberty'
const ZOOM_LOCAL = 15
const ESPERA_MAXIMA_MS = 12000

const texto = (tag, clase, contenido) => {
  const el = document.createElement(tag)
  if (clase) el.className = clase
  el.textContent = contenido
  return el
}

// Todo lo que viene de la configuración entra como textContent, nunca como HTML.
function contenidoPopup(local) {
  const caja = document.createElement('div')
  caja.className = 't-popup'
  caja.append(texto('p', 't-popup-nombre', local.nombre))
  if (local.direccion) caja.append(texto('p', 't-popup-dato', local.direccion))
  if (local.horario) caja.append(texto('p', 't-popup-dato', local.horario))
  const llegar = enlaceComoLlegar(local)
  if (llegar) {
    const a = texto('a', 't-popup-enlace', 'Cómo llegar')
    a.href = llegar
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    caja.append(a)
  }
  return caja
}

function pin(local) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 't-pin'
  el.setAttribute('aria-label', `${local.nombre}: ver ubicación en el mapa`)
  const punto = texto('span', 't-pin-punto', '')
  punto.setAttribute('aria-hidden', 'true')
  el.append(punto, texto('span', 't-pin-etiqueta', local.nombre))
  return el
}

/**
 * @param {{ locales: Array<{id: string, nombre: string, direccion?: string, horario?: string, lat: number, lng: number}>,
 *   activo: { id: string, vez: number } | null, onActivo: (id: string) => void, onFalla: () => void }} props
 */
export default function MapaLibre({ locales, activo, onActivo, onFalla }) {
  const contenedor = useRef(null)
  const estado = useRef({ mapa: null, marcadores: new Map(), sinAnimacion: false })
  // Los manejadores cambian en cada render; el mapa se crea una sola vez y lee siempre los últimos.
  const manejadores = useRef({ onActivo, onFalla })
  manejadores.current = { onActivo, onFalla }

  useEffect(() => {
    const interno = estado.current
    const { marcadores } = interno
    let mapa
    try {
      estado.current.sinAnimacion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      mapa = new maplibregl.Map({
        container: contenedor.current,
        style: ESTILO_MAPA,
        center: [locales[0].lng, locales[0].lat],
        zoom: locales.length === 1 ? ZOOM_LOCAL + 1 : ZOOM_LOCAL,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usá Ctrl + scroll para acercar el mapa',
          'CooperativeGesturesHandler.MacHelpText': 'Usá ⌘ + scroll para acercar el mapa',
          'CooperativeGesturesHandler.MobileHelpText': 'Usá dos dedos para mover el mapa',
        },
      })
    } catch {
      // Sin WebGL (o bloqueado): la página sigue con las direcciones en texto.
      manejadores.current.onFalla?.()
      return undefined
    }
    estado.current.mapa = mapa
    mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    let cargado = false
    const limite = setTimeout(() => {
      if (!cargado) manejadores.current.onFalla?.()
    }, ESPERA_MAXIMA_MS)
    mapa.on('load', () => {
      cargado = true
      clearTimeout(limite)
    })
    mapa.on('error', (e) => {
      // Si no baja el estilo del mapa, queda inservible. Un tile, un símbolo o una fuente suelta que falla no lo es.
      if (!cargado && String(e.error?.url ?? '').startsWith(ESTILO_MAPA)) manejadores.current.onFalla?.()
    })

    for (const l of locales) {
      const popup = new maplibregl.Popup({ offset: 22, closeButton: true, maxWidth: '260px' }).setDOMContent(contenidoPopup(l))
      popup.on('open', () => manejadores.current.onActivo?.(l.id))
      const marcador = new maplibregl.Marker({ element: pin(l), anchor: 'center' }).setLngLat([l.lng, l.lat]).setPopup(popup).addTo(mapa)
      marcadores.set(l.id, marcador)
    }
    if (locales.length > 1) {
      const limites = new maplibregl.LngLatBounds()
      for (const l of locales) limites.extend([l.lng, l.lat])
      mapa.fitBounds(limites, { padding: 56, maxZoom: ZOOM_LOCAL, duration: 0 })
    }

    return () => {
      clearTimeout(limite)
      marcadores.clear()
      mapa.remove()
      interno.mapa = null
    }
    // El mapa se crea una vez por conjunto de locales (el padre usa `key`); el resto llega por refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tocar un local en la lista: el mapa vuela hasta su marcador y abre su popup.
  useEffect(() => {
    const { mapa, marcadores, sinAnimacion } = estado.current
    if (!activo || !mapa) return
    const marcador = marcadores.get(activo.id)
    if (!marcador) return
    for (const [id, m] of marcadores) if (id !== activo.id && m.getPopup()?.isOpen()) m.togglePopup()
    if (!marcador.getPopup()?.isOpen()) marcador.togglePopup()
    mapa.flyTo({ center: marcador.getLngLat(), zoom: Math.max(mapa.getZoom(), ZOOM_LOCAL), duration: sinAnimacion ? 0 : 900, essential: false })
  }, [activo])

  return <div ref={contenedor} className="size-full" role="region" aria-label="Mapa con la ubicación de los locales" />
}
