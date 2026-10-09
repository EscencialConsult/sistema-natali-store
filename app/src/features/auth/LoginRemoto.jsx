import { useEffect, useState } from 'react'
import { Button, Input } from '../../components/ui/index.js'
import { useAuth } from './AuthContext.js'
import MarcoIngreso from './MarcoIngreso.jsx'

// Ingreso con correo y contraseña (modo con servidor).
export default function LoginRemoto() {
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)
  useEffect(() => {
    document.title = 'Ingresar · Modas Naty'
  }, [])

  const entrar = async (e) => {
    e.preventDefault()
    setError('')
    setEntrando(true)
    try {
      await iniciarSesion({ email, password })
    } catch (err) {
      setError(err.message)
      setEntrando(false)
    }
  }

  return (
    <MarcoIngreso>
      <form onSubmit={entrar} noValidate className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl">Ingresar</h1>
          <p className="mt-1 text-texto-suave">Ingresá con tu correo y contraseña.</p>
        </div>
        <Input etiqueta="Correo electrónico" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input etiqueta="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit" tamano="lg" ancho cargando={entrando} deshabilitado={!email.trim() || !password}>Entrar</Button>
        <p className="text-center text-xs text-texto-tenue">¿Olvidaste tu contraseña? Pedísela a la administración.</p>
      </form>
    </MarcoIngreso>
  )
}
