import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button, Skeleton } from '../components/ui/index.js'
import { detalleDelError, prepararBase } from '../data/base.js'

// Un fallo al abrir el almacenamiento del navegador suele ser pasajero (la PC recién despertó, otra ventana lo tenía tomado):
// se reintenta solo antes de molestar a la persona.
const ESPERAS_MS = [700, 2_000, 5_000]

// Prepara la base local (copia del servidor para trabajar sin internet) antes de mostrar la app.
export default function Arranque({ children }) {
  const [estado, setEstado] = useState('cargando')
  const [intento, setIntento] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vigente = true
    let espera
    prepararBase()
      .then(() => vigente && setEstado('listo'))
      .catch((e) => {
        if (!vigente) return
        if (intento < ESPERAS_MS.length) {
          espera = setTimeout(() => setIntento((n) => n + 1), ESPERAS_MS[intento])
          return
        }
        setError(e)
        setEstado('error')
      })
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [intento])

  // Que el navegador no borre los datos del equipo si le falta espacio: ahí viven las ventas que todavía no se enviaron.
  useEffect(() => {
    if (estado === 'listo') navigator.storage?.persist?.().catch(() => {})
  }, [estado])

  if (estado === 'listo') return children
  if (estado === 'error') return <ErrorArranque error={error} onReintentar={() => { setError(null); setEstado('cargando'); setIntento(0) }} />
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-6" role="status" aria-label="Cargando">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  )
}

// Sin botón para borrar datos: apretarlo sin querer haría perder ventas sin enviar. Si el almacenamiento del navegador quedó dañado,
// lo resuelve soporte con el detalle que muestra esta pantalla (ver estabilidad/_comun.md del cerebro).
function ErrorArranque({ error, onReintentar }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-error-fondo text-error">
        <TriangleAlert size={26} strokeWidth={1.6} aria-hidden />
      </span>
      <p className="text-sm text-texto">No pudimos preparar los datos de este dispositivo.</p>
      <p className="text-sm text-texto-suave">
        Probá cerrar todas las ventanas de Chrome y abrir la app de nuevo. Si sigue igual, avisá a la administración y mostrales esta pantalla: tus ventas guardadas no se borran.
      </p>
      <p className="break-words rounded-control bg-superficie-2 px-3 py-2 text-left font-mono text-xs text-texto-suave">Detalle para soporte: {detalleDelError(error)}</p>
      <Button variante="primario" onClick={onReintentar}>Reintentar</Button>
    </div>
  )
}
