// Hooks de lectura. Se actualizan solos cuando cambia la base local (useLiveQuery),
// así que una respuesta lenta nunca pisa a una más nueva.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState } from 'react'
import { arsPorBs } from '../lib/moneda.js'
import { cambio, carrito, categorias, config, gastos, kiosco, pedidos, perfiles, productos, sitio, stock } from './repos/index.js'

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

const clave = (o) => JSON.stringify(o ?? {})

// Catálogo
export const useProductos = (filtros) => useConsulta(() => productos.listar(filtros), [clave(filtros)])
export const useProductosTienda = (filtros) => useConsulta(() => productos.listarTienda(filtros), [clave(filtros)])
export const useProductoPorSlug = (slug) => useConsulta(() => (slug ? productos.obtenerPorSlug(slug) : undefined), [slug])
export const useProducto = (id) => useConsulta(() => (id ? productos.obtener(id) : undefined), [id])
export const useBusquedaCodigo = (texto, limite) => useConsulta(() => productos.buscarPorCodigo(texto, limite), [texto, limite])
export const useCategorias = () => useConsulta(() => categorias.listar(), [])
export const useStockPorColor = (producto_id) => useConsulta(() => stock.stockPorColor(producto_id), [producto_id])
export const useStockResumen = () => useConsulta(() => stock.resumen(), [])
export const useStockReservado = () => useConsulta(() => stock.reservado(), [])

// Personas y configuración
export const usePerfiles = (opciones) => useConsulta(() => perfiles.listar(opciones), [clave(opciones)])
export const useConfig = () => useConsulta(() => config.todo(), [])
export const useSitio = () => useConsulta(() => sitio.obtener(), [])

// Tienda
export const useCarritoItems = () => useConsulta(() => carrito.items(), [])
export const usePedidos = (filtros) => useConsulta(() => pedidos.listar(filtros), [clave(filtros)])
export const usePedido = (id) => useConsulta(() => (id ? pedidos.obtener(id) : undefined), [id])
export const usePedidoPorCodigo = (codigo) => useConsulta(() => (codigo ? pedidos.obtenerPorCodigo(codigo) : undefined), [codigo])
export const useCobros = (filtros) => useConsulta(() => pedidos.cobros(filtros), [clave(filtros)])
export const useGastos = (filtros) => useConsulta(() => gastos.listar(filtros), [clave(filtros)])
export const useGastoCategorias = () => useConsulta(() => gastos.categorias(), [])

// Dispositivo de kiosco activado en este equipo (null si no está activado). Ver RutaKiosco.
export const useKioscoDispositivo = () => useConsulta(() => kiosco.dispositivo(), [])

// Conversión vigente de la tienda ("bs bolivianos = ars pesos"). `tasa` = pesos por 1 boliviano (null si no hay).
// Sale de config.cambio (que el repositorio mantiene al día); de respaldo, del tipo de cambio por dólar del sistema de nota.
// Porcentaje de recargo por pago en línea (0 si no hay). Lo carga la administración y el sitio lo recibe con la conversión.
export function useRecargoMp() {
  const c = useConfig()
  const pct = Number(c.datos?.recargo_mp?.pct)
  return Number.isFinite(pct) && pct > 0 ? pct : 0
}

export const useCambioHistorial = (version) => useConsulta(() => cambio.historial(), [version])

export function useCambio() {
  const c = useConfig()
  const cam = c.datos?.cambio
  const propio = arsPorBs(cam)
  const respaldo = arsPorBs(c.datos?.tipo_cambio)
  const tasa = propio ?? respaldo
  return {
    tasa,
    bs: propio ? cam.bs : null,
    ars: propio ? cam.ars : null,
    version: propio ? (cam.version ?? 0) : null,
    actualizado_en: cam?.actualizado_en ?? null,
    cargando: c.cargando,
  }
}
