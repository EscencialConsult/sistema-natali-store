import { useRef, useState } from 'react'
import { ChevronLeft, Download, FileSpreadsheet, ImagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../../../components/ui/index.js'
import { productos } from '../../../data/repos/index.js'
import { comprimirImagen } from '../../../lib/imagen.js'
import { agruparFotos, crearPlantilla, ejecutar, leerExcel, planificar } from './importar.js'

const ACCION = { crear: ['exito', 'Se crea'], actualizar: ['info', 'Se actualiza'], error: ['error', 'Con error'] }

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function PasoExcel() {
  const input = useRef(null)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const bajarPlantilla = async () => {
    const todos = await productos.listar()
    const ejemplos = todos.slice(0, 3).map((p) => ({ codigo: p.codigo, nombre: p.nombre, categoria: 'LINO', precio: p.precio_docena_usd_cent / 100, colores: p.colores.map((c) => c.nombre).join(', ') }))
    descargar(await crearPlantilla(ejemplos), 'plantilla-productos.xlsx')
  }

  const elegir = async (archivo) => {
    if (!archivo) return
    setError('')
    setResultado(null)
    setPlan(null)
    setTrabajando(true)
    try {
      const filas = await leerExcel(await archivo.arrayBuffer())
      if (filas.length === 0) throw new Error('El archivo no tiene productos para importar.')
      const existentes = new Map((await productos.listar({ soloActivos: false })).map((p) => [p.codigo, p]))
      setPlan(planificar(filas, existentes))
    } catch (e) {
      setError(e.message)
    } finally {
      setTrabajando(false)
      if (input.current) input.current.value = ''
    }
  }

  const importar = async () => {
    setTrabajando(true)
    setResultado(await ejecutar(plan))
    setPlan(null)
    setTrabajando(false)
  }

  const cuenta = (a) => plan?.filter((p) => p.accion === a).length ?? 0
  const validos = cuenta('crear') + cuenta('actualizar')

  return (
    <section aria-labelledby="p1" className="flex flex-col gap-3 rounded-tarjeta border border-borde/70 bg-superficie shadow-tarjeta p-4">
      <h2 id="p1" className="text-lg">1. Productos desde Excel</h2>
      <p className="text-sm text-texto-suave">Columnas: código, nombre, categoría, precio por docena en US$ y colores separados por coma. Si el código ya existe se actualiza (los colores existentes se conservan); si no, se crea.</p>
      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" icono={Download} onClick={bajarPlantilla}>Descargar plantilla</Button>
        <Button icono={FileSpreadsheet} cargando={trabajando && !plan} onClick={() => input.current?.click()}>Elegir archivo Excel</Button>
        <input ref={input} type="file" accept=".xlsx" hidden onChange={(e) => elegir(e.target.files[0])} />
      </div>
      {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}

      {plan && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" aria-live="polite">
            <Badge tono="exito">{cuenta('crear')} nuevos</Badge>
            <Badge tono="info">{cuenta('actualizar')} a actualizar</Badge>
            <Badge tono={cuenta('error') ? 'error' : 'neutro'}>{cuenta('error')} con error</Badge>
          </div>
          <div className="max-h-80 overflow-auto rounded-control border border-borde">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-superficie-2"><tr><th className="p-2">Fila</th><th className="p-2">Código</th><th className="p-2">Nombre</th><th className="p-2">Resultado</th></tr></thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.fila} className="border-t border-borde align-top">
                    <td className="p-2 tabular-nums">{p.fila}</td>
                    <td className="p-2 font-medium tabular-nums">{p.datos.codigo || '—'}</td>
                    <td className="p-2">{p.datos.nombre || '—'}{p.errores.length > 0 && <span className="block text-error">{p.errores.join(' ')}</span>}</td>
                    <td className="p-2"><Badge tono={ACCION[p.accion][0]}>{ACCION[p.accion][1]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button cargando={trabajando} deshabilitado={validos === 0} onClick={importar}>Importar {validos} productos</Button>
          {cuenta('error') > 0 && <p className="text-sm text-texto-suave">Las filas con error no se importan; corregilas en el Excel y volvé a subirlo.</p>}
        </div>
      )}

      {resultado && (
        <div role="status" className="rounded-control bg-exito-fondo p-3 text-sm text-exito">
          Listo: {resultado.creados} creados, {resultado.actualizados} actualizados, {resultado.errores.length} con error.
          {resultado.errores.map((e) => <span key={e.fila} className="block text-error">Fila {e.fila}: {e.mensaje}</span>)}
        </div>
      )}
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
        await productos.actualizar(p.id, { ...p, fotos, colores: p.colores.map(({ id, nombre, hex }) => ({ id, nombre, hex })) })
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
