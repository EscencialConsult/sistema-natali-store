import { useMemo, useState } from 'react'
import { Banknote, CreditCard, Hand, Home, Landmark, ShoppingBag, Store, Trash2, Truck, User } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, CampoBusqueda, Encabezado, EmptyState, ErrorState, Input, Modal, Skeleton, TARJETA, useToast } from '../../components/ui/index.js'
import { useBusquedaCodigo, useConfig, useProductos, useStockResumen } from '../../data/hooks.js'
import { ventas } from '../../data/repos/index.js'
import { cn } from '../../lib/cn.js'
import { METODOS_ENTREGA } from '../../lib/entrega.js'
import { formatear, META_MONEDA, MONEDAS } from '../../lib/moneda.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import FilaResultado from '../catalogo/FilaResultado.jsx'
import AgregarSheet from './AgregarSheet.jsx'
import { lineasSinStock, precioDocena, textoCantidad, tipoCambioDe, totalDeLineas } from './calculos.js'
import LineaVenta from './LineaVenta.jsx'
import { borrarBorrador, useCarrito } from './useCarrito.js'

const PAGOS = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: Banknote },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: Landmark },
]

const ICONO_ENTREGA = { personal: Hand, tienda: Store, domicilio: Home, envio: Truck }

function Opcion({ activa, onClick, children, icono: Icono }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={cn(
        'flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 rounded-control border px-2 text-base font-medium transition-[background-color,border-color,box-shadow] duration-150',
        activa ? 'border-tinta bg-tinte text-sobre-tinte ring-2 ring-tinta/20' : 'border-borde-fuerte bg-superficie text-texto hover:border-texto-tenue',
      )}
    >
      {Icono && <Icono size={20} strokeWidth={1.75} aria-hidden />}
      {children}
    </button>
  )
}

