import { useEffect, useState } from 'react'
import Logo from '../../components/Logo.jsx'
import { Button, Input } from '../../components/ui/index.js'
import { useAuth } from './AuthContext.js'

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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo className="text-3xl" />
        <p className="text-sm text-texto-suave">Notas de venta y catálogo</p>
      </header>
      <form onSubmit={entrar} noValidate className="flex flex-col gap-4">
        <h1 className="text-xl">Ingresar</h1>
        <Input etiqueta="Correo electrónico" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input etiqueta="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit" ancho cargando={entrando} deshabilitado={!email.trim() || !password}>Entrar</Button>
        <p className="text-center text-xs text-texto-tenue">¿Olvidaste tu contraseña? Pedísela a la administración.</p>
      </form>
    </main>
  )
}
