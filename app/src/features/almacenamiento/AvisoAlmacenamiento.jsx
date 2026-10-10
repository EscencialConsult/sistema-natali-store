import { useState } from 'react'
import { HardDrive } from 'lucide-react'
import { Button, Tarjeta } from '../../components/ui/index.js'
import { cn } from '../../lib/cn.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import AlmacenamientoModal from './AlmacenamientoModal.jsx'
import { useUsoAlmacenamiento } from './useUsoAlmacenamiento.js'

const ESTILO = {
  aviso: 'bg-alerta-fondo text-alerta ring-alerta/25 hover:bg-alerta-fondo/70',
  urgente: 'bg-error text-sobre-tinta ring-error hover:brightness-95',
}

// Botón en la barra superior: SOLO el superadmin y SOLO desde el 80 %. Abre el detalle con el porcentaje.
export default function AvisoAlmacenamiento() {
  const { usuario } = useAuth()
  const esSuper = puede(usuario.rol, 'datos.borrar')
  const { uso, actualizar } = useUsoAlmacenamiento(esSuper)
  const [abierto, setAbierto] = useState(false)
  if (!esSuper || !uso || uso.nivel === 'ok') return null
  const pct = String(uso.pct).replace('.', ',')
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-pildora px-3 text-xs font-semibold ring-1 ring-inset transition-colors', ESTILO[uso.nivel], uso.nivel === 'urgente' && 'motion-safe:animate-pulse')}
      >
        <HardDrive size={14} strokeWidth={2} aria-hidden />
        <span className="max-sm:hidden">Almacenamiento al</span> {pct} %
        <span className="sr-only">. Ver detalle</span>
      </button>
      <AlmacenamientoModal abierto={abierto} onCerrar={() => setAbierto(false)} uso={uso} actualizar={actualizar} />
    </>
  )
}

// Tarjeta en Ajustes (solo superadmin): acceso al detalle aunque no haya advertencia.
export function TarjetaAlmacenamiento() {
  const { usuario } = useAuth()
  const esSuper = puede(usuario.rol, 'datos.borrar')
  const { uso, actualizar } = useUsoAlmacenamiento(esSuper)
  const [abierto, setAbierto] = useState(false)
  if (!esSuper) return null
  return (
    <Tarjeta titulo="Almacenamiento" icono={HardDrive} descripcion="Espacio usado por datos y fotos.">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-texto-suave">
          {uso ? <>Uso actual: <strong className="text-texto tabular-nums">{String(uso.pct).replace('.', ',')} %</strong> del límite.</> : 'Midiendo…'}
        </p>
        <Button variante="secundario" icono={HardDrive} onClick={() => setAbierto(true)} className="self-start">Ver detalle</Button>
      </div>
      <AlmacenamientoModal abierto={abierto} onCerrar={() => setAbierto(false)} uso={uso} actualizar={actualizar} />
    </Tarjeta>
  )
}
