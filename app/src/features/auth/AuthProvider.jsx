import { useCallback, useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { perfiles } from '../../data/repos/index.js'
import { AuthContext } from './AuthContext.js'

const CLAVE = 'naty.sesion'
// Ingreso LOCAL (sin servidor): CI + contraseña verificados contra el hash guardado en el dispositivo.
// Con Supabase se usa AuthProviderRemoto.

const leer = () => {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}
const guardar = (id) => {
  try {
    if (id) localStorage.setItem(CLAVE, id)
    else localStorage.removeItem(CLAVE)
  } catch {
    /* modo privado: la sesión dura lo que dure la pestaña */
  }
}

export default function AuthProvider({ children }) {
  const [sesionId, setSesionId] = useState(leer)
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(!!sesionId)

  // El perfil de la sesión se observa en vivo: si la superadmin le cambia el rol o lo da de baja,
  // el menú y los permisos se actualizan al instante (y una baja cierra la sesión).
  useEffect(() => {
    if (!sesionId) return
    const sub = liveQuery(() => perfiles.obtener(sesionId)).subscribe({
      next: (p) => {
        if (p?.activo) setUsuario((u) => (u && JSON.stringify(u) === JSON.stringify(p) ? u : p))
        else {
          guardar(null)
          setSesionId(null)
          setUsuario(null)
        }
        setCargando(false)
      },
      error: () => {
        setUsuario(null)
        setCargando(false)
      },
    })
    return () => sub.unsubscribe()
  }, [sesionId])

  const iniciarSesion = useCallback(async ({ ci, clave }) => {
    const perfil = await perfiles.verificarCredenciales(ci, clave)
    guardar(perfil.id)
    setUsuario(perfil)
    setSesionId(perfil.id)
    return perfil
  }, [])

  const cerrarSesion = useCallback(async () => {
    guardar(null)
    setSesionId(null)
    setUsuario(null)
    return { ok: true }
  }, [])

  const valor = useMemo(() => ({ usuario, cargando, iniciarSesion, cerrarSesion }), [usuario, cargando, iniciarSesion, cerrarSesion])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
