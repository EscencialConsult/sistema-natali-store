import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Copy, Minus, Plus, ShoppingBag, Trash2, WifiOff } from 'lucide-react'
import { EmptyState, Skeleton } from '../../components/ui/index.js'
import { formatear, META_MONEDA } from '../../lib/moneda.js'
import { PASO_DOCENA, textoCantidad } from '../../lib/docenas.js'
import { useConfigTienda, useVigentes } from './data/catalogo.js'
import { guardarCarrito, useCarrito } from './data/carritoStore.js'
import { useAjustesTienda } from './contexto.js'
import { cambiarCantidad, quitarLinea } from './lib/carrito.js'
import { aliasAConfirmar, formatearCuit, validarContactos, validarLocales, validarTransferencia } from './lib/configTienda.js'
import { armarEnvio, detallePedido } from './lib/mensaje.js'
import { monedasDisponibles, resumirPedido, sinConfirmar } from './lib/pedido.js'
import { soloDigitos } from './lib/whatsapp.js'
import { RUTA_CATALOGO, rutaProducto } from './rutas.js'
import { useVolverArriba } from './useVolverArriba.js'

const telefonoValido = (t) => soloDigitos(t).length >= 8

// La configuración la edita la administración: se valida con las mismas reglas que al guardar.
const contactosDe = (config, respaldo) => {
  const validos = validarContactos(config?.contactos).valor
  if (validos.length) return validos
  return telefonoValido(respaldo) ? [{ nombre: '', telefono: respaldo }] : []
}
const localesDe = (config) => validarLocales(config?.locales).valor.map((l) => l.nombre)

function Cantidad({ valor, onCambiar }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" aria-label="Quitar media docena" onClick={() => onCambiar(valor - PASO_DOCENA)} className="inline-flex size-11 items-center justify-center rounded-full bg-superficie">
        <Minus size={16} aria-hidden />
      </button>
      <span className="min-w-14 text-center tabular-nums" aria-live="polite">{textoCantidad(valor)} {valor === 1 ? 'doc.' : 'doc.'}</span>
      <button type="button" aria-label="Agregar media docena" onClick={() => onCambiar(valor + PASO_DOCENA)} className="inline-flex size-11 items-center justify-center rounded-full bg-superficie">
        <Plus size={16} aria-hidden />
      </button>
    </div>
  )
}

