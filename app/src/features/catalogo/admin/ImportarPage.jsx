import { useRef, useState } from 'react'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/index.js'
import { productos } from '../../../data/repos/index.js'
import { comprimirImagen } from '../../../lib/imagen.js'
import { agruparFotos } from './importar.js'
import { ImportarProductosExcel } from './ImportarProductos.jsx'

function PasoExcel() {
  return (
    <section aria-labelledby="p1" className="flex flex-col gap-3 rounded-tarjeta border border-borde/70 bg-superficie shadow-tarjeta p-4">
      <h2 id="p1" className="text-lg">1. Productos desde Excel</h2>
      <p className="text-sm text-texto-suave">Columnas: código, nombre, categoría, precio por docena en US$ y color (uno solo, opcional). Si el código ya existe se actualiza; si no, se crea.</p>
      <ImportarProductosExcel />
    </section>
  )
}

function PasoFotos() {
  const input = useRef(null)
  const [trabajando, setTrabajando] = useState(false)
  const [res, setRes] = useState(null)

  const subir = async (archivos) => {
    if (archivos.length === 0) return
    setTrabajando(true)
    setRes(null)
    const { grupos, sinMatch } = agruparFotos(archivos, await productos.listar({ soloActivos: false }))
    const out = { productos: 0, fotos: 0, sinMatch, errores: [] }
    for (const g of grupos) {
      try {
        const fotos = []
        for (const { archivo } of g.archivos) fotos.push({ ruta: '', blob: await comprimirImagen(archivo) })
        const p = await productos.obtener(g.producto.id)
        await productos.actualizar(p.id, { ...p, fotos, colores: p.colores.slice(0, 1).map(({ id, nombre, hex }) => ({ id, nombre, hex })) })
        out.productos++
        out.fotos += fotos.length
      } catch (e) {
        out.errores.push(`${g.producto.codigo}: ${e.message}`)
      }
    }
    setRes(out)
    setTrabajando(false)
    if (input.current) input.current.value = ''
  }

  return (
    <section aria-labelledby="p2" className="flex flex-col gap-3 rounded-tarjeta border border-borde/70 bg-superficie shadow-tarjeta p-4">
      <h2 id="p2" className="text-lg">2. Fotos en lote</h2>
      <p className="text-sm text-texto-suave">Nombrá cada archivo con el código del producto: <strong>MN-005_1.jpg</strong>, <strong>MN-005_2.jpg</strong>… (el número define el orden; la primera es la principal). Las fotos reemplazan a las que ya tenga el producto, que debe existir.</p>
      <Button icono={ImagePlus} cargando={trabajando} className="self-start" onClick={() => input.current?.click()}>Elegir fotos</Button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => subir([...e.target.files])} />
      {res && (
        <div role="status" className="rounded-control bg-superficie-2 p-3 text-sm">
          Se cargaron {res.fotos} fotos en {res.productos} productos.
          {res.sinMatch.length > 0 && <span className="block text-alerta">Sin producto con ese código: {res.sinMatch.join(', ')}</span>}
          {res.errores.map((e) => <span key={e} className="block text-error">{e}</span>)}
        </div>
      )}
    </section>
  )
}

export default function ImportarPage() {
  return (
    <div className="flex flex-col gap-5">
      <Link to="/catalogo/admin" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave">
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver a productos
      </Link>
      <h1 className="text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">Carga masiva</h1>
      <PasoExcel />
      <PasoFotos />
    </div>
  )
}
