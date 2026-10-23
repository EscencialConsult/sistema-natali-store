import { useState } from 'react'
import { Check, KeyRound } from 'lucide-react'
import { Button, Input, useToast } from '../../components/ui/index.js'
import { perfiles } from '../../data/repos/index.js'
import { avisoCiSinGuardar, normalizarUsuario, resolverClave } from '../../lib/clave.js'
import { cn } from '../../lib/cn.js'
import { DESCRIPCION_ROL, ROLES } from '../../lib/permisos.js'
import { ElegirClave } from './CamposClave.jsx'
import RestablecerClave from './RestablecerClave.jsx'

const ORDEN_ROLES = ['vendedor', 'enc_tienda', 'enc_ventas', 'enc_deposito', 'admin', 'superadmin']

function ElegirRol({ valor, onCambiar }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">Rol</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ORDEN_ROLES.map((r) => {
          const activo = valor === r
          return (
            <label key={r} className={cn('relative flex cursor-pointer gap-3 rounded-control border p-3 transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta', activo ? 'border-tinta bg-tinte ring-2 ring-tinta/20' : 'border-borde-fuerte bg-superficie hover:border-texto-tenue')}>
              <input type="radio" name="rol" value={r} checked={activo} onChange={() => onCambiar(r)} className="sr-only" />
              <span aria-hidden className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border', activo ? 'border-tinta bg-tinta text-sobre-tinta' : 'border-borde-campo')}>
                {activo && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={cn('text-sm font-semibold', activo && 'text-sobre-tinte')}>{ROLES[r]}</span>
                <span className="text-xs text-texto-suave">{DESCRIPCION_ROL[r]}</span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// Alta y edición de un usuario. perfil=null → alta (la contraseña es su CI, o una a elección); con perfil → edición (+ restablecer contraseña aparte).
export default function UsuarioForm({ perfil, actorId, onListo }) {
  const avisar = useToast()
  const nuevo = !perfil
  const [f, setF] = useState({
    nombre: perfil?.nombre ?? '',
    usuario: perfil?.usuario ?? '',
    rol: perfil?.rol ?? 'vendedor',
    telefono: perfil?.telefono ?? '',
    activo: perfil?.activo ?? true,
    ci: '',
    clave: '',
    repetir: '',
  })
  const [modoClave, setModoClave] = useState('ci') // alta: 'ci' (su CI es la contraseña) · 'otra' (una a elección)
  const [enfocar, setEnfocar] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cambiandoClave, setCambiandoClave] = useState(false)
  const set = (campo) => (v) => setF((x) => ({ ...x, [campo]: v }))
  const esYo = perfil?.id === actorId
  const cambiarModoClave = (m) => {
    setEnfocar(true)
    setModoClave(m)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    const clave = nuevo ? resolverClave({ modo: modoClave, ci: f.ci, clave: f.clave, repetir: f.repetir }) : null
    if (clave?.error) return setError(clave.error)
    setGuardando(true)
    try {
      if (nuevo) {
        const creado = await perfiles.crear({ nombre: f.nombre, usuario: f.usuario, rol: f.rol, clave: clave.clave, telefono: f.telefono })
        avisar(`Usuario creado: ${normalizarUsuario(f.usuario)}`, 'exito')
        if (clave.ci) {
          try {
            await perfiles.guardarCi(creado.id, clave.ci)
          } catch (err) {
            avisar(avisoCiSinGuardar(err.message), 'error')
          }
        }
      } else {
        await perfiles.editar(perfil.id, f)
        avisar('Cambios guardados', 'exito')
      }
      onListo()
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input etiqueta="Nombre y apellido" value={f.nombre} onChange={(e) => set('nombre')(e.target.value)} autoComplete="off" autoFocus={nuevo} />
        <Input etiqueta="Usuario (con esto ingresa)" value={f.usuario} onChange={(e) => set('usuario')(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Ej. ariel" ayuda="Solo el nombre, sin apellido, espacios ni acentos." />
        <Input etiqueta="Teléfono (opcional)" inputMode="tel" value={f.telefono} onChange={(e) => set('telefono')(e.target.value)} autoComplete="off" />
      </div>

      <ElegirRol valor={f.rol} onCambiar={set('rol')} />

      {nuevo && (
        <ElegirClave
          modo={modoClave}
          onModo={cambiarModoClave}
          f={f}
          set={set}
          enfocar={enfocar}
          ayudaCi="Solo números. La persona ingresa con su usuario y su CI como contraseña."
        />
      )}

      {!nuevo && (
        <label className={cn('flex min-h-11 items-center justify-between gap-3 rounded-control border border-borde bg-superficie-2/60 px-4 py-3', esYo && 'opacity-60')}>
          <span>
            <span className="block text-sm font-medium">Usuario activo</span>
            <span className="block text-xs text-texto-suave">{esYo ? 'No podés darte de baja a vos mismo/a.' : 'Si lo desactivás, no puede ingresar más (sus ventas se conservan).'}</span>
          </span>
          <input type="checkbox" role="switch" checked={f.activo} disabled={esYo} onChange={(e) => set('activo')(e.target.checked)} className="peer sr-only" />
          <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-borde-fuerte transition-colors peer-checked:bg-tinta peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-superficie after:shadow after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      )}

      {!nuevo && (
        <section className="flex flex-col gap-3 rounded-control border border-borde p-4">
          {!cambiandoClave ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Contraseña</p>
                <p className="text-xs text-texto-suave">Si la olvidó, volvé a dejarla en su CI o asignale otra.</p>
              </div>
              <Button variante="secundario" icono={KeyRound} onClick={() => setCambiandoClave(true)}>Restablecer</Button>
            </div>
          ) : (
            <RestablecerClave perfil={perfil} onCancelar={() => setCambiandoClave(false)} onListo={onListo} />
          )}
        </section>
      )}

      {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}

      <div className="flex flex-wrap justify-end gap-2 border-t border-borde pt-4">
        <Button variante="fantasma" onClick={onListo}>Cancelar</Button>
        <Button type="submit" cargando={guardando} deshabilitado={!f.nombre.trim() || !f.usuario.trim() || (nuevo && (modoClave === 'ci' ? !f.ci.trim() : !f.clave))}>
          {nuevo ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
