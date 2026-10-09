import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button, useToast } from '../components/ui/index.js'

// Registra el service worker. Avisa cuando la app quedó lista sin conexión y cuando hay una versión nueva:
// no se actualiza sola para no cortar una venta a medias.
export default function ActualizacionPWA() {
  const avisar = useToast()
  const {
    offlineReady: [listaSinConexion, setListaSinConexion],
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (listaSinConexion) {
      avisar('Lista para usar sin conexión', 'exito')
      setListaSinConexion(false)
    }
  }, [listaSinConexion, avisar, setListaSinConexion])

  if (!hayVersionNueva) return null
  return (
    <div role="alert" className="fixed inset-x-3 bottom-20 z-50 flex items-center justify-between gap-3 rounded-tarjeta bg-pie p-3 pl-4 text-sobre-tinta shadow-flotante md:inset-x-auto md:bottom-6 md:right-6 md:w-96">
      <p className="text-sm">Hay una versión nueva de la app.</p>
      <div className="flex shrink-0 gap-1">
        <Button variante="contorno_claro" onClick={() => setHayVersionNueva(false)}>Después</Button>
        <Button variante="claro" icono={RefreshCw} onClick={() => updateServiceWorker(true)}>Actualizar</Button>
      </div>
    </div>
  )
}
