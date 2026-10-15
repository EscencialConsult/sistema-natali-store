import { useCallback, useEffect, useMemo, useState } from 'react'
import { filtroKeyset, filtroTexto, TAMANO_PAGINA } from '../lib/consulta.js'
import { guardarCache, leerCache } from '../lib/cache.js'
import { clientePublico, supabaseUrl } from './clientePublico.js'

const COLUMNAS = 'id,codigo,nombre,categoria_id,categoria,descripcion,nuevo,precio_docena_usd_cent,fotos'

// Memoria de la sesión (solo en esta pestaña): al volver de una ficha se recupera la lista, los filtros y la posición.
// Vence a los 5 minutos para que los precios no queden viejos.
const TTL_MEMORIA = 5 * 60 * 1000
const memoria = new Map()
const fresca = (clave) => {
  const m = memoria.get(clave)
  return m && Date.now() - m.t < TTL_MEMORIA ? m : null
}
export const filtrosGuardados = { texto: '', categoriaId: '' }
export const guardarScroll = (clave, y) => {
  const m = memoria.get(clave)
  if (m) m.scrollY = y
}
export const leerScroll = (clave) => fresca(clave)?.scrollY ?? 0
export const olvidarMemoria = () => memoria.clear()

async function cliente() {
  const c = await clientePublico()
  if (!c) throw new Error('sin-servidor')
  return c
}

export async function pedirPagina({ despues = null, texto = '', categoriaId = '', tamano = TAMANO_PAGINA } = {}) {
  let q = (await cliente()).from('tienda_catalogo_publico').select(COLUMNAS).order('codigo').order('id').limit(tamano + 1)
  const k = filtroKeyset(despues)
  const t = filtroTexto(texto)
  if (k) q = q.or(k)
  if (t) q = q.or(t)
  if (categoriaId) q = q.eq('categoria_id', categoriaId)
  const { data, error } = await q
  if (error) throw error
  return { items: data.slice(0, tamano), hayMas: data.length > tamano }
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

export async function pedirCategorias() {
  const { data, error } = await (await cliente()).from('tienda_catalogo_publico').select('categoria_id,categoria').order('categoria').limit(2000)
  if (error) throw error
  const vistas = new Map()
  for (const f of data) if (f.categoria_id && !vistas.has(f.categoria_id)) vistas.set(f.categoria_id, f.categoria)
  return [...vistas].map(([id, nombre]) => ({ id, nombre }))
}

// Datos que casi no cambian: se muestran de la caché propia mientras llegan los nuevos.
function useConCache(clave, pedir) {
  const [estado, setEstado] = useState(() => {
    const c = leerCache(clave, supabaseUrl)
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

export const useAjustes = () => useConCache('ajustes', pedirAjustes)
export const useConfigTienda = () => useConCache('config', pedirConfig)

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
export const useCategorias = () => useConCache('categorias', pedirCategorias)

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

// Catálogo paginado por clave. Si la red falla y hay primera página en caché, se muestra esa (avisando que no es vigente).
export function useCatalogo({ texto, categoriaId }) {
  const clave = `${categoriaId}|${texto}`
  const [estado, setEstado] = useState(() => {
    const m = fresca(clave)
    return m ? { clave, items: m.items, hayMas: m.hayMas, error: null, desdeCache: m.desdeCache } : { clave: null, items: [], hayMas: false, error: null, desdeCache: false }
  })
  const [cargandoMas, setCargandoMas] = useState(false)
  const claveCache = `pagina1:${categoriaId || '-'}`

  useEffect(() => {
    if (fresca(clave)) return undefined // se volvió a la lista: ya está en memoria
    let vigente = true
    pedirPagina({ texto, categoriaId })
      .then((r) => {
        if (!texto) guardarCache(claveCache, r, supabaseUrl)
        if (vigente) setEstado({ clave, items: r.items, hayMas: r.hayMas, error: null, desdeCache: false })
      })
      .catch((error) => {
        if (!vigente) return
        const c = !texto ? leerCache(claveCache, supabaseUrl) : null
        if (c) setEstado({ clave, items: c.datos.items, hayMas: false, error: null, desdeCache: true })
        else setEstado({ clave, items: [], hayMas: false, error, desdeCache: false })
      })
    return () => {
      vigente = false
    }
  }, [clave, texto, categoriaId, claveCache])

  // Lo cargado queda en memoria para recuperarlo al volver; se conserva la posición guardada.
  useEffect(() => {
    if (estado.clave !== clave || estado.error || estado.desdeCache) return
    // Si lo que hay en memoria ya es esto mismo (se volvió a la lista), no se renueva el vencimiento:
    // así los precios no quedan "frescos" para siempre yendo y viniendo de las fichas.
    if (memoria.get(clave)?.items === estado.items) return
    memoria.set(clave, { t: Date.now(), items: estado.items, hayMas: estado.hayMas, desdeCache: false, scrollY: memoria.get(clave)?.scrollY ?? 0 })
  }, [clave, estado])

  const listo = estado.clave === clave
  const items = useMemo(() => (listo ? estado.items : []), [listo, estado.items])

  const cargarMas = useCallback(async () => {
    const ultimo = items.at(-1)
    if (!ultimo || cargandoMas) return
    setCargandoMas(true)
    try {
      const r = await pedirPagina({ despues: { codigo: ultimo.codigo, id: ultimo.id }, texto, categoriaId })
      setEstado((e) => (e.clave === clave ? { ...e, items: [...e.items, ...r.items], hayMas: r.hayMas } : e))
    } catch (error) {
      setEstado((e) => (e.clave === clave ? { ...e, error } : e))
    } finally {
      setCargandoMas(false)
    }
  }, [items, cargandoMas, texto, categoriaId, clave])

  return {
    items,
    hayMas: listo ? estado.hayMas : false,
    cargando: !listo,
    cargandoMas,
    error: listo ? estado.error : null,
    desdeCache: listo ? estado.desdeCache : false,
    cargarMas,
  }
}
