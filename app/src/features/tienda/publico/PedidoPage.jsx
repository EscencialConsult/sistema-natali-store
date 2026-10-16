import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Banknote, Check, Copy, Landmark, Layers, MessageCircle, Minus, Plus, Shirt, ShoppingBag, Store, Trash2, Truck, WifiOff } from 'lucide-react'
import { Skeleton } from '../../../components/ui/index.js'
import { formatear, META_MONEDA } from '../../../lib/moneda.js'
import { aPrendas, PASO_DOCENA, textoCantidad } from '../../../lib/docenas.js'
import { useConfigTienda, useVigentes } from '../data/catalogo.js'
import { supabaseUrl } from '../data/clientePublico.js'
import { guardarCarrito, useCarrito } from '../data/carritoStore.js'
import { useAjustesTienda } from '../contexto.js'
import { cambiarCantidad, quitarLinea } from '../lib/carrito.js'
import { NOMBRE_MONEDA, estadoCuenta, formatearCuit, validarLocales, validarTransferencia } from '../lib/configTienda.js'
import { textosDe } from '../lib/textos.js'
import { fotosDe } from '../lib/fotos.js'
import { armarEnvio, detallePedido } from '../lib/mensaje.js'
import { monedasDisponibles, resumirPedido, sinConfirmar } from '../lib/pedido.js'
import { soloDigitos } from '../lib/whatsapp.js'
import { RUTA_AYUDA, RUTA_CATALOGO, rutaProducto } from '../rutas.js'
import { useVolverArriba } from './useVolverArriba.js'

const telefonoValido = (t) => soloDigitos(t).length >= 8

const localesDe = (config) => validarLocales(config?.locales).valor.map((l) => l.nombre)

const docenasTexto = (n) => `${textoCantidad(n)} ${n === 1 ? 'docena' : 'docenas'}`
const prendasTexto = (docenas) => `${aPrendas(docenas)} prendas`


function Cantidad({ valor, onCambiar, nombre }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center rounded-full border border-(--t-beige) bg-white">
        <button type="button" aria-label={`Quitar media docena de ${nombre}`} onClick={() => onCambiar(valor - PASO_DOCENA)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-(--t-beige)/50">
          <Minus size={16} aria-hidden />
        </button>
        <span className="min-w-24 text-center text-sm font-semibold tabular-nums" aria-live="polite">{docenasTexto(valor)}</span>
        <button type="button" aria-label={`Agregar media docena de ${nombre}`} onClick={() => onCambiar(valor + PASO_DOCENA)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-(--t-beige)/50">
          <Plus size={16} aria-hidden />
        </button>
      </div>
      <span className="t-suave pl-3 text-xs">{prendasTexto(valor)}, surtidas en talles y colores</span>
    </div>
  )
}

// Opción tipo tarjeta: un radio accesible con la tarjeta entera como objetivo táctil.
function Opcion({ name, value, actual, onChange, icono: Icono, titulo, texto }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-(--t-beige) bg-white p-3 transition-colors hover:border-(--t-vino)/50 has-checked:border-(--t-vino) has-checked:bg-(--t-rosa)/35">
      <input type="radio" name={name} value={value} checked={actual === value} onChange={() => onChange(value)} className="sr-only" />
      {Icono && <Icono size={18} aria-hidden className="mt-0.5 shrink-0 text-(--t-vino)" />}
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        {texto && <span className="t-suave block text-xs leading-snug">{texto}</span>}
      </span>
    </label>
  )
}

function Dato({ etiqueta, valor, copiable, copiado, onCopiar }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="min-w-0 break-words text-sm"><span className="t-suave">{etiqueta}: </span><span className="font-medium tabular-nums">{valor}</span></span>
      {copiable && (
        <button type="button" onClick={onCopiar} aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`} className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors ${copiado ? 'border-(--t-vino) bg-(--t-vino) text-white' : 'border-(--t-beige) bg-white hover:border-(--t-vino)/50'}`}>
          {copiado ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        </button>
      )}
    </div>
  )
}

