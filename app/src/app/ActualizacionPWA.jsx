import { useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button, useToast } from '../components/ui/index.js'
import { buscarActualizacion, guardarRegistro } from '../lib/actualizacion.js'

const REVISAR_CADA_MS = 10 * 60 * 1000
const REEVALUAR_CADA_MS = 15 * 1000
// Sin tocar nada por este tiempo, la versión nueva se instala aunque haya una venta a medias: el borrador se guarda en el equipo.
const INACTIVO_MS = 2 * 60 * 1000

const hayBorradorConProductos = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i)
      if (clave?.includes('.borrador.') && JSON.parse(localStorage.getItem(clave))?.lineas?.length) return true
    }
  } catch {
    /* sin almacenamiento: no hay borrador */
  }
  return false
}

// Registra el service worker. Busca versiones nuevas sola (al abrir, al volver a la ventana, al volver internet y cada 10 minutos)
// y las instala en un momento seguro: no en medio de una venta ni mientras alguien escribe… salvo que lleve 2 minutos sin tocar
// nada (una PC de mostrador que queda en Nueva venta todo el día nunca se actualizaba). Lo que está sin enviar vive en la base
// del dispositivo y el borrador de la venta en localStorage: recargar no pierde nada.
export default function ActualizacionPWA() {
  const avisar = useToast()
  const { pathname } = useLocation()
  const ultimaActividad = useRef(0)
  const {
    offlineReady: [listaSinConexion, setListaSinConexion],
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      guardarRegistro(registro)
      const revisar = () => buscarActualizacion()
      revisar()
      setInterval(revisar, REVISAR_CADA_MS)
      window.addEventListener('online', revisar)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && revisar())
    },
  })

  useEffect(() => {
    const marcar = () => {
      ultimaActividad.current = Date.now()
    }
    marcar()
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }))
    return () => eventos.forEach((e) => window.removeEventListener(e, marcar))
  }, [])

  useEffect(() => {
    if (listaSinConexion) {
      avisar('Lista para usar sin conexión', 'exito')
      setListaSinConexion(false)
    }
  }, [listaSinConexion, avisar, setListaSinConexion])

  // Versión nueva lista: se vuelve a evaluar cada 15 s (antes solo al cambiar de pantalla y quedaba esperando para siempre).
  useEffect(() => {
    if (!hayVersionNueva) return
    const evaluar = () => {
      const campo = document.activeElement
      // Escribiendo = hay un campo con el cursor Y con texto (el login tiene el cursor puesto pero vacío: ahí se puede recargar).
      const escribiendo = ['INPUT', 'TEXTAREA'].includes(campo?.tagName) && String(campo.value ?? '').length > 0
      const vendiendo = pathname === '/venta' && hayBorradorConProductos()
      const inactivo = Date.now() - ultimaActividad.current > INACTIVO_MS
      if (inactivo || (!escribiendo && !vendiendo)) updateServiceWorker(true)
    }
    evaluar()
    const t = setInterval(evaluar, REEVALUAR_CADA_MS)
    return () => clearInterval(t)
  }, [hayVersionNueva, pathname, updateServiceWorker])

  if (!hayVersionNueva) return null
  return (
    <div role="alert" className="fixed inset-x-3 bottom-20 z-50 flex items-center justify-between gap-3 rounded-tarjeta bg-pie p-3 pl-4 text-sobre-pie shadow-flotante md:inset-x-auto md:bottom-6 md:right-6 md:w-96">
      <p className="text-sm">Hay una versión nueva de la app. Se instala sola en cuanto termines lo que estás haciendo.</p>
      <Button variante="claro" icono={RefreshCw} className="shrink-0" onClick={() => updateServiceWorker(true)}>Actualizar</Button>
    </div>
  )
}
