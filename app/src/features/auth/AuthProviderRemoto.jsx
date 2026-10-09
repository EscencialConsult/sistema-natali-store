import { useCallback, useEffect, useMemo, useState } from 'react'
import { db } from '../../data/db.js'
import { obtenerSupabase } from '../../data/supabase.js'
import { liveQuery } from 'dexie'
import { emailDeUsuario } from '../../lib/clave.js'
import { pendientes } from '../../data/sync/cola.js'
import { AuthContext } from './AuthContext.js'

// Sesión real con Supabase Auth. El colaborador escribe su usuario; se ingresa con el correo interno de ese usuario. Misma interfaz que el login local:
//   usuario · cargando · iniciarSesion({ usuario, clave }) · cerrarSesion() → { ok, motivo? }
// La sesión queda guardada en el dispositivo: sin internet se sigue adentro con el perfil guardado.

async function perfilDe(sb, userId) {
  let perfil = await db.perfiles.get(userId)
  if (!perfil && navigator.onLine !== false) {
    const { data } = await sb.from('naty_perfiles').select('*').eq('id', userId).maybeSingle()
    if (data) {
      perfil = { id: data.id, nombre: data.nombre, iniciales: data.iniciales, rol: data.rol, telefono: data.telefono, activo: data.activo, usuario: data.usuario }
      await db.perfiles.put(perfil)
    }
  }
  return perfil?.activo ? perfil : null
}

export default function AuthProviderRemoto({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    let suscripcion
    ;(async () => {
      const sb = await obtenerSupabase()
      const {
        data: { session },
      } = await sb.auth.getSession()
      const inicial = session ? await perfilDe(sb, session.user.id) : null
      if (!vigente) return
      setUsuario(inicial)
      setCargando(false)
      const { data } = sb.auth.onAuthStateChange(async (evento, sesion) => {
        if (evento === 'SIGNED_OUT') setUsuario(null)
        if (evento === 'SIGNED_IN' && sesion) {
          const p = await perfilDe(sb, sesion.user.id)
          // El mismo perfil no vuelve a renderizar todo (SIGNED_IN también llega al volver a la pestaña).
          if (vigente) setUsuario((actual) => (actual?.id === p?.id ? actual : p))
        }
      })
      suscripcion = data.subscription
    })().catch(() => vigente && setCargando(false))
    return () => {
      vigente = false
      suscripcion?.unsubscribe()
    }
  }, [])

  const iniciarSesion = useCallback(async ({ usuario: nombreUsuario, clave }) => {
    const sb = await obtenerSupabase()
    let resultado
    try {
      resultado = await sb.auth.signInWithPassword({ email: emailDeUsuario(nombreUsuario), password: clave })
    } catch {
      throw new Error('No hay conexión. Para entrar la primera vez en este dispositivo hace falta internet.')
    }
    if (resultado.error) {
      const sinRed = /fetch|network|failed/i.test(resultado.error.message)
      throw new Error(sinRed ? 'No hay conexión. Para entrar la primera vez en este dispositivo hace falta internet.' : 'Usuario o contraseña incorrectos.')
    }
    const perfil = await perfilDe(sb, resultado.data.user.id)
    if (!perfil) {
      await sb.auth.signOut({ scope: 'local' })
      throw new Error('Tu usuario no está habilitado. Pedile a la administración que lo active.')
    }
    setUsuario(perfil)
    return perfil
  }, [])

  // Con ventas sin enviar NO se sale: otra persona que entrara después no podría enviarlas (cada venta es de quien la hizo).
  const cerrarSesion = useCallback(async () => {
    const sinEnviar = await pendientes()
    if (sinEnviar > 0) {
      return { ok: false, motivo: `Hay ${sinEnviar} ${sinEnviar === 1 ? 'cambio' : 'cambios'} sin enviar. Conectate a internet y esperá a que se envíen antes de salir.` }
    }
    const sb = await obtenerSupabase()
    await sb.auth.signOut({ scope: 'local' })
    // En un celular compartido no debe quedar la información de la persona anterior.
    await db.delete()
    await db.open()
    await db.config.put({ clave: 'origen', valor: 'supabase' })
    setUsuario(null)
    return { ok: true }
  }, [])

  // El perfil se observa en la base local (que la sincronización actualiza): si la superadmin le cambia el rol o lo
  // da de baja, el menú y los permisos se actualizan sin cerrar la app.
  const idUsuario = usuario?.id
  useEffect(() => {
    if (!idUsuario) return
    const sub = liveQuery(() => db.perfiles.get(idUsuario)).subscribe({
      next: (p) => {
        if (!p) return
        if (!p.activo) setUsuario(null)
        else setUsuario((u) => (u && JSON.stringify(u) === JSON.stringify(p) ? u : p))
      },
    })
    return () => sub.unsubscribe()
  }, [idUsuario])

  const valor = useMemo(() => ({ usuario, cargando, iniciarSesion, cerrarSesion }), [usuario, cargando, iniciarSesion, cerrarSesion])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
