// Repositorio de pedidos (implementación REMOTA, Supabase). Misma interfaz que local/pedidos.js.
// Crear y consultar como público va por funciones (anon); listar y cambiar estados usa las tablas con RLS (panel).
import { obtenerSupabase } from '../../supabase.js'
import { errorDeBase } from '../../../lib/errores.js'
import { esquemaPedido, esquemaPedidoKiosco } from '../../../lib/pedido.js'
import { datosDeMiPedido } from '../../../lib/misPedidos.js'
import { kiosco } from './kiosco.js'

const rpc = async (nombre, p) => {
  const sb = await obtenerSupabase()
  const { data, error } = await sb.rpc(nombre, { p })
  if (error) throw errorDeBase(error)
  return data
}

// El servidor devuelve tipo_cambio y totales como texto/numeric: se normalizan a números.
const normalizar = (p) =>
  p && {
    ...p,
    tipo_cambio: Number(p.tipo_cambio),
    subtotal_cent: Number(p.subtotal_cent),
    total_cent: Number(p.total_cent),
    envio_costo_cent: Number(p.envio_costo_cent),
    items: (p.items ?? []).map((i) => ({ ...i, precio_cent: Number(i.precio_cent), subtotal_cent: Number(i.subtotal_cent) })),
    historial: p.historial ?? [],
    pagos: p.pagos ?? [],
  }

async function armar(filas) {
  if (filas.length === 0) return []
  const sb = await obtenerSupabase()
  const ids = filas.map((p) => p.id)
  const [items, historial, pagos] = await Promise.all([
    sb.from('tienda_pedido_items').select('*').in('pedido_id', ids),
    sb.from('tienda_pedido_historial').select('*').in('pedido_id', ids).order('creado_en', { ascending: true }),
    // Cobros del pedido (solo los lee el personal por RLS; sin permiso vuelve vacío, no es un error).
    sb.from('tienda_pagos').select('pedido_id, proveedor, proveedor_id, estado, datos, creado_en').in('pedido_id', ids),
  ])
  if (items.error) throw errorDeBase(items.error)
  if (historial.error) throw errorDeBase(historial.error)
  return filas.map((p) =>
    normalizar({
      ...p,
      items: items.data.filter((i) => i.pedido_id === p.id),
      historial: historial.data.filter((h) => h.pedido_id === p.id),
      pagos: (pagos.data ?? []).filter((g) => g.pedido_id === p.id),
    }),
  )
}

