import { useMemo, useState } from 'react'
import { Banknote, Landmark, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, EmptyState, ErrorState, Input, Modal, Skeleton, useToast } from '../../components/ui/index.js'
import { useBusquedaCodigo, useConfig, useProductos, useStockResumen } from '../../data/hooks.js'
import { ventas } from '../../data/repos/index.js'
import { cn } from '../../lib/cn.js'
import { formatear, META_MONEDA, MONEDAS } from '../../lib/moneda.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import FilaResultado from '../catalogo/FilaResultado.jsx'
import AgregarSheet from './AgregarSheet.jsx'
import { lineasSinStock, precioDocena, tipoCambioDe, totalDeLineas } from './calculos.js'
import LineaVenta from './LineaVenta.jsx'
import { borrarBorrador, useCarrito } from './useCarrito.js'

const PAGOS = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: Banknote },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: Landmark },
]

function Opcion({ activa, onClick, children, icono: Icono }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={cn(
        'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-control border px-2 text-base font-medium',
        activa ? 'border-tinta bg-tinta text-sobre-tinta' : 'border-borde-fuerte bg-superficie hover:bg-superficie-2',
      )}
    >
      {Icono && <Icono size={20} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}

export default function NuevaVentaPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const avisar = useToast()
  const { estado, despachar, recuperado } = useCarrito(usuario.id)
  const [buscando, setBuscando] = useState('')
  const [eligiendo, setEligiendo] = useState(location.state?.productoId ?? null)
  const [confirmando, setConfirmando] = useState(false)
  const [errorVenta, setErrorVenta] = useState('')
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false)
  const [pidiendoVaciar, setPidiendoVaciar] = useState(false)

  const cfg = useConfig()
  const todos = useProductos({ soloActivos: false })
  const stock = useStockResumen()
  const resultados = useBusquedaCodigo(buscando.trim(), 6)

  const mapa = useMemo(() => new Map((todos.datos ?? []).map((p) => [p.id, p])), [todos.datos])
  const tc = cfg.datos?.tipo_cambio
  const puedeEditarPrecio = puede(usuario.rol, 'precio.editar')

  const lineas = estado.lineas.filter((l) => mapa.has(l.productoId))
  const precios = useMemo(() => {
    if (!tc) return new Map()
    return new Map(lineas.map((l) => [l.key, precioDocena({ precioUsdCent: mapa.get(l.productoId).precio_docena_usd_cent, moneda: estado.moneda, tc, manualCent: l.manualCent })]))
  }, [lineas, mapa, tc, estado.moneda])
  const total = totalDeLineas(lineas.map((l) => ({ cantidad: l.cantidad, precioCent: precios.get(l.key) ?? 0 })))
  const docenas = lineas.reduce((t, l) => t + l.cantidad, 0)

  if (cfg.cargando || todos.cargando || stock.cargando) return <Skeleton className="h-64" />
  if (cfg.error || todos.error || stock.error) return <ErrorState mensaje="No pudimos preparar la venta." onReintentar={() => { cfg.reintentar(); todos.reintentar(); stock.reintentar() }} />

  const agregar = (linea) => {
    despachar({ tipo: 'agregar', linea })
    setEligiendo(null)
    setBuscando('')
    avisar('Agregado a la venta', 'exito')
  }

  const confirmar = async () => {
    setPidiendoConfirmacion(false)
    setErrorVenta('')
    setConfirmando(true)
    try {
      const venta = await ventas.crear({
        vendedor_id: usuario.id,
        moneda: estado.moneda,
        tipo_cambio: tipoCambioDe(estado.moneda, tc),
        metodo_pago: estado.metodo_pago,
        cliente_nombre: estado.cliente_nombre,
        cliente_telefono: estado.cliente_telefono,
        items: lineas.map((l) => ({ producto_id: l.productoId, color_id: l.colorId, cantidad: l.cantidad, unidad: 'docena', precio_cent: precios.get(l.key) })),
      })
      borrarBorrador(usuario.id)
      navigate(`/ventas/${venta.id}`, { replace: true, state: { nueva: true } })
    } catch (e) {
      setErrorVenta(e.message)
      setConfirmando(false)
    }
  }

  const alConfirmar = () => {
    if (lineasSinStock(lineas, stock.datos).length > 0) setPidiendoConfirmacion(true)
    else confirmar()
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-2xl md:text-3xl">Nueva venta</h1>
      {recuperado && lineas.length > 0 && <p role="status" className="rounded-control bg-info-fondo p-3 text-sm text-info">Recuperamos la venta que tenías a medias.</p>}

      <section aria-labelledby="moneda" className="flex flex-col gap-2">
        <h2 id="moneda" className="text-lg">Moneda de la venta</h2>
        <div className="flex gap-2">
          {MONEDAS.map((m) => (
            <Opcion key={m} activa={estado.moneda === m} onClick={() => despachar({ tipo: 'moneda', moneda: m })}>
              <span className="text-lg">{META_MONEDA[m].simbolo}</span>
              <span className="text-xs font-normal opacity-80">{META_MONEDA[m].nombre}</span>
            </Opcion>
          ))}
        </div>
        {estado.moneda !== 'usd' && tc && <p className="text-sm text-texto-suave tabular-nums">1 US$ = {META_MONEDA[estado.moneda].simbolo} {String(tc[estado.moneda]).replace('.', ',')}{tc.ejemplo && ' (tipo de cambio de ejemplo)'}</p>}
      </section>

      <section aria-labelledby="prod" className="flex flex-col gap-3">
        <h2 id="prod" className="text-lg">Productos</h2>
        <div role="search" className="relative">
          <label htmlFor="buscar-venta" className="sr-only">Buscar producto por código</label>
          <Search size={20} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-tenue" />
          <input
            id="buscar-venta"
            type="search"
            autoComplete="off"
            autoCapitalize="characters"
            value={buscando}
            onChange={(e) => setBuscando(e.target.value)}
            placeholder="Código del modelo (ej. MN-005 o 5)"
            className="min-h-12 w-full rounded-control border border-borde-fuerte bg-superficie pl-12 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {buscando && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => setBuscando('')} className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-texto-suave">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>
        {buscando.trim() && resultados.datos?.length === 0 && <p className="text-sm text-texto-suave">No hay ningún modelo “{buscando.trim()}”.</p>}
        {buscando.trim() && resultados.datos?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {resultados.datos.map((p) => <li key={p.id}><FilaResultado producto={p} onAbrir={(x) => setEligiendo(x.id)} mostrarPrecio={false} /></li>)}
          </ul>
        )}

        {lineas.length === 0 ? (
          <div className="rounded-tarjeta border border-dashed border-borde-fuerte bg-superficie">
            <EmptyState icono={ShoppingBag} titulo="Todavía no agregaste productos" texto="Buscá un modelo por su código y elegí color y docenas." />
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {lineas.map((l) => (
              <LineaVenta
                key={l.key}
                linea={l}
                producto={mapa.get(l.productoId)}
                precioCent={precios.get(l.key) ?? 0}
                moneda={estado.moneda}
                stockColor={stock.datos[l.colorId] ?? 0}
                puedeEditarPrecio={puedeEditarPrecio}
                onCantidad={(n) => despachar({ tipo: 'cantidad', key: l.key, cantidad: n })}
                onPrecio={(cent) => despachar({ tipo: 'precio_manual', key: l.key, cent })}
                onQuitar={() => despachar({ tipo: 'quitar', key: l.key })}
              />
            ))}
          </ul>
        )}
        {lineas.length > 0 && (
          <button type="button" onClick={() => setPidiendoVaciar(true)} className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-texto-suave underline">
            <Trash2 size={14} strokeWidth={1.75} aria-hidden /> Vaciar la venta
          </button>
        )}
      </section>

      <section aria-labelledby="cli" className="flex flex-col gap-3">
        <h2 id="cli" className="text-lg">Cliente <span className="text-sm font-normal text-texto-suave">(opcional)</span></h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input etiqueta="Nombre" value={estado.cliente_nombre} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_nombre', valor: e.target.value })} autoComplete="off" />
          <Input etiqueta="Teléfono (para enviarle la nota)" inputMode="tel" value={estado.cliente_telefono} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_telefono', valor: e.target.value })} autoComplete="off" />
        </div>
      </section>

      <section aria-labelledby="pago" className="flex flex-col gap-2">
        <h2 id="pago" className="text-lg">Forma de pago</h2>
        <div className="flex gap-2">
          {PAGOS.map((p) => <Opcion key={p.valor} icono={p.icono} activa={estado.metodo_pago === p.valor} onClick={() => despachar({ tipo: 'campo', campo: 'metodo_pago', valor: p.valor })}>{p.etiqueta}</Opcion>)}
        </div>
      </section>

      {errorVenta && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{errorVenta}</p>}

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex items-center justify-between gap-3 border-t border-borde bg-superficie px-4 py-3 md:bottom-0 md:mx-0 md:rounded-control md:border">
        <div>
          <p className="text-xs text-texto-suave">{docenas} {docenas === 1 ? 'docena' : 'docenas'}</p>
          <p className="whitespace-nowrap text-2xl font-semibold tabular-nums" aria-live="polite">{formatear(total, estado.moneda)}</p>
        </div>
        <Button cargando={confirmando} deshabilitado={lineas.length === 0} onClick={alConfirmar} className="whitespace-nowrap">Confirmar venta</Button>
      </div>

      <AgregarSheet productoId={eligiendo} moneda={estado.moneda} onCerrar={() => setEligiendo(null)} onAgregar={agregar} />

      <Modal abierto={pidiendoConfirmacion} onCerrar={() => setPidiendoConfirmacion(false)} titulo="Stock insuficiente">
        <p className="mb-4 text-sm text-texto-suave">Algún color tiene menos prendas que las pedidas. Si confirmás, el stock de ese color quedará en negativo hasta que se cargue mercadería. ¿Confirmar igual?</p>
        <div className="flex gap-2">
          <Button onClick={confirmar}>Sí, confirmar</Button>
          <Button variante="fantasma" onClick={() => setPidiendoConfirmacion(false)}>Revisar</Button>
        </div>
      </Modal>
      <Modal abierto={pidiendoVaciar} onCerrar={() => setPidiendoVaciar(false)} titulo="¿Vaciar la venta?">
        <p className="mb-4 text-sm text-texto-suave">Se borran los productos y los datos del cliente de esta venta.</p>
        <div className="flex gap-2">
          <Button variante="peligro" onClick={() => { despachar({ tipo: 'vaciar' }); setPidiendoVaciar(false) }}>Sí, vaciar</Button>
          <Button variante="fantasma" onClick={() => setPidiendoVaciar(false)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  )
}
