// Hooks de lectura. Se actualizan solos cuando cambia la base local (useLiveQuery),
// así que una respuesta lenta nunca pisa a una más nueva.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState } from 'react'
import { categorias, config, perfiles, productos, stock, ventas } from './repos/index.js'

// Devuelve { datos, cargando, error, reintentar } y nunca deja la pantalla sin saber en qué estado está.
export function useConsulta(consulta, deps = []) {
  const [intento, setIntento] = useState(0)
  const r = useLiveQuery(
    async () => {
      try {
        return { datos: await consulta() }
      } catch (error) {
        return { error }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...deps, intento],
  )
  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  return { datos: r?.datos, cargando: r === undefined, error: r?.error, reintentar }
}

export const useProductos = (filtros) => useConsulta(() => productos.listar(filtros), [JSON.stringify(filtros ?? {})])
export const useProducto = (id) => useConsulta(() => (id ? productos.obtener(id) : undefined), [id])
export const useBusquedaCodigo = (texto, limite) => useConsulta(() => productos.buscarPorCodigo(texto, limite), [texto, limite])
export const useCategorias = () => useConsulta(() => categorias.listar(), [])
export const useVentas = (filtros) => useConsulta(() => ventas.listar(filtros), [JSON.stringify(filtros ?? {})])
export const useVenta = (id) => useConsulta(() => (id ? ventas.obtener(id) : undefined), [id])
export const usePerfiles = (opciones) => useConsulta(() => perfiles.listar(opciones), [JSON.stringify(opciones ?? {})])
export const useConfig = () => useConsulta(() => config.todo(), [])
export const useStockPorColor = (producto_id) => useConsulta(() => stock.stockPorColor(producto_id), [producto_id])
export const useStockResumen = () => useConsulta(() => stock.resumen(), [])
