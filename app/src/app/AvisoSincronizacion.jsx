import { useEffect, useState } from 'react'
import { CloudAlert, Clock, RefreshCw } from 'lucide-react'
import { liberarEspera } from '../data/sync/cola.js'
import { useEstadoSync } from '../data/sync/estado.js'
import { relojDesfasado, textoDesfase, useDesfaseReloj } from '../lib/relojServidor.js'

const MIN = 60_000

function haceCuanto(iso, ahora) {
  if (!iso) return null
  const min = Math.max(0, Math.round((ahora - Date.parse(iso)) / MIN))
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`
}

function Franja({ icono: Icono, clase, children, accion }) {
  return (
    <div role="status" aria-live="polite" className={`toast ${clase}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start gap-x-2.5 gap-y-2 px-4 py-2 text-sm md:px-8">
        <Icono size={18} strokeWidth={2} aria-hidden className="mt-px shrink-0" />
        <p className="min-w-0 flex-1">{children}</p>
        {accion}
      </div>
    </div>
  )
}

// Franjas bajo la barra superior para lo que antes pasaba en silencio: la app no se está actualizando, o la hora de la PC está mal.
// `sinConexion` la pone Layout: sin internet ya hay una franja roja y esta sería ruido.
export default function AvisoSincronizacion({ sinConexion }) {
  const { ok_en, fallo } = useEstadoSync()
  const desfase = useDesfaseReloj()
  const [ahora, setAhora] = useState(() => Date.now())
  const [reintentando, setReintentando] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const reintentar = async () => {
    setReintentando(true)
    try {
      await liberarEspera()
      window.dispatchEvent(new Event('naty:cola'))
    } finally {
      setTimeout(() => setReintentando(false), 1_500)
    }
  }

  // Un corte corto de red es normal; si lo que falla es la sesión o los datos, se avisa enseguida.
  const minutosFallando = fallo ? (ahora - Date.parse(fallo.desde)) / MIN : 0
  const mostrarFallo = Boolean(fallo) && !sinConexion && (fallo.tipo !== 'red' || minutosFallando >= 2)
  const ultima = haceCuanto(ok_en, ahora)

  return (
    <>
      {mostrarFallo && (
        <Franja
          icono={CloudAlert}
          clase="bg-alerta-fondo text-alerta"
          accion={
            <button type="button" onClick={reintentar} disabled={reintentando} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-alerta/40 px-3 text-sm font-semibold hover:bg-alerta/10 disabled:opacity-60">
              <RefreshCw size={15} aria-hidden className={reintentando ? 'animate-spin' : ''} /> Reintentar ahora
            </button>
          }
        >
          <strong className="font-semibold">
            {fallo.tipo === 'sesion' ? 'La sesión de este equipo no se pudo renovar.' : fallo.tipo === 'red' ? 'No hay comunicación con el servidor.' : 'No se pudieron actualizar los datos.'}
          </strong>{' '}
          Tus ventas están guardadas en este equipo y se envían solas apenas se resuelva.{ultima ? ` Última actualización: ${ultima}.` : ''}
          <span className="block text-xs opacity-80">Si sigue así, avisá a la administración y mostrales esto: {fallo.texto}</span>
        </Franja>
      )}
      {relojDesfasado() && (
        <Franja icono={Clock} clase="bg-alerta-fondo text-alerta">
          <strong className="font-semibold">La hora de esta computadora está {textoDesfase(desfase)}.</strong> Las notas salen con la fecha equivocada y puede fallar el envío.
          Corregila en Windows: Configuración → Hora e idioma → «Establecer la hora automáticamente».
        </Franja>
      )}
    </>
  )
}