export default function PedidoPage() {
  useVolverArriba()
  const carrito = useCarrito()
  const { ajustes } = useAjustesTienda()
  const config = useConfigTienda().datos
  const ids = useMemo(() => carrito.lineas.map((l) => l.id), [carrito.lineas])
  const { vigentes, listo, cargando, error } = useVigentes(ids)

  const monedas = monedasDisponibles(ajustes)
  const [monedaElegida, setMoneda] = useState('usd')
  const moneda = monedas.includes(monedaElegida) ? monedaElegida : monedas[0]
  const [vendedor, setVendedor] = useState('')
  const [pago, setPago] = useState('transferencia')
  const [entrega, setEntrega] = useState('retiro')
  const [local, setLocal] = useState('')
  const [copiado, setCopiado] = useState(false)

  const contactos = contactosDe(config, ajustes?.whatsapp_tienda)
  const locales = localesDe(config)
  const elegido = contactos.length === 1 ? contactos[0] : contactos[Number(vendedor)] ?? null
  const transferencia = validarTransferencia(config?.transferencia).valor

  const resumen = listo ? resumirPedido({ carrito, vigentes, ajustes, moneda }) : sinConfirmar({ carrito, moneda })
  const detalle = detallePedido({
    resumen,
    vendedor: elegido,
    pago,
    entrega: { tipo: entrega, local: local || locales[0] || '' },
    negocio: ajustes?.negocio_nombre || 'Modas Naty',
  })
  const envio = armarEnvio({ detalle, telefono: elegido?.telefono, nombre: elegido?.nombre })

  const copiar = async (t) => {
    try {
      await navigator.clipboard.writeText(t)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      /* el navegador no dejó copiar: la persona puede seleccionar el texto */
    }
  }

  if (!carrito.lineas.length) {
    return (
      <EmptyState
        icono={ShoppingBag}
        titulo="Tu pedido está vacío"
        texto="Elegí modelos del catálogo y agregalos por docena o media docena."
        accion={<Link to={RUTA_CATALOGO} className="inline-flex min-h-11 items-center rounded-pildora bg-tinta px-5 text-sm font-medium text-sobre-tinta">Ver el catálogo</Link>}
      />
    )
  }

  const necesitaVendedor = contactos.length > 1 && !elegido
  const bloqueado = resumen.hayNoDisponibles || necesitaVendedor

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl tracking-tight md:text-4xl">Tu pedido</h1>

      {cargando && <Skeleton className="h-10" />}
      {error && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-superficie px-4 py-3 text-sm text-texto-suave">
          <WifiOff size={16} className="mt-0.5 shrink-0" aria-hidden /> No pudimos confirmar los precios ahora. Podés enviar el pedido con las cantidades y tu vendedor te confirma el importe.
        </p>
      )}
      {resumen.hayNoDisponibles && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-superficie px-4 py-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> Algunos modelos ya no están en el catálogo. Quitalos para poder enviar el pedido.
        </p>
      )}
      {resumen.hayCambios && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-superficie px-4 py-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden /> Cambió el precio de algunos modelos desde que los agregaste. Revisá el total.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-borde/60">
        {resumen.lineas.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-texto-suave">{l.codigo}</p>
                <Link to={rutaProducto(l.id)} className="font-medium leading-snug hover:underline">{l.nombre}</Link>
                {l.estado === 'no_disponible' && <p className="text-sm text-error">Ya no está disponible</p>}
                {l.estado === 'precio_oculto' && <p className="text-sm text-texto-suave">Precio a consultar</p>}
                {l.estado === 'sin_moneda' && <p className="text-sm text-texto-suave">Precio a confirmar en esta moneda</p>}
              </div>
              <button type="button" aria-label={`Quitar ${l.nombre}`} onClick={() => guardarCarrito(quitarLinea(carrito, l.id))} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-texto-suave hover:text-tinta">
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Cantidad valor={l.cantidad} onCambiar={(c) => guardarCarrito(cambiarCantidad(carrito, l.id, c))} />
              <span className="tabular-nums">{l.subtotalCent !== null ? formatear(l.subtotalCent, moneda) : ''}</span>
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="total" className="flex flex-col gap-2 rounded-2xl bg-superficie p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="total" className="text-lg font-semibold">Total estimado</h2>
          {monedas.length > 1 && (
            <div role="group" aria-label="Moneda" className="flex gap-1">
              {monedas.map((m) => (
                <button key={m} type="button" aria-pressed={m === moneda} onClick={() => setMoneda(m)} className={`min-h-11 rounded-pildora px-3 text-sm ${m === moneda ? 'bg-tinta text-sobre-tinta' : 'bg-fondo'}`}>
                  {META_MONEDA[m].corto}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-2xl font-semibold tabular-nums">{resumen.totalCent !== null ? formatear(resumen.totalCent, moneda) : 'A confirmar'}</p>
        <p className="text-sm text-texto-suave">El precio final y la disponibilidad los confirma tu vendedor.</p>
      </section>

      {contactos.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">¿Con qué vendedor hablás?</legend>
          {contactos.map((c, i) => (
            <label key={`${c.nombre}-${i}`} className="flex min-h-11 items-center gap-3">
              <input type="radio" name="vendedor" value={i} checked={String(i) === vendedor} onChange={() => setVendedor(String(i))} />
              {c.nombre}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">¿Cómo vas a pagar?</legend>
        <label className="flex min-h-11 items-center gap-3"><input type="radio" name="pago" checked={pago === 'transferencia'} onChange={() => setPago('transferencia')} /> Transferencia</label>
        <label className="flex min-h-11 items-center gap-3"><input type="radio" name="pago" checked={pago === 'efectivo'} onChange={() => setPago('efectivo')} /> Efectivo en el local</label>
      </fieldset>

      {pago === 'transferencia' && (
        <section aria-label="Datos de transferencia" className="flex flex-col gap-2 rounded-2xl bg-superficie p-4 text-sm">
          {transferencia ? (
            <>
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
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 break-words"><span className="text-texto-suave">{k}: </span><span className="font-medium">{v}</span></span>
                    {copiable && (
                      <button type="button" onClick={() => copiar(v)} aria-label={`Copiar ${k}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-fondo"><Copy size={16} aria-hidden /></button>
                    )}
                  </div>
                ))}
              {transferencia.nota && <p className="text-texto-suave">{transferencia.nota}</p>}
              {transferencia.alias && aliasAConfirmar(transferencia.actualizado_en) && (
                <p role="note" className="rounded-xl bg-fondo p-3 font-medium">
                  El alias cambia cada tanto: antes de transferir, confirmalo con tu vendedor.
                </p>
              )}
            </>
          ) : (
            <p>Pedile los datos de transferencia a tu vendedor.</p>
          )}
          <p className="text-texto-suave">Después de transferir, mandá el comprobante por WhatsApp al mismo vendedor.</p>
        </section>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">¿Retirás o recibís?</legend>
        <label className="flex min-h-11 items-center gap-3"><input type="radio" name="entrega" checked={entrega === 'retiro'} onChange={() => setEntrega('retiro')} /> Paso a retirar por el local</label>
        <label className="flex min-h-11 items-center gap-3"><input type="radio" name="entrega" checked={entrega === 'recibir'} onChange={() => setEntrega('recibir')} /> Quiero recibirlo (lo coordinamos)</label>
        {entrega === 'retiro' && locales.length > 1 && (
          <select aria-label="Local de retiro" value={local} onChange={(e) => setLocal(e.target.value)} className="min-h-11 rounded-xl bg-superficie px-3">
            {locales.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </fieldset>

      <div className="flex flex-col gap-3">
        {envio.enlace ? (
          <a
            href={bloqueado ? undefined : envio.enlace}
            aria-disabled={bloqueado}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-12 items-center justify-center rounded-pildora bg-whatsapp px-6 font-medium text-sobre-tinta shadow-boton ${bloqueado ? 'pointer-events-none opacity-50' : 'hover:brightness-95'}`}
          >
            Enviar pedido por WhatsApp
          </a>
        ) : (
          <p className="rounded-2xl bg-superficie px-4 py-3 text-sm">
            {necesitaVendedor ? 'Elegí con qué vendedor querés hablar.' : 'Todavía no hay un WhatsApp cargado. Copiá el pedido y mostralo en el local.'}
          </p>
        )}
        {envio.largo && (
          <p className="text-sm text-texto-suave">Tu pedido es largo: se envía un mensaje corto y después pegás el detalle completo en el chat. Tocá «Copiar pedido completo» primero.</p>
        )}
        <button type="button" onClick={() => copiar(detalle)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-pildora bg-superficie px-6 font-medium">
          <Copy size={16} aria-hidden /> {copiado ? 'Copiado' : 'Copiar pedido completo'}
        </button>
        <p className="text-center text-xs text-texto-suave">Enviar el pedido no lo reserva ni lo cobra: lo confirma tu vendedor.</p>
      </div>
    </div>
  )
}
