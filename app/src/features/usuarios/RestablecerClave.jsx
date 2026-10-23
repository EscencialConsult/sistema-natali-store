import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button, useToast } from '../../components/ui/index.js'
import { perfiles } from '../../data/repos/index.js'
import { avisoCiSinGuardar, resolverRestablecer } from '../../lib/clave.js'
import { ElegirClave, EnlaceAccion } from './CamposClave.jsx'

function CiGuardado({ ci }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-borde bg-superficie-2/60 py-1 pl-4 pr-1">
      <div>
        <p className="text-sm font-medium">CI guardado</p>
        <p className="text-sm text-texto-suave">{ver ? ci : '•'.repeat(ci.length)}</p>
      </div>
      <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar el CI' : 'Mostrar el CI'} aria-pressed={ver} className="flex size-11 shrink-0 items-center justify-center rounded-control text-texto-suave hover:text-texto">
        {ver ? <EyeOff size={18} strokeWidth={1.75} aria-hidden /> : <Eye size={18} strokeWidth={1.75} aria-hidden />}
      </button>
    </div>
  )
}

// Restablecer la contraseña de una persona (solo superadmin): volver a su CI (el guardado o uno escrito) o asignarle otra.
// El CI guardado se pide al abrir esta parte (con conexión) y no se copia a ningún lado.
export default function RestablecerClave({ perfil, onCancelar, onListo }) {
  const avisar = useToast()
  const [ci, setCi] = useState({ estado: 'cargando' }) // cargando · listo (valor puede ser null) · error
  const [intento, setIntento] = useState(0)
  const [modo, setModo] = useState('ci')
  const [corrigiendo, setCorrigiendo] = useState(false)
  const [enfocar, setEnfocar] = useState(false)
  const [f, setF] = useState({ ci: '', clave: '', repetir: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (campo) => (v) => setF((x) => ({ ...x, [campo]: v }))

  useEffect(() => {
    let vigente = true
    perfiles.verCi(perfil.id).then(
      (valor) => vigente && setCi({ estado: 'listo', valor }),
      (err) => vigente && setCi({ estado: 'error', mensaje: err.message }),
    )
    return () => {
      vigente = false
    }
  }, [perfil.id, intento])

  const guardado = ci.estado === 'listo' ? ci.valor : null
  const usarGuardado = modo === 'ci' && !!guardado && !corrigiendo
  const cambiarModo = (m) => {
    setEnfocar(true)
    setModo(m)
  }
  const reintentar = () => {
    setCi({ estado: 'cargando' })
    setIntento((n) => n + 1)
  }
  const faltaDato = ci.estado === 'cargando' || (!usarGuardado && (modo === 'ci' ? !f.ci.trim() : !f.clave))

  const restablecer = async () => {
    setError('')
    const r = resolverRestablecer({ modo, usarGuardado, ciGuardado: guardado, ...f })
    if (r.error) return setError(r.error)
    setGuardando(true)
    let cambiada = false
    try {
      await perfiles.cambiarClave(perfil.id, r.clave)
      cambiada = true
      if (r.ci) await perfiles.guardarCi(perfil.id, r.ci)
      avisar('Contraseña actualizada', 'exito')
      onListo()
    } catch (err) {
      if (!cambiada) {
        setError(err.message)
        setGuardando(false)
        return
      }
      avisar(avisoCiSinGuardar(err.message), 'error')
      onListo()
    }
  }

  return (
    <>
      <p className="text-sm font-medium">Nueva contraseña</p>

      {ci.estado === 'cargando' && <p role="status" className="text-sm text-texto-suave">Buscando el CI guardado…</p>}
      {ci.estado === 'error' && (
        <div role="alert" className="flex flex-col gap-1 rounded-control bg-error-fondo p-3 text-sm text-error">
          <p>No pudimos traer el CI guardado: {ci.mensaje}. Podés escribirlo a mano.</p>
          <EnlaceAccion onClick={reintentar}>Reintentar</EnlaceAccion>
        </div>
      )}

      {ci.estado !== 'cargando' && usarGuardado && (
        <div className="flex flex-col gap-2">
          <CiGuardado ci={guardado} />
          <p className="text-xs text-texto-suave">Su contraseña va a volver a ser este CI.</p>
          <div className="flex flex-wrap gap-x-4">
            <EnlaceAccion onClick={() => { setEnfocar(true); setCorrigiendo(true) }}>El CI es otro</EnlaceAccion>
            <EnlaceAccion onClick={() => cambiarModo('otra')}>Usar otra contraseña</EnlaceAccion>
          </div>
        </div>
      )}

      {ci.estado !== 'cargando' && !usarGuardado && (
        <>
          <ElegirClave
            modo={modo}
            onModo={cambiarModo}
            f={f}
            set={set}
            enfocar={enfocar}
            etiquetaCi={corrigiendo ? 'CI correcto (será su contraseña)' : 'CI de esta persona (será su contraseña)'}
            ayudaCi={guardado ? 'Reemplaza al CI guardado.' : 'Todavía no hay un CI guardado de esta persona: queda guardado para la próxima vez.'}
          />
          {guardado && modo === 'ci' && <EnlaceAccion onClick={() => setCorrigiendo(false)}>Usar el CI que ya está guardado</EnlaceAccion>}
        </>
      )}

      <p className="text-xs text-texto-suave">Si la persona tiene la sesión abierta, sigue adentro hasta que cierre sesión.</p>
      {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variante="suave" icono={KeyRound} cargando={guardando} deshabilitado={faltaDato} onClick={restablecer}>Guardar contraseña</Button>
        <Button variante="fantasma" onClick={onCancelar}>Cancelar</Button>
      </div>
    </>
  )
}
