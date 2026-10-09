import { useEffect, useRef } from 'react'
import { useToast } from '../../components/ui/index.js'
import { useAuth } from '../../features/auth/AuthContext.js'
import { obtenerSupabase } from '../supabase.js'
import { iniciarAutomatico } from './cola.js'
import { descargar, enviarRemoto } from './remoto.js'

// Sin interfaz. Cada 30 s, al volver la conexión y al entrar: envía lo pendiente y (con servidor) baja lo nuevo.
// Necesita sesión: los cambios se envían con los permisos de quien los hizo.
export default function SyncRunner() {
  const avisar = useToast()
  const { usuario } = useAuth()
  const idUsuario = usuario?.id
  // Errores ya avisados: el reintento automático (cada 30 s) no repite el mismo aviso.
  const erroresAvisados = useRef(0)

  useEffect(() => {
    if (!idUsuario) return
    let cancelado = false
    let detener
    ;(async () => {
      const sb = await obtenerSupabase()
      if (cancelado) return
      detener = iniciarAutomatico({
        enviar: (item) => enviarRemoto(sb, item),
        despues: () => descargar(sb),
        onResultado: ({ errores }) => {
          // Lo enviado con éxito no se avisa (lo muestran la píldora "por enviar" y la franja de conexión).
          if (errores > erroresAvisados.current) avisar(errores === 1 ? '1 cambio no se pudo enviar. Se reintenta solo.' : `${errores} cambios no se pudieron enviar. Se reintenta solo.`, 'error')
          erroresAvisados.current = errores
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