function Paso({ n, titulo, id, extra }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5 text-base sm:text-lg">
      <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-tinta font-cuerpo text-xs font-semibold text-sobre-tinta">{n}</span>
      {titulo}
      {extra && <span className="text-sm font-normal text-texto-suave">{extra}</span>}
    </h2>
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
        cliente_email: estado.cliente_email,
        cliente_direccion: estado.cliente_direccion,
        metodo_entrega: estado.metodo_entrega,
        // Sin color: la venta usa el color del producto (un borrador viejo pudo guardar un color que ya no existe).
        items: lineas.map((l) => ({ producto_id: l.productoId, color_id: null, cantidad: l.cantidad, unidad: 'docena', precio_cent: precios.get(l.key) })),
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
    <div className="flex flex-col gap-6">
      <Encabezado titulo="Nueva venta" descripcion="Agregá los modelos, elegí moneda y forma de pago, y confirmá." />
      {recuperado && lineas.length > 0 && <p role="status" className="rounded-control bg-info-fondo p-3 text-sm text-info">Recuperamos la venta que tenías a medias.</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="prod" className={cn(TARJETA, 'flex flex-col gap-4 p-4 sm:p-5')}>
            <Paso n={1} id="prod" titulo="Productos" extra={lineas.length > 0 && `· ${lineas.length} ${lineas.length === 1 ? 'línea' : 'líneas'}`} />
            <CampoBusqueda id="buscar-venta" etiqueta="Buscar producto por código" autoCapitalize="characters" valor={buscando} onCambiar={setBuscando} placeholder="Código del modelo (ej. MN-005 o 5)" />
            {buscando.trim() && resultados.datos?.length === 0 && <p className="text-sm text-texto-suave">No hay ningún modelo “{buscando.trim()}”.</p>}
            {buscando.trim() && resultados.datos?.length > 0 && (
              <ul className="flex flex-col gap-2">
                {resultados.datos.map((p) => <li key={p.id}><FilaResultado producto={p} onAbrir={(x) => setEligiendo(x.id)} mostrarPrecio={false} /></li>)}
              </ul>
            )}

            {lineas.length === 0 ? (
              <div className="rounded-tarjeta border border-dashed border-borde-fuerte bg-superficie-2/50">
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
                    stockProducto={stock.datos[l.productoId] ?? 0}
                    puedeEditarPrecio={puedeEditarPrecio}
                    onCantidad={(n) => despachar({ tipo: 'cantidad', key: l.key, cantidad: n })}
                    onPrecio={(cent) => despachar({ tipo: 'precio_manual', key: l.key, cent })}
                    onQuitar={() => despachar({ tipo: 'quitar', key: l.key })}
                  />
                ))}
              </ul>
            )}
            {lineas.length > 0 && (
              <button type="button" onClick={() => setPidiendoVaciar(true)} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-control px-2 text-sm font-medium text-texto-suave hover:bg-error-fondo hover:text-error">
                <Trash2 size={16} strokeWidth={1.75} aria-hidden /> Vaciar la venta
              </button>
            )}
          </section>

          <section aria-labelledby="moneda" className={cn(TARJETA, 'flex flex-col gap-3 p-4 sm:p-5')}>
            <Paso n={2} id="moneda" titulo="Moneda de la venta" />
            <div className="flex gap-2">
              {MONEDAS.map((m) => (
                <Opcion key={m} activa={estado.moneda === m} onClick={() => despachar({ tipo: 'moneda', moneda: m })}>
                  <span className="font-titulo text-lg">{META_MONEDA[m].simbolo}</span>
                  <span className="text-xs font-normal opacity-80">{META_MONEDA[m].nombre}</span>
                </Opcion>
              ))}
            </div>
            {estado.moneda !== 'usd' && tc && <p className="text-sm text-texto-suave tabular-nums">1 US$ = {META_MONEDA[estado.moneda].simbolo} {String(tc[estado.moneda]).replace('.', ',')}{tc.ejemplo && ' (tipo de cambio de ejemplo)'}</p>}
          </section>

          <section aria-labelledby="pago" className={cn(TARJETA, 'flex flex-col gap-3 p-4 sm:p-5')}>
            <Paso n={3} id="pago" titulo="Forma de pago" />
            <div className="flex gap-2">
              {PAGOS.map((p) => <Opcion key={p.valor} icono={p.icono} activa={estado.metodo_pago === p.valor} onClick={() => despachar({ tipo: 'campo', campo: 'metodo_pago', valor: p.valor })}>{p.etiqueta}</Opcion>)}
            </div>
          </section>

          <section aria-labelledby="entrega" className={cn(TARJETA, 'flex flex-col gap-3 p-4 sm:p-5')}>
            <Paso n={4} id="entrega" titulo="Método de entrega" extra="(opcional)" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(METODOS_ENTREGA).map(([valor, etiqueta]) => (
                <Opcion key={valor} icono={ICONO_ENTREGA[valor]} activa={estado.metodo_entrega === valor} onClick={() => despachar({ tipo: 'campo', campo: 'metodo_entrega', valor: estado.metodo_entrega === valor ? null : valor })}>{etiqueta}</Opcion>
              ))}
            </div>
          </section>

          <section aria-labelledby="cli" className={cn(TARJETA, 'flex flex-col gap-4 p-4 sm:p-5')}>
            <Paso n={5} id="cli" titulo="Cliente" extra="(opcional)" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input etiqueta="Nombre" value={estado.cliente_nombre} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_nombre', valor: e.target.value })} autoComplete="off" />
              <Input etiqueta="Teléfono (para enviarle la nota)" inputMode="tel" value={estado.cliente_telefono} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_telefono', valor: e.target.value })} autoComplete="off" />
              <Input etiqueta="Correo electrónico (opcional)" type="email" inputMode="email" autoCapitalize="none" value={estado.cliente_email} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_email', valor: e.target.value })} autoComplete="off" />
              <Input etiqueta="Dirección" value={estado.cliente_direccion} onChange={(e) => despachar({ tipo: 'campo', campo: 'cliente_direccion', valor: e.target.value })} autoComplete="off" />
            </div>
          </section>

          {errorVenta && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{errorVenta}</p>}
        </div>

        {/* Celular: barra fija sobre la navegación. Escritorio: resumen fijo a la derecha. */}
        <aside aria-label="Resumen de la venta" className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-borde bg-superficie/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(42_34_48/0.15)] backdrop-blur-md md:bottom-4 md:mx-0 md:rounded-tarjeta md:border md:shadow-elevada lg:top-24 lg:bottom-auto lg:p-5">
          <h2 className="mb-4 hidden text-lg lg:block">Resumen</h2>
          <dl className="mb-4 hidden flex-col gap-2 text-sm lg:flex">
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-2 text-texto-suave"><ShoppingBag size={16} strokeWidth={1.75} aria-hidden /> Docenas</dt><dd className="font-medium tabular-nums">{textoCantidad(docenas)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-2 text-texto-suave"><CreditCard size={16} strokeWidth={1.75} aria-hidden /> Pago</dt><dd className="font-medium">{estado.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-2 text-texto-suave"><Truck size={16} strokeWidth={1.75} aria-hidden /> Entrega</dt><dd className="font-medium">{METODOS_ENTREGA[estado.metodo_entrega] ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="flex items-center gap-2 text-texto-suave"><User size={16} strokeWidth={1.75} aria-hidden /> Cliente</dt><dd className="truncate font-medium">{estado.cliente_nombre || '—'}</dd></div>
          </dl>
          <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-stretch lg:border-t lg:border-borde lg:pt-4">
            <div className="lg:flex lg:items-baseline lg:justify-between">
              <p className="text-xs text-texto-suave lg:text-sm"><span className="lg:hidden">{textoCantidad(docenas)} {docenas === 1 ? 'docena' : 'docenas'} · </span>Total</p>
              <p className="whitespace-nowrap font-titulo text-2xl font-semibold tabular-nums lg:text-3xl" aria-live="polite">{formatear(total, estado.moneda)}</p>
            </div>
            <Button tamano="lg" cargando={confirmando} deshabilitado={lineas.length === 0} onClick={alConfirmar} className="whitespace-nowrap">Confirmar venta</Button>
          </div>
        </aside>
      </div>

      <AgregarSheet productoId={eligiendo} moneda={estado.moneda} onCerrar={() => setEligiendo(null)} onAgregar={agregar} />

      <Modal abierto={pidiendoConfirmacion} onCerrar={() => setPidiendoConfirmacion(false)} titulo="Stock insuficiente">
        <p className="mb-5 text-sm text-texto-suave">Algún color tiene menos docenas que las pedidas. Si confirmás, el stock de ese color quedará en negativo hasta que se cargue mercadería. ¿Confirmar igual?</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="fantasma" onClick={() => setPidiendoConfirmacion(false)}>Revisar</Button>
          <Button onClick={confirmar}>Sí, confirmar</Button>
        </div>
      </Modal>
      <Modal abierto={pidiendoVaciar} onCerrar={() => setPidiendoVaciar(false)} titulo="¿Vaciar la venta?">
        <p className="mb-5 text-sm text-texto-suave">Se borran los productos y los datos del cliente de esta venta.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="fantasma" onClick={() => setPidiendoVaciar(false)}>Cancelar</Button>
          <Button variante="peligro" onClick={() => { despachar({ tipo: 'vaciar' }); setPidiendoVaciar(false) }}>Sí, vaciar</Button>
        </div>
      </Modal>
    </div>
  )
}