export const pedidos = {
  // La validación en el cliente da el mensaje claro; la base decide (vuelve a validar y bloquea el stock).
  async crear(datos) {
    if (datos?.origen === 'kiosco') {
      const d = esquemaPedidoKiosco.parse(datos)
      return normalizar(await kiosco.crearPedido({ id: d.id, comprador_nombre: d.comprador_nombre, comprador_telefono: d.comprador_telefono, proveedor_pago: d.proveedor_pago, moneda: d.moneda, cambio_visto: d.cambio_visto, items: d.items }))
    }
    const d = esquemaPedido.parse(datos)
    return normalizar(await rpc('tienda_crear_pedido', d))
  },

  // Un pedido propio (hecho desde este dispositivo) se consulta por el camino público con el teléfono que la persona
  // ya ingresó: la tabla solo la lee el personal (RLS). Sin pedido propio, o con sesión del panel, se lee la tabla.
  async propio(codigoOId) {
    const mio = datosDeMiPedido(codigoOId)
    if (!mio?.codigo) return undefined
    try {
      // Con la llave (id del pedido) se lee desde cualquier dispositivo; con el teléfono, como antes.
      if (mio.id) {
        const sb = await obtenerSupabase()
        const { data } = await sb.rpc('tienda_pedido_por_llave', { p_codigo: mio.codigo, p_llave: mio.id })
        if (data) return normalizar(data)
      }
      if (mio.telefono) return await this.consultarPublico(mio.codigo, mio.telefono)
      return undefined
    } catch {
      return undefined
    }
  },

  async obtener(id) {
    const propio = await this.propio(id)
    if (propio) return propio
    const sb = await obtenerSupabase()
    const { data, error } = await sb.from('tienda_pedidos').select('*').eq('id', id).maybeSingle()
    if (error) throw errorDeBase(error)
    return data ? (await armar([data]))[0] : undefined
  },

  async obtenerPorCodigo(codigo) {
    const cod = String(codigo).trim().toUpperCase()
    const propio = await this.propio(cod)
    if (propio) return propio
    const sb = await obtenerSupabase()
    const { data, error } = await sb.from('tienda_pedidos').select('*').eq('codigo', cod).maybeSingle()
    // Sin sesión del panel la tabla no se puede leer (RLS): no es un error de la compradora, solo que acá no tiene acceso.
    // Se devuelve "no encontrado" y la pantalla le ofrece buscar su pedido con código y teléfono.
    if (error && (error.code === '42501' || /permission denied/i.test(error.message ?? ''))) return undefined
    if (error) throw errorDeBase(error)
    return data ? (await armar([data]))[0] : undefined
  },

  // Cobros aprobados de Mercado Pago (los lee el personal por RLS), con el desglose que guardó la tienda al confirmar.
  // Importes en pesos con decimales, como los informa Mercado Pago. `precio` es el total del pedido (sin recargo).
  async cobros({ desde = null, hasta = null } = {}) {
    const sb = await obtenerSupabase()
    let q = sb.from('tienda_pagos').select('pedido_id, proveedor_id, creado_en, datos').eq('proveedor', 'mercadopago').eq('estado', 'aprobado').order('creado_en', { ascending: false })
    if (desde) q = q.gte('creado_en', desde)
    if (hasta) q = q.lte('creado_en', hasta)
    const { data, error } = await q.limit(2000)
    if (error) throw errorDeBase(error)
    const ids = [...new Set((data ?? []).map((g) => g.pedido_id))]
    const { data: peds, error: e2 } = ids.length ? await sb.from('tienda_pedidos').select('id, codigo, comprador_nombre, total_cent, moneda, pagado_en').in('id', ids) : { data: [] }
    if (e2) throw errorDeBase(e2)
    const porId = new Map((peds ?? []).map((p) => [p.id, p]))
    const num = (v) => (v == null || v === '' ? null : Number(v))
    return (data ?? []).map((g) => {
      const p = porId.get(g.pedido_id)
      const d = g.datos ?? {}
      return {
        pedido_id: g.pedido_id,
        codigo: p?.codigo ?? '—',
        comprador: p?.comprador_nombre ?? '',
        fecha: p?.pagado_en ?? g.creado_en,
        operacion: g.proveedor_id,
        precio: p && p.moneda === 'ars' ? Number(p.total_cent) / 100 : null,
        cobrado: num(d.monto_ars),
        recargo: num(d.recargo_ars) ?? 0,
        comision: num(d.comision_ars),
        retenciones: num(d.retenciones_ars),
        neto: num(d.neto_ars),
      }
    })
  },

  async consultarPublico(codigo, telefono) {
    const sb = await obtenerSupabase()
    const { data, error } = await sb.rpc('tienda_pedido_publico', { p_codigo: String(codigo ?? '').trim().toUpperCase(), p_telefono: String(telefono ?? '') })
    if (error) throw errorDeBase(error)
    return data ? normalizar(data) : undefined
  },

  async listar({ estado, origen, desde, hasta, texto = '' } = {}) {
    const sb = await obtenerSupabase()
    let q = sb.from('tienda_pedidos').select('*').order('creado_en', { ascending: false })
    if (estado) q = q.in('estado', [estado].flat())
    if (origen) q = q.eq('origen', origen)
    if (desde) q = q.gte('creado_en', desde)
    if (hasta) q = q.lte('creado_en', hasta)
    const t = texto.trim()
    if (t) q = q.or(`codigo.ilike.%${t}%,comprador_nombre.ilike.%${t}%,comprador_telefono.ilike.%${t}%`)
    const { data, error } = await q.limit(500)
    if (error) throw errorDeBase(error)
    return armar(data)
  },

  cambiarEstado: (id, estado, { motivo = '' } = {}) => rpc('tienda_cambiar_estado', { id, estado, motivo }).then(normalizar),

  // Pago en caja o transferencia confirmado por la encargada. El de Mercado Pago lo confirma el webhook (etapa 5).
  confirmarPago: (id, { proveedor = 'caja', proveedor_id = null } = {}) => rpc('tienda_confirmar_pago', { id, proveedor, proveedor_id }).then(normalizar),

  cancelar(id, { motivo }) {
    return this.cambiarEstado(id, 'cancelado', { motivo })
  },

  // Las reservas las vence el servidor (cron o Function programada); desde la app no se hace nada.
  vencerReservas: async () => 0,
}
