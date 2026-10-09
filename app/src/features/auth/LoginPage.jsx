import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { MarcaIcono } from '../../components/Logo.jsx'
import { useMarca } from '../../components/useMarca.js'
import { Button, Input, TARJETA } from '../../components/ui/index.js'
import { useAuth } from './AuthContext.js'

// Ingreso del equipo (no es una pantalla comercial): usuario y contraseña que da la administración.
export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const { nombre } = useMarca()
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [entrando, setEntrando] = useState(false)
  useEffect(() => {
    document.title = `Ingresar · ${nombre}`
  }, [nombre])

  const entrar = async (e) => {
    e.preventDefault()
    setError('')
    setEntrando(true)
    try {
      await iniciarSesion({ usuario, clave })
    } catch (err) {
      setError(err.message)
      setClave('')
      setEntrando(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <form onSubmit={entrar} noValidate className={`${TARJETA} flex w-full max-w-sm flex-col gap-5 p-6 sm:p-8`}>
        <div className="flex flex-col items-center gap-3 text-center">
          <MarcaIcono tamano="lg" />
          <div>
            <h1 className="text-2xl">{nombre}</h1>
            <p className="text-sm text-texto-suave">Ingresá con tu usuario y contraseña.</p>
          </div>
        </div>
        <Input etiqueta="Usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        <div className="relative">
          <Input etiqueta="Contraseña" type={ver ? 'text' : 'password'} autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} error={error} className="[&_input]:pr-12" />
          <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver} className="absolute right-1 top-[1.625rem] flex size-11 items-center justify-center rounded-control text-texto-suave hover:text-texto">
            {ver ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
        <Button type="submit" tamano="lg" ancho cargando={entrando} deshabilitado={!usuario.trim() || !clave}>Entrar</Button>
        <p className="text-center text-xs text-texto-tenue">¿Olvidaste tu contraseña? Pedísela a la administración.</p>
      </form>
    </main>
  )
}
