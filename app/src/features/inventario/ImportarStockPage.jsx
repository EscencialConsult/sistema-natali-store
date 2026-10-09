import { useRef, useState } from 'react'
import { ChevronLeft, Download, FileSpreadsheet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '../../components/ui/index.js'
import { productos, stock } from '../../data/repos/index.js'
import { useAuth } from '../auth/AuthContext.js'
import { crearPlantillaStock, ejecutarStock, leerExcelStock, planificarStock } from './importarStock.js'

const ACCION = { ajustar: ['info', 'Se ajusta'], sin_cambio: ['neutro', 'Sin cambio'], error: ['error', 'Con error'] }

export default function ImportarStockPage() {
  const { usuario } = useAuth()
  const input = useRef(null)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const bajar = async () => {
    const [lista, actual] = await Promise.all([productos.listar(), stock.resumen()])
    const blob = await crearPlantillaStock(lista, actual)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stock-actual.xlsx'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const elegir = async (archivo) => {
    if (!archivo) return
    setError('')
    setResultado(null)
    setPlan(null)
    setTrabajando(true)
    try {
      const filas = await leerExcelStock(await archivo.arrayBuffer())
      if (filas.length === 0) throw new Error('El archivo no tiene filas para importar.')
      const [lista, actual] = await Promise.all([productos.listar({ soloActivos: false }), stock.resumen()])
      setPlan(planificarStock(filas, lista, actual))
    } catch (e) {
      setError(e.message)
    } finally {
      setTrabajando(false)
      if (input.current) input.current.value = ''
    }
  }

  const aplicar = async () => {
    setTrabajando(true)
    setResultado(await ejecutarStock(plan, usuario.id))
    setPlan(null)
    setTrabajando(false)
  }

  const cuenta = (a) => plan?.filter((p) => p.accion === a).length ?? 0

  return (
    <div className="flex flex-col gap-5">
      <Link to="/stock" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave">
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver al inventario
      </Link>
      <h1 className="text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">Cargar stock desde Excel</h1>
      <section className="flex flex-col gap-3 rounded-tarjeta border border-borde/70 bg-superficie shadow-tarjeta p-4">
        <p className="text-sm text-texto-suave">Descargá la planilla con el stock actual, corregí la columna <strong>unidades</strong> con lo que hay de verdad (conteo real) y subila. El sistema registra la diferencia como un ajuste, con su historial.</p>
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" icono={Download} onClick={bajar}>Descargar planilla con el stock actual</Button>
          <Button icono={FileSpreadsheet} cargando={trabajando && !plan} onClick={() => input.current?.click()}>Elegir archivo Excel</Button>
          <input ref={input} type="file" accept=".xlsx" hidden onChange={(e) => elegir(e.target.files[0])} />
        </div>
        {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}

        {plan && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" aria-live="polite">
              <Badge tono="info">{cuenta('ajustar')} a ajustar</Badge>
              <Badge>{cuenta('sin_cambio')} sin cambio</Badge>
              <Badge tono={cuenta('error') ? 'error' : 'neutro'}>{cuenta('error')} con error</Badge>
            </div>
            <div className="max-h-80 overflow-auto rounded-control border border-borde">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-superficie-2"><tr><th className="p-2">Fila</th><th className="p-2">Producto y color</th><th className="p-2 text-right">Ahora → Nuevo</th><th className="p-2">Resultado</th></tr></thead>
                <tbody>
                  {plan.filter((p) => p.accion !== 'sin_cambio').map((p) => (
                    <tr key={p.fila} className="border-t border-borde align-top">
                      <td className="p-2 tabular-nums">{p.fila}</td>
                      <td className="p-2">{p.codigo} · {p.color}{p.errores.length > 0 && <span className="block text-error">{p.errores.join(' ')}</span>}</td>
                      <td className="p-2 text-right tabular-nums">{p.accion === 'ajustar' ? `${p.actual} → ${p.nuevo} (${p.delta > 0 ? '+' : ''}${p.delta})` : '—'}</td>
                      <td className="p-2"><Badge tono={ACCION[p.accion][0]}>{ACCION[p.accion][1]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button cargando={trabajando} deshabilitado={cuenta('ajustar') === 0} onClick={aplicar}>Aplicar {cuenta('ajustar')} ajustes</Button>
            {cuenta('error') > 0 && <p className="text-sm text-texto-suave">Las filas con error no se aplican; corregilas y volvé a subir.</p>}
          </div>
        )}
        {resultado && <p role="status" className="rounded-control bg-exito-fondo p-3 text-sm text-exito">Listo: {resultado.ajustados} ajustes registrados.</p>}
      </section>
    </div>
  )
}
