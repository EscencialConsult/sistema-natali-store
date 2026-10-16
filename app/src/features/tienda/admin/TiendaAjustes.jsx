// Punto de entrada del Gestor web dentro de Ajustes. Es lo único que la página Ajustes de Renzo importa de la tienda.
// Lo ve la administración (admin y superadmin), en Ajustes, pestaña «Gestor web». Si la tabla tienda_config no existe aún, lo explica.
import { useEffect, useState } from 'react'
import { useConfig, usePerfiles } from '../../../data/hooks.js'
import { useAuth } from '../../auth/AuthContext.js'
import { leerTodo, sinTabla } from './api.js'
import GestorWeb from './GestorWeb.jsx'

export default function TiendaAjustes({ soloLectura }) {
  const { usuario } = useAuth()
  const esAdministracion = usuario?.rol === 'superadmin' || usuario?.rol === 'admin'
  const cfg = useConfig()
  // Lectura de los perfiles de Renzo (solo lectura): los vendedores con teléfono son los contactos de la tienda.
  const equipo = usePerfiles()
  const [estado, setEstado] = useState({ cargando: true, config: null, motivo: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!esAdministracion) return undefined
    let vigente = true
    leerTodo()
      .then((config) => vigente && setEstado({ cargando: false, config, motivo: null }))
      .catch((e) => vigente && setEstado({ cargando: false, config: null, motivo: sinTabla(e) ? 'sin-tabla' : 'error' }))
    return () => {
      vigente = false
    }
  }, [esAdministracion, intento])

  if (!esAdministracion) return null
  if (estado.cargando || cfg.cargando || equipo.cargando) return <p className="text-sm text-texto-suave">Cargando…</p>
  if (!estado.config && estado.motivo === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-tarjeta bg-error-fondo p-4 text-sm text-error">
        <p>No pudimos leer la configuración de la tienda. Revisá tu conexión.</p>
        <button
          type="button"
          onClick={() => {
            setEstado({ cargando: true, config: null, motivo: null })
            setIntento((n) => n + 1)
          }}
          className="min-h-11 rounded-control border border-error px-4 font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }
  if (!estado.config) {
    return (
      <p role="note" className="rounded-tarjeta bg-superficie-2 p-4 text-sm text-texto-suave">
        La tienda online todavía no está activada en la base de datos, o no se pudo leer. Cuando se active, acá vas a poder administrarla.
      </p>
    )
  }
  return <GestorWeb configInicial={estado.config} naty={cfg.datos ?? {}} equipo={equipo.datos ?? []} soloLectura={soloLectura} />
}
