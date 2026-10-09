import { useEffect, useState } from 'react'
import { CloudDownload } from 'lucide-react'
import { Button } from '../../components/ui/index.js'
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
    <section className="flex flex-col gap-3 rounded-tarjeta border border-borde bg-superficie p-4">
      <h2 className="text-lg">Usar sin internet</h2>
      <p className="text-sm text-texto-suave">
        {completo
          ? 'Las fotos del catálogo ya están guardadas en este dispositivo: se ven aunque no haya señal.'
          : 'Descargá las fotos del catálogo ahora, con buena conexión, para verlas después sin señal.'}
        {guardadas !== null && ` (${guardadas} de ${total} guardadas)`}
      </p>
      {progreso && (
        <div>
          <progress value={progreso[0]} max={progreso[1]} className="h-2 w-full accent-tinta" aria-label="Descargando fotos" />
          <p className="text-xs text-texto-suave tabular-nums" aria-live="polite">{progreso[0]} de {progreso[1]}</p>
        </div>
      )}
      {resultado?.fallidas > 0 && <p role="alert" className="text-sm text-alerta">No se pudieron descargar {resultado.fallidas} fotos. Probá de nuevo con mejor conexión.</p>}
      {!completo && <Button variante="secundario" icono={CloudDownload} cargando={!!progreso} onClick={descargar} className="self-start">Descargar fotos del catálogo</Button>}
    </section>
  )
}
