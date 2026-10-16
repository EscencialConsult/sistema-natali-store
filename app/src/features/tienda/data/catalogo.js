import { useEffect, useState } from 'react'
import { guardarCache, leerCache } from '../lib/cache.js'
import { clientePublico, supabaseUrl } from './clientePublico.js'

const COLUMNAS = 'id,codigo,nombre,categoria_id,categoria,descripcion,nuevo,precio_docena_usd_cent,fotos'
// Tope de seguridad. El catálogo real tiene unas decenas o pocas centenas de modelos.
const MAX_MODELOS = 1000

async function cliente() {
  const c = await clientePublico()
  if (!c) throw new Error('sin-servidor')
  return c
}

// Todo el catálogo en una sola consulta, ordenado por código.
export async function pedirTodo() {
  const { data, error } = await (await cliente())
    .from('tienda_catalogo_publico')
    .select(COLUMNAS)
    .order('codigo')
    .order('id')
    .limit(MAX_MODELOS)
  if (error) throw error
  return data
}

export async function pedirProducto(id) {
  const { data, error } = await (await cliente()).from('tienda_catalogo_publico').select(COLUMNAS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

// Los productos del carrito, con el precio y la publicación VIGENTES (lo que no vuelve ya no está disponible).
export async function pedirProductos(ids) {
  if (!ids.length) return []
  const { data, error } = await (await cliente()).from('tienda_catalogo_publico').select(COLUMNAS).in('id', ids.slice(0, 200))
  if (error) throw error
  return data
}

// Configuración editable de la tienda: la base solo devuelve las claves marcadas públicas.
export async function pedirConfig() {
  const { data, error } = await (await cliente()).from('tienda_config').select('clave,valor')
  if (error) throw error
  return Object.fromEntries(data.map((f) => [f.clave, f.valor]))
}

export async function pedirAjustes() {
  const { data, error } = await (await cliente()).from('tienda_ajustes_publicos').select('*').maybeSingle()
  if (error) throw error
  return data
}

// Datos que casi no cambian: se muestran de la caché propia mientras llegan los nuevos.
// `edadMaxMs`: pasado ese tiempo la copia guardada no se usa. Es lo que evita mostrar una cuenta de transferencia vieja sin conexión.
function useConCache(clave, pedir, edadMaxMs = Infinity) {
  const [estado, setEstado] = useState(() => {
    const guardada = leerCache(clave, supabaseUrl)
    const c = guardada && Date.now() - guardada.t <= edadMaxMs ? guardada : null
    return { datos: c?.datos ?? null, desde: c?.t ?? null, cargando: true, error: null, enCache: Boolean(c) }
  })
  useEffect(() => {
    let vigente = true
    pedir()
      .then((datos) => {
        guardarCache(clave, datos, supabaseUrl)
        if (vigente) setEstado({ datos, desde: Date.now(), cargando: false, error: null, enCache: false })
      })
      .catch((error) => vigente && setEstado((e) => ({ ...e, cargando: false, error })))
    return () => {
      vigente = false
    }
  }, [clave, pedir])
  return estado
}

// Incluye la cotización: se muestra con su fecha, pero una copia de más de 6 horas no se usa.
export const useAjustes = () => useConCache('ajustes', pedirAjustes, 6 * 3600000)
// La configuración incluye la cuenta de transferencia, que cambia cada 2 meses: su copia local vale 1 hora como máximo.
const HORA_MS = 3600000
export const useConfigTienda = () => useConCache('config', pedirConfig, HORA_MS)

// Productos del carrito al día. `listo` es falso mientras se consulta o si la consulta falló (no se confía en datos viejos).
export function useVigentes(ids) {
  const clave = [...ids].sort().join(',')
  const [estado, setEstado] = useState({ clave: null, mapa: new Map(), error: null })
  useEffect(() => {
    let vigente = true
    pedirProductos(clave ? clave.split(',') : [])
      .then((filas) => vigente && setEstado({ clave, mapa: new Map(filas.map((f) => [f.id, f])), error: null }))
      .catch((error) => vigente && setEstado({ clave, mapa: new Map(), error }))
    return () => {
      vigente = false
    }
  }, [clave])
  const listo = estado.clave === clave && !estado.error
  return { vigentes: estado.mapa, listo, cargando: estado.clave !== clave, error: estado.clave === clave ? estado.error : null }
}

// El estado guarda para QUÉ pedido es (id): si no coincide con el actual, se considera "cargando" sin tocar estado en el efecto.
export function useProducto(id) {
  const [estado, setEstado] = useState({ id: null, producto: null, error: null })
  useEffect(() => {
    let vigente = true
    pedirProducto(id)
      .then((producto) => vigente && setEstado({ id, producto, error: null }))
      .catch((error) => vigente && setEstado({ id, producto: null, error }))
    return () => {
      vigente = false
    }
  }, [id])
  const listo = estado.id === id
  return { producto: listo ? estado.producto : null, cargando: !listo, error: listo ? estado.error : null }
}

// ── Catálogo completo ─────────────────────────────────────────────────────────────────────────────────
// Memoria de la pestaña: al volver de una ficha o de la portada no se vuelve a pedir ni a mostrar "cargando".
// Vence a los 5 minutos para que los precios no queden viejos.
const TTL_MEMORIA = 5 * 60 * 1000
let memoria = null
const fresca = () => (memoria && Date.now() - memoria.t < TTL_MEMORIA ? memoria : null)

let scroll = { t: 0, y: 0 }
export const guardarScroll = (y) => {
  scroll = { t: Date.now(), y }
}
export const leerScroll = () => (Date.now() - scroll.t < TTL_MEMORIA ? scroll.y : 0)

/** @returns {{ items: any[]|null, cargando: boolean, error: any, desdeCache: boolean }} */
export function useCatalogoCompleto() {
  const [estado, setEstado] = useState(() => {
    const m = fresca()
    return m ? { items: m.items, cargando: false, error: null, desdeCache: false } : { items: null, cargando: true, error: null, desdeCache: false }
  })
  useEffect(() => {
    if (fresca()) return undefined
    let vigente = true
    pedirTodo()
      .then((items) => {
        memoria = { t: Date.now(), items }
        guardarCache('catalogo-completo', items, supabaseUrl)
        if (vigente) setEstado({ items, cargando: false, error: null, desdeCache: false })
      })
      .catch((error) => {
        if (!vigente) return
        // Sin red: se muestra la última lista guardada, avisando que puede no estar al día.
        const c = leerCache('catalogo-completo', supabaseUrl)
        setEstado(c ? { items: c.datos, cargando: false, error: null, desdeCache: true } : { items: null, cargando: false, error, desdeCache: false })
      })
    return () => {
      vigente = false
    }
  }, [])
  return estado
}

// Vendedores con WhatsApp: las personas con rol vendedor/a, activas y con teléfono en el sistema (vista pública, solo nombre y teléfono).
export async function pedirVendedores() {
  const { data, error } = await (await cliente()).from('tienda_vendedores_publicos').select('id,nombre,telefono').order('nombre').limit(50)
  if (error) throw error
  return data
}
export const useVendedores = () => useConCache('vendedores', pedirVendedores, 6 * 3600000)
