// Excel de comisiones: resumen por vendedor y detalle por nota. Comisión siempre en USD;
// lo vendido va en una columna por moneda (las monedas no se suman entre sí).
import { comisionDeDocenas, comisionesPorVendedor, docenasDe } from '../../lib/comisiones.js'
import { META_MONEDA, MONEDAS, totalesPorMoneda } from '../../lib/moneda.js'

export function libroComisiones(ventas, nombres, filtrosTexto = []) {
  const resumen = comisionesPorVendedor(ventas)
    .map((f) => {
      const totales = Object.fromEntries(totalesPorMoneda(f.ventas).map((t) => [t.moneda, t.total_cent / 100]))
      return {
        vendedor: nombres.get(f.vendedor_id) ?? f.ventas[0]?.vendedor_nombre ?? '',
        ventas: f.ventas.length,
        docenas: f.docenas,
        comision: f.comision_usd_cent / 100,
        ...Object.fromEntries(MONEDAS.map((m) => [`vendido_${m}`, totales[m] ?? 0])),
      }
    })
    .sort((a, b) => b.comision - a.comision)

  const detalle = ventas
    .filter((v) => v.estado !== 'anulada')
    .map((v) => {
      const docenas = docenasDe(v.items)
      return { fecha: v.creada_en, numero: v.numero, vendedor: nombres.get(v.vendedor_id) ?? v.vendedor_nombre, cliente: v.cliente_nombre, docenas, comision: comisionDeDocenas(docenas) / 100, moneda: META_MONEDA[v.moneda].corto, total: v.total_cent / 100 }
    })

  return {
    titulo: 'Modas Naty · Comisiones',
    filtros: [...filtrosTexto, ['Regla', 'docena USD 1,00 · media docena USD 0,50 · sin anuladas']],
    hojas: [
      {
        nombre: 'Por vendedor',
        columnas: [
          { titulo: 'Vendedor/a', clave: 'vendedor', ancho: 22 },
          { titulo: 'Ventas', clave: 'ventas', tipo: 'entero', ancho: 9 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'decimal', ancho: 10 },
          { titulo: 'Comisión (USD)', clave: 'comision', tipo: 'dinero', ancho: 15, tono: () => 'exito' },
          ...MONEDAS.map((m) => ({ titulo: `Vendido en ${META_MONEDA[m].nombre}`, clave: `vendido_${m}`, tipo: 'dinero', ancho: 20 })),
        ],
        filas: resumen,
      },
      {
        nombre: 'Detalle por nota',
        columnas: [
          { titulo: 'Fecha', clave: 'fecha', tipo: 'fecha', ancho: 17 },
          { titulo: 'Nota', clave: 'numero', ancho: 14 },
          { titulo: 'Vendedor/a', clave: 'vendedor', ancho: 22 },
          { titulo: 'Cliente', clave: 'cliente', ancho: 22 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'decimal', ancho: 10 },
          { titulo: 'Comisión (USD)', clave: 'comision', tipo: 'dinero', ancho: 15 },
          { titulo: 'Moneda', clave: 'moneda', ancho: 9 },
          { titulo: 'Total de la nota', clave: 'total', tipo: 'dinero', ancho: 16 },
        ],
        filas: detalle,
      },
    ],
  }
}
