// Cuentas sobre los cobros de Mercado Pago (importes en pesos con decimales, tal como los informa Mercado Pago).
// Un cobro "con detalle" es el que trae el neto: los anteriores (pruebas) no entran en los totales ni en los porcentajes.
const redondear = (n) => Math.round(n * 100) / 100

export function resumenCobros(cobros) {
  const con = (cobros ?? []).filter((c) => c.neto != null && c.cobrado != null)
  const suma = (campo) => redondear(con.reduce((t, c) => t + (Number(c[campo]) || 0), 0))
  const cobrado = suma('cobrado')
  const neto = suma('neto')
  const precio = suma('precio')
  const descuento = redondear(cobrado - neto)
  const porcentajes = con.filter((c) => c.cobrado > 0).map((c) => ((c.cobrado - c.neto) / c.cobrado) * 100)
  return {
    conDetalle: con.length,
    sinDetalle: (cobros ?? []).length - con.length,
    cobrado,
    recargo: suma('recargo'),
    neto,
    precio,
    descuento,
    descuentoPct: cobrado > 0 ? (descuento / cobrado) * 100 : null,
    // Cuánto menos (positivo) o más (negativo) que el precio llegó a la cuenta.
    faltante: con.length ? redondear(precio - neto) : null,
    minPct: porcentajes.length ? Math.min(...porcentajes) : null,
    maxPct: porcentajes.length ? Math.max(...porcentajes) : null,
  }
}
