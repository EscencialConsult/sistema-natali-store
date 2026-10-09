import { useEffect, useState } from 'react'
import { CloudDownload, CloudOff } from 'lucide-react'
import { Button, Tarjeta } from '../../components/ui/index.js'
import { useProductos } from '../../data/hooks.js'
import { contarGuardadas, descargarFotos, hayCacheApi, urlsDescargables } from '../../lib/offline.js'

// Guarda las fotos del catálogo en el dispositivo para mostrarlas sin señal. Una sola vez; se puede repetir.
export default function DescargaOffline() {
  const prods = useProductos()
  const [guardadas, setGuardadas] = useState(null)
  const [progreso, setProgreso] = useState(null)
  const [resultado, setResultado] = useState(null)

  const urls = urlsDescargables((prods.datos ?? []).flatMap((p) => p.fotos))
  const total = urls.length

  useEffect(() => {
    if (!prods.datos || !hayCacheApi()) return
    let vigente = true
    contarGuardadas(urls).then((n) => vigente && setGuardadas(n))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prods.datos])

  if (!hayCacheApi() || !prods.datos || total === 0) return null

  const descargar = async () => {
    setResultado(null)
    setProgreso([0, total])
    const r = await descargarFotos(urls, (h, t) => setProgreso([h, t]))
    setResultado(r)
    setGuardadas(await contarGuardadas(urls))
    setProgreso(null)
  }

  const completo = guardadas === total
  return (
    <Tarjeta titulo="Usar sin internet" icono={CloudOff}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-texto-suave">
          {completo
            ? 'Las fotos del catálogo ya están guardadas en este dispositivo: se ven aunque no haya señal.'
            : 'Descargá las fotos del catálogo ahora, con buena conexión, para verlas después sin señal.'}
        </p>
        {guardadas !== null && !progreso && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-texto-suave tabular-nums"><span>Fotos guardadas</span><span>{guardadas} de {total}</span></div>
            <progress value={guardadas} max={total} className="w-full" aria-label="Fotos guardadas" />
          </div>
        )}
        {progreso && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-texto-suave tabular-nums" aria-live="polite"><span>Descargando…</span><span>{progreso[0]} de {progreso[1]}</span></div>
            <progress value={progreso[0]} max={progreso[1]} className="w-full" aria-label="Descargando fotos" />
          </div>
        )}
        {resultado?.fallidas > 0 && <p role="alert" className="text-sm text-alerta">No se pudieron descargar {resultado.fallidas} fotos. Probá de nuevo con mejor conexión.</p>}
        {!completo && <Button variante="secundario" icono={CloudDownload} cargando={!!progreso} onClick={descargar} className="self-start">Descargar fotos</Button>}
      </div>
    </Tarjeta>
  )
}
