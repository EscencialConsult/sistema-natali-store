// Punto de entrada del Gestor web dentro de Ajustes. Es lo único que la página Ajustes de Renzo importa de la tienda.
// Solo lo ve el superadministrador. Mientras la tabla tienda_config no exista en la base, no muestra nada.
import { useEffect, useState } from 'react'
import { useConfig } from '../../../data/hooks.js'
import { useAuth } from '../../auth/AuthContext.js'
import { leerTodo, sinTabla } from './api.js'
import GestorWeb from './GestorWeb.jsx'

export default function TiendaAjustes({ soloLectura }) {
  const { usuario } = useAuth()
  const esSuperadmin = usuario?.rol === 'superadmin'
  const cfg = useConfig()
  const [estado, setEstado] = useState({ cargando: true, config: null })

  useEffect(() => {
    if (!esSuperadmin) return undefined
    let vigente = true
    leerTodo()
      .then((config) => vigente && setEstado({ cargando: false, config }))
      .catch((e) => {
        if (!sinTabla(e)) console.warn('Gestor web: no se pudo leer la configuración de la tienda.')
        if (vigente) setEstado({ cargando: false, config: null })
      })
    return () => {
      vigente = false
    }
  }, [esSuperadmin])

  if (!esSuperadmin || estado.cargando || !estado.config || cfg.cargando) return null
  return <GestorWeb configInicial={estado.config} naty={cfg.datos ?? {}} soloLectura={soloLectura} />
}
