import { useEffect } from 'react'
import { useToast } from '../../components/ui/index.js'
import { useAuth } from '../../features/auth/AuthContext.js'
import { cambio } from '../repos/index.js'
import { hayBackend, obtenerSupabase } from '../supabase.js'
import { iniciarAutomatico } from './cola.js'
import { descargarCatalogoPublico } from './publico.js'
import { descargar, enviarRemoto } from './remoto.js'

const CADA_PUBLICO_MS = 60_000
// La conversión Bs/pesos se mira más seguido: es lo que más rápido deja desactualizado un precio en pantalla.
const CADA_CAMBIO_MS = 20_000

// Sin interfaz. Con sesión: cada 30 s, al volver la conexión y al entrar, envía lo pendiente y baja lo nuevo.
// Sin sesión y con servidor (compradoras, kiosco): refresca el catálogo público cada minuto y al volver la conexión.
// Sin servidor configurado usa un envío simulado, para poder probar la app sin backend.
export default function SyncRunner() {
  const avisar = useToast()
  const { usuario } = useAuth()
  const idUsuario = usuario?.id

  // Conversión Bs/pesos (con o sin sesión): cada 20 s, al volver a la pestaña y al volver la conexión.
  useEffect(() => {
    if (!hayBackend) return
    const correr = () => {
      if (navigator.onLine === false || document.visibilityState === 'hidden') return
      cambio.refrescar()
    }
    correr()
    const t = setInterval(correr, CADA_CAMBIO_MS)
    window.addEventListener('online', correr)
    window.addEventListener('focus', correr)
    document.addEventListener('visibilitychange', correr)
    return () => {
      clearInterval(t)
      window.removeEventListener('online', correr)
      window.removeEventListener('focus', correr)
      document.removeEventListener('visibilitychange', correr)
    }
  }, [])

  // Catálogo público (sin sesión)
  useEffect(() => {
    if (!hayBackend || idUsuario) return
    let cancelado = false
    const correr = async () => {
      if (navigator.onLine === false) return
      try {
        const sb = await obtenerSupabase()
        if (!cancelado) await descargarCatalogoPublico(sb)
      } catch {
        /* sin red o servidor caído: se sigue con lo guardado y se reintenta en el próximo ciclo */
      }
    }
    const t = setInterval(correr, CADA_PUBLICO_MS)
    window.addEventListener('online', correr)
    return () => {
      cancelado = true
      clearInterval(t)
      window.removeEventListener('online', correr)
    }
  }, [idUsuario])

  // Cola de envío y bajada completa (con sesión, o sin servidor)
  useEffect(() => {
    if (hayBackend && !idUsuario) return
    let cancelado = false
    let detener
    ;(async () => {
      const sb = hayBackend ? await obtenerSupabase() : null
      if (cancelado) return
      detener = iniciarAutomatico({
        enviar: sb ? (item) => enviarRemoto(sb, item) : undefined,
        despues: sb ? () => descargar(sb) : undefined,
        onResultado: ({ enviadas, errores }) => {
          if (enviadas > 0) avisar(enviadas === 1 ? '1 cambio enviado' : `${enviadas} cambios enviados`, 'exito')
          if (errores > 0) avisar(errores === 1 ? '1 cambio no se pudo enviar. Se reintenta solo.' : `${errores} cambios no se pudieron enviar. Se reintenta solo.`, 'error')
        },
      })
    })()
    return () => {
      cancelado = true
      detener?.()
    }
  }, [avisar, idUsuario])

  return null
}
