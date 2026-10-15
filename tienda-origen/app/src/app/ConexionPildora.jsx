import { useLiveQuery } from 'dexie-react-hooks'
import { Wifi, WifiLow, WifiOff } from 'lucide-react'
import { Badge } from '../components/ui/index.js'
import { pendientes } from '../data/sync/cola.js'
import { useConexion } from '../lib/useConexion.js'

const ESTADOS = {
  conectado: { tono: 'exito', icono: Wifi, texto: 'Conectado' },
  lenta: { tono: 'alerta', icono: WifiLow, texto: 'Conexión lenta' },
  sin_conexion: { tono: 'error', icono: WifiOff, texto: 'Sin conexión' },
}

export default function ConexionPildora() {
  const estado = useConexion()
  const sinEnviar = useLiveQuery(pendientes, [], 0)
  const { tono, icono, texto } = ESTADOS[estado]
  return (
    <div className="flex items-center gap-1.5" role="status">
      <Badge tono={tono} icono={icono}>{texto}</Badge>
      {sinEnviar > 0 && <Badge tono="alerta">{sinEnviar} por enviar</Badge>}
    </div>
  )
}
