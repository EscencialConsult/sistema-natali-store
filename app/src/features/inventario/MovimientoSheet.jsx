import { useState } from 'react'
import { Button, Chip, ErrorState, Input, Sheet, Skeleton, useToast } from '../../components/ui/index.js'
import { useConfig, useConsulta, usePerfiles, useProducto, useStockDe } from '../../data/hooks.js'
import { stock } from '../../data/repos/index.js'
import { aPrendas, leerDocenas, textoDocenas } from '../../lib/docenas.js'
import { fechaCorta } from '../../lib/fechas.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import ColorStock from '../catalogo/ColorStock.jsx'

const TIPOS = [
  { valor: 'entrada', etiqueta: 'Entrada (llegó mercadería)' },
  { valor: 'salida', etiqueta: 'Salida (merma / pérdida)' },
  { valor: 'ajuste', etiqueta: 'Ajuste (conteo real)' },
]
const ETIQUETA_TIPO = { entrada: 'Entrada', salida: 'Salida', venta: 'Venta', anulacion: 'Anulación', ajuste: 'Ajuste', saldo: 'Saldo de cierre' }

function Contenido({ productoId }) {
  const { usuario } = useAuth()
  const avisar = useToast()
  const prod = useProducto(productoId)
  const stockProd = useStockDe(productoId)
  const cfg = useConfig()
  const equipo = usePerfiles({ soloActivos: false })
  const movs = useConsulta(async () => (await stock.movimientos(productoId)).sort((a, b) => b.creado_en.localeCompare(a.creado_en)).slice(0, 40), [productoId])
  const [tipo, setTipo] = useState('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  if (prod.cargando || stockProd.cargando || cfg.cargando) return <Skeleton className="h-64" />
  if (prod.error || !prod.datos) return <ErrorState mensaje="No pudimos cargar el inventario de este producto." onReintentar={prod.reintentar} />
  const p = prod.datos
  const actual = stockProd.datos ?? 0
  const quien = new Map((equipo.datos ?? []).map((x) => [x.id, x.nombre]))

  const registrar = async (e) => {
    e.preventDefault()
    setError('')
    const leida = leerDocenas(cantidad, { permitirCero: tipo === 'ajuste' })
    if (leida.error) return setError(leida.error)
    // Se ingresa en docenas; el stock se guarda en prendas.
    const n = aPrendas(leida.docenas)
    if (tipo !== 'entrada' && !motivo.trim()) return setError('Indicá el motivo.')
    if (tipo === 'salida' && n > actual) return setError(`Solo hay ${textoDocenas(actual, { corto: false })} de este producto.`)
    const delta = tipo === 'ajuste' ? n - actual : n
    if (tipo === 'ajuste' && delta === 0) return setError('El conteo coincide con el stock actual: no hay nada que ajustar.')
    setGuardando(true)
    try {
      await stock.registrarMovimiento({ producto_id: p.id, color_id: p.colores[0]?.id ?? null, tipo, delta, motivo: motivo.trim() || (tipo === 'entrada' ? 'Ingreso de mercadería' : ''), usuario_id: usuario.id })
      avisar('Movimiento registrado', 'exito')
      setCantidad('')
      setMotivo('')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold tabular-nums">{p.codigo}</p>
        <p className="text-lg">{p.nombre}</p>
      </div>

      {puede(usuario.rol, 'stock.mover') ? (
        <form onSubmit={registrar} noValidate className="flex flex-col gap-3 rounded-tarjeta border border-borde p-3">
          <h3 className="text-base">Registrar movimiento</h3>
          <ColorStock colores={p.colores} stock={actual} umbral={cfg.datos.stock_bajo_unidades} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de movimiento">
            {TIPOS.map((t) => <Chip key={t.valor} activo={tipo === t.valor} onClick={() => setTipo(t.valor)}>{t.etiqueta}</Chip>)}
          </div>
          <Input
            etiqueta={tipo === 'ajuste' ? 'Docenas que hay en total (conteo real)' : 'Cantidad de docenas'}
            inputMode="decimal"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value.replace(/[^\d.,]/g, ''))}
            ayuda={`${tipo === 'ajuste' ? `Ahora el sistema dice ${textoDocenas(actual, { corto: false })}. ` : ''}Docenas o medias docenas (ej. 1, 1,5, 2).`}
          />
          <Input etiqueta={tipo === 'entrada' ? 'Motivo (opcional)' : 'Motivo (obligatorio)'} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <Button type="submit" cargando={guardando} className="self-start">Registrar</Button>
        </form>
      ) : (
        <section className="flex flex-col gap-2"><h3 className="text-base">Stock</h3><ColorStock colores={p.colores} stock={actual} umbral={cfg.datos.stock_bajo_unidades} /></section>
      )}

      <section aria-label="Historial" className="flex flex-col gap-2">
        <h3 className="text-base">Últimos movimientos</h3>
        {movs.datos?.length === 0 && <p className="text-sm text-texto-suave">Todavía no hay movimientos.</p>}
        <ul className="flex flex-col divide-y divide-borde rounded-control border border-borde">
          {movs.datos?.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 p-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{ETIQUETA_TIPO[m.tipo]}</p>
                <p className="truncate text-texto-suave">{m.motivo || '—'} · {quien.get(m.usuario_id) ?? 'Sistema'} · {fechaCorta(m.creado_en)}</p>
              </div>
              <span className={m.delta < 0 ? 'font-semibold tabular-nums text-error' : 'font-semibold tabular-nums text-exito'}>{m.delta > 0 ? '+' : ''}{textoDocenas(m.delta)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function MovimientoSheet({ productoId, onCerrar }) {
  return (
    <Sheet abierto={!!productoId} onCerrar={onCerrar} titulo="Inventario" className="sm:w-[min(94vw,40rem)]">
      {productoId && <Contenido key={productoId} productoId={productoId} />}
    </Sheet>
  )
}
