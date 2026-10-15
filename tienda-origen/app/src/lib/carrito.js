// Cálculos del carrito. Las líneas llegan "armadas" (ítem del carrito + producto + color + stock); acá no se lee la base.
// Dinero en centavos enteros.

// Línea armada: { key, producto_id, color_id, cantidad, producto, color, precio_cent, disponible, problema }
// problema: null | 'sin_producto' | 'sin_color' | 'sin_stock' | 'cantidad_mayor'
export function armarLinea(item, producto, stockPorColor) {
  const color = producto?.colores.find((c) => c.id === item.color_id) ?? null
  const disponible = color ? (stockPorColor?.[color.id] ?? 0) : 0
  const vendible = producto && producto.activo && producto.publicado_tienda && Number.isInteger(producto.precio_unidad_bs_cent)
  let problema = null
  if (!vendible) problema = 'sin_producto'
  else if (!color) problema = 'sin_color'
  else if (disponible <= 0) problema = 'sin_stock'
  else if (item.cantidad > disponible) problema = 'cantidad_mayor'
  const precio_cent = vendible ? producto.precio_unidad_bs_cent : 0
  return { ...item, producto: producto ?? null, color, precio_cent, disponible, problema, subtotal_cent: precio_cent * item.cantidad }
}

export const TEXTO_PROBLEMA = {
  sin_producto: 'Este modelo ya no está disponible.',
  sin_color: 'Ese color ya no está disponible.',
  sin_stock: 'Se quedó sin stock en este color.',
  cantidad_mayor: 'No hay tantas unidades: ajustamos la cantidad.',
}

export function totales(lineas) {
  const validas = lineas.filter((l) => !l.problema || l.problema === 'cantidad_mayor')
  const unidades = validas.reduce((t, l) => t + Math.min(l.cantidad, l.disponible || l.cantidad), 0)
  const subtotal_cent = validas.reduce((t, l) => t + l.precio_cent * Math.min(l.cantidad, l.disponible || l.cantidad), 0)
  return { unidades, subtotal_cent }
}

export const lineasConProblema = (lineas) => lineas.filter((l) => l.problema)

// Lo que se manda al pedido: solo ids y cantidades (el servidor copia precio y nombres).
export const itemsParaPedido = (lineas) => lineas.filter((l) => !l.problema).map((l) => ({ producto_id: l.producto_id, color_id: l.color_id, cantidad: l.cantidad }))
