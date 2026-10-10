import { useRef, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Badge, Button, Modal } from '../../../components/ui/index.js'
import { productos } from '../../../data/repos/index.js'
import { descargarArchivo } from '../../../lib/excel.js'
import { AYUDA_COLUMNAS, crearPlantilla, EJEMPLOS, ejecutar, leerExcel, planificar } from './importar.js'

const ACCION = { crear: ['exito', 'Se crea'], actualizar: ['info', 'Se actualiza'], error: ['error', 'Con error'] }
const TABLA = 'max-h-80 overflow-auto rounded-control border border-borde'

// Productos desde Excel: plantilla → elegir archivo → revisar qué pasa con cada fila → importar.
// conEjemplo: muestra la planilla de ejemplo y qué va en cada columna (en el modal).
export function ImportarProductosExcel({ conEjemplo = false }) {
  const input = useRef(null)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const bajarPlantilla = async () => descargarArchivo(await crearPlantilla(), 'plantilla-productos.xlsx')

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
    <div className="flex flex-col gap-3">
      {conEjemplo && !plan && !resultado && (
        <>
          <p className="text-sm text-texto-suave">Descargá la planilla, reemplazá las filas de ejemplo por tus productos (una fila por producto) y subila. Si un código ya existe, ese producto se actualiza.</p>
          <div className={TABLA}>
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-superficie-2">
                <tr>{AYUDA_COLUMNAS.map(([c]) => <th key={c} className="whitespace-nowrap p-2 font-mono text-xs">{c}</th>)}</tr>
              </thead>
              <tbody>
                {EJEMPLOS.map((f) => (
                  <tr key={f.codigo} className="border-t border-borde text-texto-suave">
                    <td className="p-2 tabular-nums">{f.codigo}</td>
                    <td className="p-2">{f.nombre}</td>
                    <td className="p-2">{f.categoria}</td>
                    <td className="p-2 tabular-nums">{String(f.precio).replace('.', ',')}</td>
                    <td className="p-2">{f.colores}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-1 text-xs text-texto-suave">
            {AYUDA_COLUMNAS.map(([c, t]) => <li key={c}><strong className="font-mono text-texto">{c}</strong>: {t}</li>)}
          </ul>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" icono={Download} onClick={bajarPlantilla}>{conEjemplo ? 'Descargar planilla de ejemplo' : 'Descargar plantilla'}</Button>
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
          <div className={TABLA}>
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
    </div>
  )
}

export function ModalImportarProductos({ abierto, onCerrar }) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} cerrarConFondo={false} titulo="Carga de productos" ancho="w-[min(96vw,48rem)]">
      {abierto && <ImportarProductosExcel conEjemplo />}
    </Modal>
  )
}
