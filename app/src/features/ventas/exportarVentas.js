// Excel de ventas: notas, detalle de ítems y resumen por moneda (las monedas nunca se suman entre sí).
import { comisionDeDocenas, docenasDe } from '../../lib/comisiones.js'
import { METODOS_ENTREGA } from '../../lib/entrega.js'
import { crearLibro } from '../../lib/excel.js'
import { META_MONEDA, totalesPorMoneda } from '../../lib/moneda.js'

const PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia' }
const SYNC = { pending: 'Pendiente', synced: 'Sincronizada', error: 'Con problema' }
const anulada = (f) => (f.estado === 'Anulada' ? 'error' : null)

export function libroVentas(ventas, filtros = []) {
  const filasVentas = ventas.map((v) => ({
    numero: v.numero,
    fecha: v.creada_en,
    vendedor: v.vendedor_nombre,
    cliente: v.cliente_nombre,
    telefono: v.cliente_telefono ?? '',
    email: v.cliente_email ?? '',
    direccion: v.cliente_direccion ?? '',
    moneda: META_MONEDA[v.moneda].corto,
    total: v.total_cent / 100,
    docenas: docenasDe(v.items),
    pago: PAGO[v.metodo_pago],
    entrega: METODOS_ENTREGA[v.metodo_entrega] ?? '',
    tc: v.tipo_cambio,
    estado: v.estado === 'anulada' ? 'Anulada' : 'Activa',
    sync: SYNC[v.sync_status] ?? '',
  }))
  const filasDetalle = ventas.flatMap((v) =>
    (v.items ?? []).map((i) => ({
      numero: v.numero,
      fecha: v.creada_en,
      codigo: i.codigo,
      nombre: i.nombre,
      color: i.color_nombre,
      cantidad: Number(i.cantidad),
      moneda: META_MONEDA[v.moneda].corto,
      precio: i.precio_cent / 100,
      subtotal: i.subtotal_cent / 100,
      estado: v.estado === 'anulada' ? 'Anulada' : 'Activa',
    })),
  )
  const activas = ventas.filter((v) => v.estado !== 'anulada')
  const filasResumen = totalesPorMoneda(activas).map((t) => {
    const deLaMoneda = activas.filter((v) => v.moneda === t.moneda)
    const docenas = deLaMoneda.reduce((s, v) => s + docenasDe(v.items), 0)
    return { moneda: META_MONEDA[t.moneda].nombre, ventas: deLaMoneda.length, docenas, total: t.total_cent / 100, comision: comisionDeDocenas(docenas) / 100 }
  })

  return {
    titulo: 'Modas Naty · Ventas',
    filtros,
    hojas: [
      {
        nombre: 'Ventas',
        columnas: [
          { titulo: 'Nota', clave: 'numero', ancho: 14 },
          { titulo: 'Fecha', clave: 'fecha', tipo: 'fecha', ancho: 17 },
          { titulo: 'Vendedor/a', clave: 'vendedor', ancho: 20 },
          { titulo: 'Cliente', clave: 'cliente', ancho: 22 },
          { titulo: 'Teléfono', clave: 'telefono', ancho: 15 },
          { titulo: 'Moneda', clave: 'moneda', ancho: 9 },
          { titulo: 'Total', clave: 'total', tipo: 'dinero', ancho: 13 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'docenas', ancho: 10 },
          { titulo: 'Pago', clave: 'pago', ancho: 14 },
          { titulo: 'Entrega', clave: 'entrega', ancho: 11 },
          { titulo: 'Estado', clave: 'estado', ancho: 10, tono: anulada },
          { titulo: 'Envío', clave: 'sync', ancho: 13, tono: (f) => (f.sync === 'Con problema' ? 'error' : f.sync === 'Pendiente' ? 'alerta' : null) },
          { titulo: 'Tipo de cambio', clave: 'tc', tipo: 'decimal', ancho: 13 },
          { titulo: 'Correo', clave: 'email', ancho: 24 },
          { titulo: 'Dirección', clave: 'direccion', ancho: 28 },
        ],
        filas: filasVentas,
      },
      {
        nombre: 'Detalle',
        columnas: [
          { titulo: 'Nota', clave: 'numero', ancho: 14 },
          { titulo: 'Fecha', clave: 'fecha', tipo: 'fecha', ancho: 17 },
          { titulo: 'Código', clave: 'codigo', ancho: 10 },
          { titulo: 'Producto', clave: 'nombre', ancho: 32 },
          { titulo: 'Color', clave: 'color', ancho: 14 },
          { titulo: 'Docenas', clave: 'cantidad', tipo: 'docenas', ancho: 10 },
          { titulo: 'Moneda', clave: 'moneda', ancho: 9 },
          { titulo: 'Precio por docena', clave: 'precio', tipo: 'dinero', ancho: 16 },
          { titulo: 'Subtotal', clave: 'subtotal', tipo: 'dinero', ancho: 13 },
          { titulo: 'Estado', clave: 'estado', ancho: 10, tono: anulada },
        ],
        filas: filasDetalle,
      },
      {
        nombre: 'Resumen por moneda',
        columnas: [
          { titulo: 'Moneda', clave: 'moneda', ancho: 16 },
          { titulo: 'Ventas activas', clave: 'ventas', tipo: 'entero', ancho: 15 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'docenas', ancho: 12 },
          { titulo: 'Total vendido', clave: 'total', tipo: 'dinero', ancho: 16 },
          { titulo: 'Comisión (USD)', clave: 'comision', tipo: 'dinero', ancho: 15 },
        ],
        filas: filasResumen,
      },
    ],
  }
}

export const crearExcelVentas = (ventas, filtros) => crearLibro(libroVentas(ventas, filtros))
