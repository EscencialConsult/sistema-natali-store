import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { Button, ErrorState, Input, Skeleton } from '../../components/ui/index.js'
import { usePerfiles } from '../../data/hooks.js'
import { ROLES } from '../../lib/permisos.js'
import { useAuth } from './AuthContext.js'

export default function LoginPage() {
  const { iniciarSesion } = useAuth()
  const { datos, cargando, error, reintentar } = usePerfiles()
  const [elegido, setElegido] = useState(null)
  const [pin, setPin] = useState('')
  const [fallo, setFallo] = useState('')
  const [entrando, setEntrando] = useState(false)
  useEffect(() => {
    document.title = 'Ingresar · Modas Naty'
  }, [])

  const entrar = async (e) => {
    e.preventDefault()
    setEntrando(true)
    setFallo('')
    try {
      await iniciarSesion({ perfilId: elegido.id, pin })
    } catch (err) {
      setFallo(err.message)
      setPin('')
      setEntrando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo className="text-3xl" />
        <p className="text-sm text-texto-suave">Notas de venta y catálogo</p>
      </header>

      {!elegido ? (
        <section aria-labelledby="quien" className="flex flex-col gap-3">
          <h1 id="quien" className="text-xl">¿Quién sos?</h1>
          {cargando && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14" />)}
          {error && <ErrorState mensaje="No pudimos cargar los usuarios." onReintentar={reintentar} />}
          {datos?.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setElegido(p)}
              className="flex min-h-14 flex-col items-start justify-center rounded-control border border-borde bg-superficie px-4 text-left hover:bg-superficie-2"
            >
              <span className="text-base font-medium">{p.nombre}</span>
              <span className="text-sm text-texto-suave">{ROLES[p.rol]}</span>
            </button>
          ))}
        </section>
      ) : (
        <form onSubmit={entrar} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setElegido(null)
              setPin('')
              setFallo('')
            }}
            className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave"
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Cambiar usuario
          </button>
          <div>
            <h1 className="text-xl">{elegido.nombre}</h1>
            <p className="text-sm text-texto-suave">{ROLES[elegido.rol]}</p>
          </div>
          <Input
            etiqueta="PIN"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            error={fallo}
          />
          <Button type="submit" ancho cargando={entrando} deshabilitado={pin.length < 4}>Entrar</Button>
          <p className="text-center text-xs text-texto-tenue">Acceso de prueba: el sistema real usa correo y contraseña.</p>
        </form>
      )}
    </main>
  )
}
