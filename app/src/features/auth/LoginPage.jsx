import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '../../components/ui/index.js'
import { MODO_DEMO } from '../../lib/modoDemo.js'
import { CLAVE_INICIAL } from '../../data/seed/perfiles.js'
import { useAuth } from './AuthContext.js'
import MarcoIngreso from './MarcoIngreso.jsx'

// Ingreso sin servidor: CI y contraseña guardados (con hash) en el dispositivo.
export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const [ci, setCi] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
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
      await iniciarSesion({ ci, clave })
    } catch (err) {
      setError(err.message)
      setClave('')
      setEntrando(false)
    }
  }

  return (
    <MarcoIngreso>
      <form onSubmit={entrar} noValidate className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl md:text-3xl">Ingresar</h1>
          <p className="mt-1 text-texto-suave">Usá tu CI y la contraseña que te dio la administración.</p>
        </div>
        <Input etiqueta="CI (carnet de identidad)" autoComplete="username" autoCapitalize="characters" spellCheck={false} autoFocus value={ci} onChange={(e) => setCi(e.target.value)} placeholder="Ej. 1234567" />
        <div className="relative">
          <Input etiqueta="Contraseña" type={ver ? 'text' : 'password'} autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} error={error} className="[&_input]:pr-12" />
          <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver} className="absolute right-1 top-[1.625rem] flex size-11 items-center justify-center rounded-control text-texto-suave hover:text-texto">
            {ver ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
        <Button type="submit" tamano="lg" ancho cargando={entrando} deshabilitado={!ci.trim() || !clave}>Entrar</Button>
        {MODO_DEMO ? (
          <p className="rounded-control bg-tinte p-3 text-center text-xs text-sobre-tinte">
            Demo: CI <strong>1000000</strong> (superadmin) · 1000001 Natali · 1000002 Ariel… · contraseña <strong>{CLAVE_INICIAL}</strong>
          </p>
        ) : (
          <p className="text-center text-xs text-texto-tenue">¿Olvidaste tu contraseña? Pedísela a la administración.</p>
        )}
      </form>
    </MarcoIngreso>
  )
}
