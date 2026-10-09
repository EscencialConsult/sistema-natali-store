import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react'
import { Badge, Button } from '../../../components/ui/index.js'
import { comprimirImagen } from '../../../lib/imagen.js'
import { nuevoId } from '../../../lib/id.js'
import Foto from '../Foto.jsx'

// fotos: [{ key, ruta, blob }]. La primera es la principal. Se comprimen en el navegador al elegirlas.
export default function FotosEditor({ fotos, onChange }) {
  const input = useRef(null)
  const [procesando, setProcesando] = useState(false)
  const [fallos, setFallos] = useState([])

  const agregar = async (archivos) => {
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

  return (
    <section aria-labelledby="fotos-t" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="fotos-t" className="text-lg">Fotos</h2>
        <Button variante="secundario" icono={ImagePlus} cargando={procesando} onClick={() => input.current?.click()}>Agregar fotos</Button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => agregar([...e.target.files])} />
      </div>
      {fotos.length === 0 && <p className="rounded-control border border-dashed border-borde-fuerte p-6 text-center text-sm text-texto-suave">Todavía no hay fotos. La primera que cargues será la principal.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fotos.map((f, i) => (
          <li key={f.key} className="flex flex-col gap-1.5">
            <div className="relative">
              <Foto foto={f} alt={`Foto ${i + 1}`} className="aspect-[3/4] w-full rounded-tarjeta border border-borde" />
              {i === 0 && <Badge tono="tinta" className="absolute left-1.5 top-1.5">Principal</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" aria-label="Mover antes" disabled={i === 0} onClick={() => mover(i, -1)} className="flex size-11 items-center justify-center rounded-control hover:bg-superficie-2 disabled:opacity-30"><ArrowLeft size={18} strokeWidth={1.75} aria-hidden /></button>
              <button type="button" aria-label="Quitar foto" onClick={() => quitar(i)} className="flex size-11 items-center justify-center rounded-control text-error hover:bg-error-fondo"><Trash2 size={18} strokeWidth={1.75} aria-hidden /></button>
              <button type="button" aria-label="Mover después" disabled={i === fotos.length - 1} onClick={() => mover(i, 1)} className="flex size-11 items-center justify-center rounded-control hover:bg-superficie-2 disabled:opacity-30"><ArrowRight size={18} strokeWidth={1.75} aria-hidden /></button>
            </div>
          </li>
        ))}
      </ul>
      {fallos.length > 0 && <p role="alert" className="text-sm text-error">{fallos.join(' ')}</p>}
    </section>
  )
}
