import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useToast } from '../../components/ui/index.js'
import { useCarritoItems, useProductos, useStockResumen } from '../../data/hooks.js'
import { carrito } from '../../data/repos/index.js'
import { armarLinea, totales } from '../../lib/carrito.js'

// Carrito "armado": ítems del dispositivo + producto, color, precio actual y stock. Se revalida solo porque las
// consultas son en vivo (useLiveQuery). Si una cantidad supera el disponible, se corrige sola y avisa.
export function useCarrito({ corregir = true } = {}) {
  const items = useCarritoItems()
  const prods = useProductos({ soloActivos: false })
  const stock = useStockResumen()
  const avisar = useToast()
  const avisado = useRef(new Set())

  const cargando = items.cargando || prods.cargando || stock.cargando
  const error = items.error || prods.error || stock.error

  const lineas = useMemo(() => {
    if (!items.datos || !prods.datos || !stock.datos) return []
    const porId = new Map(prods.datos.map((p) => [p.id, p]))
    return items.datos.map((i) => armarLinea(i, porId.get(i.producto_id), stock.datos))
  }, [items.datos, prods.datos, stock.datos])

  useEffect(() => {
    if (!corregir) return
    for (const l of lineas) {
      if (l.problema === 'cantidad_mayor' && !avisado.current.has(l.key)) {
        avisado.current.add(l.key)
        carrito.cantidad(l.key, l.disponible).then(() => avisar(`${l.producto.nombre}: quedan ${l.disponible}, ajustamos la cantidad.`, 'info'))
      }
    }
  }, [lineas, corregir, avisar])

  const cantidad = useCallback((key, n) => carrito.cantidad(key, n), [])
  const quitar = useCallback((key) => carrito.quitar(key), [])
  const vaciar = useCallback(() => carrito.vaciar(), [])
  const reintentar = () => {
    items.reintentar()
    prods.reintentar()
    stock.reintentar()
  }

  return { lineas, totales: totales(lineas), cargando, error, reintentar, cantidad, quitar, vaciar }
}