function Vacio({ titulo, texto }) {
  const pistas = [
    [Layers, 'Por docena o media docena', 'Cada modelo se pide de a 12 o de a 6 prendas.'],
    [Shirt, 'Surtido en talles y colores', 'La docena viene variada; el color no se elige por prenda.'],
    [MessageCircle, 'Lo confirmás por WhatsApp', 'Mandás el pedido y tu vendedor te confirma precio y disponibilidad.'],
  ]
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-8 text-center md:py-12">
      <span className="flex size-20 items-center justify-center rounded-full bg-(--t-rosa)"><ShoppingBag size={30} strokeWidth={1.75} aria-hidden className="text-(--t-vino)" /></span>
      <div className="flex flex-col gap-3">
        <p className="t-suave text-xs font-semibold uppercase tracking-[0.18em]">Tu pedido</p>
        <h1 className="font-titulo text-3xl font-semibold tracking-tight text-balance md:text-4xl">{titulo}</h1>
        <p className="t-suave mx-auto max-w-md text-balance leading-relaxed">{texto}</p>
      </div>
      <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-(--t-vino) px-7 text-sm font-semibold text-white hover:bg-(--t-vino-oscuro)">
        Ver el catálogo <ArrowRight size={16} aria-hidden />
      </Link>
      <ul className="grid w-full gap-4 text-left sm:grid-cols-3">
        {pistas.map(([Icono, titulo, texto]) => (
          <li key={titulo} className="flex flex-col gap-2 rounded-2xl border border-(--t-beige) bg-white/60 p-4">
            <Icono size={20} strokeWidth={1.75} aria-hidden className="text-(--t-vino)" />
            <p className="font-semibold leading-snug">{titulo}</p>
            <p className="t-suave text-sm leading-snug">{texto}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PedidoPage() {
  useVolverArriba()
  const carrito = useCarrito()
  const { ajustes, vendedores } = useAjustesTienda()
  const config = useConfigTienda().datos
  const t = textosDe(config)
  const ids = useMemo(() => carrito.lineas.map((l) => l.id), [carrito.lineas])
  const { vigentes, listo, cargando, error } = useVigentes(ids)

  const monedas = monedasDisponibles(ajustes)
  const [monedaElegida, setMoneda] = useState('usd')
  const moneda = monedas.includes(monedaElegida) ? monedaElegida : monedas[0]
  const [vendedor, setVendedor] = useState('')
  const [pago, setPago] = useState('transferencia')
  const [entrega, setEntrega] = useState('retiro')
  const [local, setLocal] = useState('')
  const [copiado, setCopiado] = useState('')

  // Vendedores: salen de Usuarios (rol vendedor/a con teléfono); sin ninguno, el WhatsApp de la tienda.
  const contactos = vendedores.length ? vendedores : telefonoValido(ajustes?.whatsapp_tienda) ? [{ nombre: '', telefono: ajustes.whatsapp_tienda }] : []
  const locales = localesDe(config)
  const elegido = contactos.length === 1 ? contactos[0] : contactos[Number(vendedor)] ?? null
  const transferencia = validarTransferencia(config?.transferencia).valor
  const cuenta = estadoCuenta(transferencia)

  const resumen = listo ? resumirPedido({ carrito, vigentes, ajustes, moneda }) : sinConfirmar({ carrito, moneda })
  const detalle = detallePedido({
    resumen,
    vendedor: elegido,
    pago,
    entrega: { tipo: entrega, local: local || locales[0] || '' },
    negocio: ajustes?.negocio_nombre || 'Modas Naty',
  })
  const envio = armarEnvio({ detalle, telefono: elegido?.telefono, nombre: elegido?.nombre })
  const totalDocenas = carrito.lineas.reduce((t, l) => t + l.cantidad, 0)
  // Importe estimado en la moneda en la que se transfiere, para que la clienta sepa cuánto girar.
  const totalEnMonedaDeCuenta =
    listo && transferencia?.moneda && monedas.includes(transferencia.moneda) ? resumirPedido({ carrito, vigentes, ajustes, moneda: transferencia.moneda }).totalCent : null

  const copiar = async (texto, clave) => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(clave)
      setTimeout(() => setCopiado((c) => (c === clave ? '' : c)), 2500)
    } catch {
      /* el navegador no dejó copiar: la persona puede seleccionar el texto */
    }
  }

  if (!carrito.lineas.length) return <Vacio titulo={t('pedido.vacio_titulo')} texto={t('pedido.vacio_texto')} />

  const necesitaVendedor = contactos.length > 1 && !elegido
  const bloqueado = resumen.hayNoDisponibles || necesitaVendedor

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="t-suave text-xs font-semibold uppercase tracking-[0.18em]">Tu pedido</p>
          <h1 className="font-titulo text-3xl font-semibold tracking-tight md:text-4xl">{t('pedido.titulo')}</h1>
          <p className="t-suave">
            {carrito.lineas.length} {carrito.lineas.length === 1 ? 'modelo' : 'modelos'} · {docenasTexto(totalDocenas)} · {prendasTexto(totalDocenas)}
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {t('pedido.pasos').map((p, i) => (
            <li key={p} className="flex items-center gap-3 rounded-xl border border-(--t-beige) bg-white/60 px-4 py-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--t-vino) text-xs font-semibold text-white">{i + 1}</span>
              {p}
            </li>
          ))}
        </ol>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <section aria-labelledby="modelos-pedido" className="flex flex-col gap-4">
          <h2 id="modelos-pedido" className="font-titulo text-xl font-semibold tracking-tight">Modelos elegidos</h2>

          {cargando && <Skeleton className="h-10" />}
          {error && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-(--t-beige) bg-white/60 px-4 py-3 text-sm">
              <WifiOff size={16} className="mt-0.5 shrink-0 text-(--t-vino)" aria-hidden /> No pudimos confirmar los precios ahora. Podés enviar el pedido con las cantidades y tu vendedor te confirma el importe.
            </p>
          )}
          {resumen.hayNoDisponibles && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-error/30 bg-error-fondo px-4 py-3 text-sm text-error">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> Algunos modelos ya no están en el catálogo. Quitalos para poder enviar el pedido.
            </p>
          )}
          {resumen.hayCambios && (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-(--t-beige) bg-white/60 px-4 py-3 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-(--t-vino)" aria-hidden /> Cambió el precio de algunos modelos desde que los agregaste. Revisá el total.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {resumen.lineas.map((l) => {
              const producto = vigentes.get(l.id)
              const foto = producto ? fotosDe(producto, supabaseUrl)[0] : undefined
              return (
                <li key={l.id} className="flex gap-4 rounded-2xl border border-(--t-beige) bg-white/60 p-3 sm:p-4">
                  <Link to={rutaProducto(l.id)} className="shrink-0" aria-label={`Ver ${l.nombre}`}>
                    <span className="block size-20 overflow-hidden rounded-xl bg-(--t-beige)/60 sm:size-24">
                      {foto ? <img src={foto} alt="" width="240" height="320" className="size-full object-cover" /> : <span className="t-suave flex size-full items-center justify-center text-xs">{l.codigo}</span>}
                    </span>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="t-suave text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">{l.codigo}</p>
                        <Link to={rutaProducto(l.id)} className="font-titulo text-base font-semibold leading-snug hover:underline">{l.nombre}</Link>
                        {l.docenaCent !== null && <p className="t-suave text-xs">{formatear(l.docenaCent, moneda)} por docena</p>}
                        {l.estado === 'no_disponible' && <p className="text-sm text-error">Ya no está disponible</p>}
                        {l.estado === 'precio_oculto' && <p className="t-suave text-sm">Precio a consultar</p>}
                        {l.estado === 'sin_moneda' && <p className="t-suave text-sm">Precio a confirmar en esta moneda</p>}
                        {l.estado === 'sin_confirmar' && <p className="t-suave text-sm">Precio a confirmar</p>}
                      </div>
                      <button type="button" aria-label={`Quitar ${l.nombre} del pedido`} onClick={() => guardarCarrito(quitarLinea(carrito, l.id))} className="t-suave inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-(--t-beige)/50 hover:text-(--t-vino)">
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <Cantidad valor={l.cantidad} nombre={l.nombre} onCambiar={(c) => guardarCarrito(cambiarCantidad(carrito, l.id, c))} />
                      <span className="font-titulo text-lg font-semibold tabular-nums">{l.subtotalCent !== null ? formatear(l.subtotalCent, moneda) : ''}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link to={RUTA_CATALOGO} className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-(--t-vino) underline-offset-4 hover:underline">
            <ArrowRight size={16} aria-hidden className="rotate-180" /> Seguir eligiendo modelos
          </Link>
        </section>

        <aside className="flex flex-col gap-5 rounded-2xl border border-(--t-beige) bg-white p-5 lg:sticky lg:top-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-titulo text-lg font-semibold">Total estimado</h2>
              {monedas.length > 1 && (
                <div role="group" aria-label="Moneda" className="inline-flex rounded-full border border-(--t-beige) p-0.5">
                  {monedas.map((m) => (
                    <button key={m} type="button" aria-pressed={m === moneda} onClick={() => setMoneda(m)} className={`min-h-9 rounded-full px-3 text-xs font-semibold ${m === moneda ? 'bg-(--t-vino) text-white' : 't-suave hover:text-(--t-tinta)'}`}>
                      {META_MONEDA[m].corto}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="font-titulo text-3xl font-semibold tabular-nums">{resumen.totalCent !== null ? formatear(resumen.totalCent, moneda) : 'A confirmar'}</p>
            <p className="t-suave text-xs leading-snug">El precio final y la disponibilidad los confirma tu vendedor. Enviar el pedido no lo reserva ni lo cobra.</p>
          </div>

          {contactos.length > 1 && (
            <fieldset className="flex flex-col gap-2 border-t border-(--t-beige) pt-4">
              <legend className="float-left mb-2 font-semibold">¿Con quién hablás?</legend>
              <div className="grid grid-cols-2 gap-2">
                {contactos.map((c, i) => (
                  <Opcion key={`${c.nombre}-${i}`} name="vendedor" value={String(i)} actual={vendedor} onChange={setVendedor} titulo={c.nombre || 'Vendedor'} />
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="flex flex-col gap-2 border-t border-(--t-beige) pt-4">
            <legend className="float-left mb-2 font-semibold">¿Cómo pagás?</legend>
            <div className="grid gap-2">
              <Opcion name="pago" value="transferencia" actual={pago} onChange={setPago} icono={Landmark} titulo="Transferencia" texto="Te mostramos los datos de la cuenta." />
              <Opcion name="pago" value="efectivo" actual={pago} onChange={setPago} icono={Banknote} titulo="Efectivo en el local" texto="Pagás cuando retirás." />
            </div>
          </fieldset>

          {pago === 'transferencia' && (
            <section aria-label="Datos de transferencia" className="flex flex-col gap-1 rounded-xl border border-dashed border-(--t-vino)/40 bg-(--t-crema) p-4">
              {transferencia ? (
                <>
                  <p className="t-suave mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]">Cuenta para transferir</p>
                  {[
                    ['Titular', transferencia.titular, false],
                    ['CUIT/CUIL', formatearCuit(transferencia.cuit), false],
                    ['Banco', transferencia.banco, false],
                    ['CBU', transferencia.cbu, true],
                    ['Alias', transferencia.alias, true],
                    ['Cuenta', transferencia.cuenta, true],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v, copiable]) => (
                      <Dato key={k} etiqueta={k} valor={v} copiable={copiable} copiado={copiado === k} onCopiar={() => copiar(v, k)} />
                    ))}
                  {transferencia.moneda && (
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold">
                      Transferí en {NOMBRE_MONEDA[transferencia.moneda]}{totalEnMonedaDeCuenta !== null ? `: ${formatear(totalEnMonedaDeCuenta, transferencia.moneda)} estimados` : ''}.
                    </p>
                  )}
                  {transferencia.nota && <p className="t-suave mt-1 text-xs">{transferencia.nota}</p>}
                  {cuenta.estado === 'vencida' && (
                    <p role="note" className="mt-1 flex items-start gap-2 text-xs font-medium">
                      <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0 text-(--t-vino)" /> La cuenta cambia cada tanto: antes de transferir, confirmá estos datos con tu vendedor.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm">Pedile los datos de transferencia a tu vendedor.</p>
              )}
              <p className="t-suave mt-1 text-xs">Después de transferir, mandale el comprobante por WhatsApp al mismo vendedor.</p>
            </section>
          )}

          <fieldset className="flex flex-col gap-2 border-t border-(--t-beige) pt-4">
            <legend className="float-left mb-2 font-semibold">¿Retirás o recibís?</legend>
            <div className="grid gap-2">
              <Opcion name="entrega" value="retiro" actual={entrega} onChange={setEntrega} icono={Store} titulo="Paso a retirar por el local" texto={locales.length ? locales.join(' · ') : undefined} />
              <Opcion name="entrega" value="recibir" actual={entrega} onChange={setEntrega} icono={Truck} titulo="Quiero recibirlo" texto="Lo coordinás con tu vendedor." />
            </div>
            {entrega === 'retiro' && locales.length > 1 && (
              <label className="mt-1 flex flex-col gap-1 text-sm font-medium">
                ¿En qué local?
                <select value={local} onChange={(e) => setLocal(e.target.value)} className="min-h-11 rounded-xl border border-(--t-beige) bg-white px-3 font-normal">
                  {locales.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}
          </fieldset>

          <div className="flex flex-col gap-3 border-t border-(--t-beige) pt-4">
            {envio.enlace ? (
              <a
                href={bloqueado ? undefined : envio.enlace}
                aria-disabled={bloqueado}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 font-semibold text-sobre-tinta shadow-boton ${bloqueado ? 'pointer-events-none opacity-50' : 'hover:brightness-95'}`}
              >
                <MessageCircle size={18} aria-hidden /> Enviar pedido por WhatsApp
              </a>
            ) : (
              <p className="rounded-xl bg-(--t-crema) px-4 py-3 text-sm">
                {necesitaVendedor ? 'Elegí con qué vendedor querés hablar.' : 'Todavía no hay un WhatsApp cargado. Copiá el pedido y mostralo en el local.'}
              </p>
            )}
            {envio.largo && (
              <p className="t-suave text-xs leading-snug">Tu pedido es largo: se envía un mensaje corto y después pegás el detalle completo en el chat. Tocá «Copiar pedido completo» primero.</p>
            )}
            <button type="button" onClick={() => copiar(detalle, 'pedido')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-(--t-beige) bg-white px-6 text-sm font-medium hover:border-(--t-vino)/50">
              {copiado === 'pedido' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado === 'pedido' ? 'Pedido copiado' : 'Copiar pedido completo'}
            </button>
            <p className="t-suave text-center text-xs">
              ¿Dudas? Mirá <Link to={RUTA_AYUDA} className="underline underline-offset-4">cómo comprar</Link>.
            </p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="despues" className="flex flex-col gap-4 rounded-2xl bg-(--t-vino) px-6 py-7 text-white md:px-10">
        <h2 id="despues" className="font-titulo text-xl font-semibold tracking-tight">{t('pedido.despues_titulo')}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {t('pedido.despues').map((d, i) => (
            <li key={d} className="flex items-start gap-3 text-sm leading-snug text-white/85">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">{i + 1}</span>
              {d}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
