import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button, Skeleton } from '../components/ui/index.js'
import { detalleDelError, pendientesSinEnviar, prepararBase, restablecerDispositivo } from '../data/base.js'

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

function ErrorArranque({ error, onReintentar }) {
  const [confirmando, setConfirmando] = useState(false)
  const [sinEnviar, setSinEnviar] = useState(undefined)
  const [restableciendo, setRestableciendo] = useState(false)

  const pedirRestablecer = async () => {
    setSinEnviar(await pendientesSinEnviar())
    setConfirmando(true)
  }
  const restablecer = async () => {
    setRestableciendo(true)
    await restablecerDispositivo()
  }

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-error-fondo text-error">
        <TriangleAlert size={26} strokeWidth={1.6} aria-hidden />
      </span>
      <p className="text-sm text-texto">No pudimos preparar los datos de este dispositivo.</p>
      <p className="text-sm text-texto-suave">
        Probá cerrar todas las ventanas de Chrome y abrir la app de nuevo. Si sigue igual, usá «Restablecer este equipo»: hace falta internet para volver a bajar el catálogo.
      </p>
      <p className="break-words rounded-control bg-superficie-2 px-3 py-2 text-left font-mono text-xs text-texto-suave">Detalle para soporte: {detalleDelError(error)}</p>
      {!confirmando ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button variante="primario" onClick={onReintentar}>Reintentar</Button>
          <Button variante="secundario" onClick={pedirRestablecer}>Restablecer este equipo</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-tarjeta border border-borde p-4">
          <p className="text-sm text-texto">
            {sinEnviar > 0
              ? `Hay ${sinEnviar} ${sinEnviar === 1 ? 'cambio' : 'cambios'} sin enviar en este equipo y se van a perder. Primero probá «Reintentar» o consultá a la administración.`
              : sinEnviar === 0
                ? 'No hay ventas sin enviar en este equipo. Se borra la copia local y se vuelve a bajar todo.'
                : 'No se puede leer qué hay guardado en este equipo. Si había ventas sin enviar, se pierden.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variante={sinEnviar > 0 ? 'peligro' : 'primario'} cargando={restableciendo} onClick={restablecer}>Restablecer igual</Button>
            <Button variante="fantasma" deshabilitado={restableciendo} onClick={() => setConfirmando(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
