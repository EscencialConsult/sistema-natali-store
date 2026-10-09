import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { Badge } from '../../../components/ui/index.js'
import { cn } from '../../../lib/cn.js'
import { comprimirImagen } from '../../../lib/imagen.js'
import { nuevoId } from '../../../lib/id.js'
import Foto from '../Foto.jsx'

const BOTON = 'flex size-9 items-center justify-center rounded-full bg-superficie/95 text-texto shadow-tarjeta backdrop-blur-sm transition-colors hover:bg-superficie disabled:opacity-30'

// fotos: [{ key, ruta, blob }]. La primera es la principal. Se comprimen en el navegador al elegirlas.
// Se agregan tocando la zona o arrastrando archivos encima (escritorio).
export default function FotosEditor({ fotos, onChange }) {
  const input = useRef(null)
  const [procesando, setProcesando] = useState(false)
  const [encima, setEncima] = useState(false)
  const [fallos, setFallos] = useState([])

  const agregar = async (archivos) => {
    if (!archivos.length) return
    setProcesando(true)
    const nuevas = []
    const errores = []
    for (const a of archivos) {
      try {
        nuevas.push({ key: nuevoId(), ruta: '', blob: await comprimirImagen(a) })
      } catch (e) {
        errores.push(e.message)
      }
    }
    setFallos(errores)
    onChange([...fotos, ...nuevas])
    setProcesando(false)
    if (input.current) input.current.value = ''
  }
  const mover = (i, d) => {
    const copia = [...fotos]
    const j = i + d
    if (j < 0 || j >= copia.length) return
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    onChange(copia)
  }
  const quitar = (i) => onChange(fotos.filter((_, k) => k !== i))
  const soltar = (e) => {
    e.preventDefault()
    setEncima(false)
    agregar([...e.dataTransfer.files])
  }

  const zona = (compacta = false) => (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={soltar}
      disabled={procesando}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-tarjeta border-2 border-dashed text-center transition-colors',
        encima ? 'border-tinta bg-tinte' : 'border-borde-fuerte bg-superficie-2/50 hover:border-tinta/60 hover:bg-tinte/50',
        compacta ? 'aspect-[3/4] p-3' : 'min-h-44 p-6',
      )}
    >
      {procesando ? <Loader2 size={24} className="animate-spin text-tinta" aria-hidden /> : <span className="flex size-11 items-center justify-center rounded-full bg-tinte text-tinta">{compacta ? <ImagePlus size={20} strokeWidth={1.75} aria-hidden /> : <UploadCloud size={22} strokeWidth={1.75} aria-hidden />}</span>}
      <span className="text-sm font-medium">{procesando ? 'Procesando…' : compacta ? 'Agregar' : 'Agregar fotos'}</span>
      {!compacta && <span className="text-xs text-texto-suave">Tocá para elegir o arrastrá las imágenes acá</span>}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => agregar([...e.target.files])} />
      {fotos.length === 0 ? (
        zona()
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f, i) => (
            <li key={f.key} className="group relative overflow-hidden rounded-tarjeta ring-1 ring-borde">
              <Foto foto={f} alt={`Foto ${i + 1}`} className="aspect-[3/4] w-full" />
              {i === 0 && <Badge tono="tinta" className="absolute left-2 top-2 shadow-boton">Principal</Badge>}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/45 to-transparent p-2 pt-6">
                <button type="button" aria-label={`Mover foto ${i + 1} antes`} disabled={i === 0} onClick={() => mover(i, -1)} className={BOTON}><ArrowLeft size={16} strokeWidth={2} aria-hidden /></button>
                <button type="button" aria-label={`Quitar foto ${i + 1}`} onClick={() => quitar(i)} className={cn(BOTON, 'text-error')}><Trash2 size={16} strokeWidth={2} aria-hidden /></button>
                <button type="button" aria-label={`Mover foto ${i + 1} después`} disabled={i === fotos.length - 1} onClick={() => mover(i, 1)} className={BOTON}><ArrowRight size={16} strokeWidth={2} aria-hidden /></button>
              </div>
            </li>
          ))}
          <li>{zona(true)}</li>
        </ul>
      )}
      {fallos.length > 0 && <p role="alert" className="text-sm text-error">{fallos.join(' ')}</p>}
    </div>
  )
}
