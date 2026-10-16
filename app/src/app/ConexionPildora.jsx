import { useLiveQuery } from 'dexie-react-hooks'
import { CloudUpload, Wifi, WifiLow, WifiOff } from 'lucide-react'
import { Badge } from '../components/ui/index.js'
import { pendientes } from '../data/sync/cola.js'
import { cn } from '../lib/cn.js'

const ESTADOS = {
  conectado: { punto: 'bg-exito', texto: 'En línea' },
  lenta: { punto: 'bg-alerta', texto: 'Conexión lenta' },
  sin_conexion: { punto: 'bg-error', texto: 'Sin conexión' },
}

const ventasTexto = (n) => `${n} ${n === 1 ? 'venta' : 'ventas'}`

// Indicador discreto (a la derecha de la barra superior): un punto de color y una palabra, sin cápsula.
// Las ventas por enviar se ven siempre, también en el celular. El estado lo mide Layout una sola vez.
export default function ConexionPildora({ estado }) {
  const sinEnviar = useLiveQuery(pendientes, [], 0)
  const { punto, texto } = ESTADOS[estado]
  return (
    <div className="flex items-center gap-2" role="status">
      <span className="inline-flex min-h-8 items-center gap-2 text-xs font-medium text-texto-suave">
        <span aria-hidden className={cn('size-2 rounded-full', punto)} />
        {texto}
      </span>
      {sinEnviar > 0 && <Badge tono="alerta" icono={CloudUpload}>{sinEnviar} por enviar</Badge>}
    </div>
  )
}

// Franja de ancho completo bajo la barra superior: sin conexión (roja), lenta (ámbar) y, al volver la señal,
// "Conexión restablecida" (verde) por unos segundos. Así nadie confunde que esté vendiendo sin internet.
export function AvisoConexion({ estado, restablecida }) {
  const sinEnviar = useLiveQuery(pendientes, [], 0)

  let aviso = null
  if (estado === 'sin_conexion') {
    aviso = {
      clase: 'bg-error text-sobre-tinta',
      icono: WifiOff,
      titulo: 'Estás sin conexión',
      texto: `Podés seguir vendiendo: todo se guarda en este dispositivo y se envía solo cuando vuelva la señal.${sinEnviar ? ` (${ventasTexto(sinEnviar)} por enviar)` : ''}`,
    }
  } else if (estado === 'lenta') {
    aviso = { clase: 'bg-alerta-fondo text-alerta', icono: WifiLow, titulo: 'Conexión lenta', texto: 'Algunas cosas pueden tardar; las ventas se guardan igual.' }
  } else if (restablecida) {
    aviso = {
      clase: 'bg-exito text-sobre-tinta',
      icono: Wifi,
      titulo: 'Conexión restablecida',
      texto: sinEnviar ? `Enviando ${ventasTexto(sinEnviar)} pendientes…` : 'Todo está sincronizado.',
    }
  }
  if (!aviso) return null
  const Icono = aviso.icono
  return (
    <div role="status" aria-live="polite" className={cn('toast', aviso.clase)}>
      <p className="mx-auto flex w-full max-w-6xl items-start gap-2.5 px-4 py-2 text-sm md:px-8">
        <Icono size={18} strokeWidth={2} aria-hidden className="mt-px shrink-0" />
        <span><strong className="font-semibold">{aviso.titulo}.</strong> {aviso.texto}</span>
      </p>
    </div>
  )
}
