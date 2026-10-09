import { createContext, useContext } from 'react'

// Contrato de sesión. En la etapa 8 cambia la implementación (Supabase Auth), no esta interfaz:
//   usuario · cargando · iniciarSesion({ ci, clave }) (o { email, password } con servidor) · cerrarSesion()
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth se usa dentro de <AuthProvider>.')
  return ctx
}
