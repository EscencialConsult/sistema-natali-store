import { useCallback, useEffect, useMemo, useState } from 'react'
import { perfiles } from '../../data/repos/index.js'
import { AuthContext } from './AuthContext.js'

const CLAVE = 'naty.sesion'
// Login de PRUEBA (mock): se elige un usuario y un PIN. Se elimina con Supabase Auth (etapa 8).
const PIN_PRUEBA = import.meta.env.VITE_PIN_PRUEBA || '0000'

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
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vigente = true
    const id = leer()
    const restaurar = id ? perfiles.obtener(id) : Promise.resolve(null)
    restaurar
      .then((p) => vigente && setUsuario(p?.activo ? p : null))
      .catch(() => vigente && setUsuario(null))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  const iniciarSesion = useCallback(async ({ perfilId, pin }) => {
    const perfil = await perfiles.obtener(perfilId)
    if (!perfil?.activo) throw new Error('Ese usuario no está disponible.')
    if (pin !== PIN_PRUEBA) throw new Error('PIN incorrecto.')
    guardar(perfil.id)
    setUsuario(perfil)
    return perfil
  }, [])

  const cerrarSesion = useCallback(async () => {
    guardar(null)
    setUsuario(null)
    return { ok: true }
  }, [])

  const valor = useMemo(() => ({ usuario, cargando, iniciarSesion, cerrarSesion }), [usuario, cargando, iniciarSesion, cerrarSesion])
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
