// Comisión de vendedores (pedido de la clienta, punto 2):
//   docena = USD 1,00 · media docena = USD 0,50 · siempre en dólares, sin importar la moneda de la venta.
//   Las ventas anuladas no suman. Se calcula por vendedor y por período.
export const COMISION_DOCENA_USD_CENT = 100

// Docenas vendidas en una lista de ítems (solo los vendidos por docena; 0,5 = media docena).
export const docenasDe = (items = []) => items.reduce((t, i) => t + (i.unidad === 'docena' ? Number(i.cantidad) : 0), 0)

export const comisionDeDocenas = (docenas) => Math.round(docenas * COMISION_DOCENA_USD_CENT)

// ventas: con `items`. Devuelve [{ vendedor_id, ventas, docenas, comision_usd_cent }] sin las anuladas.
export function comisionesPorVendedor(ventas) {
  const m = new Map()
  for (const v of ventas) {
    if (v.estado === 'anulada') continue
    const f = m.get(v.vendedor_id) ?? { vendedor_id: v.vendedor_id, ventas: [], docenas: 0 }
    f.ventas.push(v)
    f.docenas += docenasDe(v.items)
    m.set(v.vendedor_id, f)
  }
  return [...m.values()].map((f) => ({ ...f, comision_usd_cent: comisionDeDocenas(f.docenas) }))
}
