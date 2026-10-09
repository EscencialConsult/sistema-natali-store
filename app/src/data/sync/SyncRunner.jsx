import { useEffect } from 'react'
import { useToast } from '../../components/ui/index.js'
import { useAuth } from '../../features/auth/AuthContext.js'
import { hayBackend, obtenerSupabase } from '../supabase.js'
import { iniciarAutomatico } from './cola.js'
import { descargar, enviarRemoto } from './remoto.js'

// Sin interfaz. Cada 30 s, al volver la conexión y al entrar: envía lo pendiente y (con servidor) baja lo nuevo.
// Sin servidor configurado usa un envío simulado, para poder probar la app sin backend.
export default function SyncRunner() {
  const avisar = useToast()
  const { usuario } = useAuth()
  const idUsuario = usuario?.id

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
