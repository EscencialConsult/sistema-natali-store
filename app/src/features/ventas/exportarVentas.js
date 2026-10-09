// Excel de ventas: una hoja con las notas y otra con el detalle de ítems. Los importes van como números (no texto).
import { fechaLarga } from '../../lib/fechas.js'
import { META_MONEDA } from '../../lib/moneda.js'

const PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia' }
const SYNC = { pending: 'Pendiente', synced: 'Sincronizada', error: 'Con problema' }

export async function crearExcelVentas(ventas) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()

  const hojaVentas = wb.addWorksheet('Ventas')
  hojaVentas.columns = [
    { header: 'Nota', key: 'numero', width: 14 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Vendedor', key: 'vendedor', width: 22 },
    { header: 'Cliente', key: 'cliente', width: 26 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Tipo de cambio', key: 'tc', width: 14 },
    { header: 'Pago', key: 'pago', width: 14 },
    { header: 'Total', key: 'total', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Estado', key: 'estado', width: 12 },
    { header: 'Envío', key: 'sync', width: 14 },
  ]
  const hojaItems = wb.addWorksheet('Detalle')
  hojaItems.columns = [
    { header: 'Nota', key: 'numero', width: 14 },
    { header: 'Código', key: 'codigo', width: 10 },
    { header: 'Producto', key: 'nombre', width: 34 },
    { header: 'Color', key: 'color', width: 16 },
    { header: 'Docenas', key: 'cantidad', width: 10 },
    { header: 'Prendas', key: 'unidades', width: 10 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Precio por docena', key: 'precio', width: 18, style: { numFmt: '#,##0.00' } },
    { header: 'Subtotal', key: 'subtotal', width: 14, style: { numFmt: '#,##0.00' } },
  ]
  for (const hoja of [hojaVentas, hojaItems]) hoja.getRow(1).font = { bold: true }

  for (const v of ventas) {
    hojaVentas.addRow({
      numero: v.numero,
      fecha: fechaLarga(v.creada_en),
      vendedor: v.vendedor_nombre,
      cliente: v.cliente_nombre,
      moneda: META_MONEDA[v.moneda].corto,
      tc: v.tipo_cambio,
      pago: PAGO[v.metodo_pago],
      total: v.total_cent / 100,
      estado: v.estado === 'anulada' ? 'Anulada' : 'Activa',
      sync: SYNC[v.sync_status] ?? '',
    })
    for (const i of v.items ?? []) {
      hojaItems.addRow({
        numero: v.numero,
        codigo: i.codigo,
        nombre: i.nombre,
        color: i.color_nombre,
        cantidad: i.cantidad,
        unidades: i.unidades,
        moneda: META_MONEDA[v.moneda].corto,
        precio: i.precio_cent / 100,
        subtotal: i.subtotal_cent / 100,
      })
    }
  }
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
