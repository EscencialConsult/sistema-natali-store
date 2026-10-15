// La vista pública de la base (leída como `anon`, igual que una compradora) se baja a la base local del dispositivo.
// Postgres real en memoria (PGlite) + IndexedDB falso: prueba que la forma de la vista y el mapeo a Dexie coinciden.
import 'fake-indexeddb/auto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { descargarCatalogoPublico, limpiarDatosPublicos } from '../sync/publico.js'
import { productos, stock } from '../repos/index.js'
import { como, crearServidor, q, rpc, USUARIOS as U } from './servidorPrueba.js'

const CAT = '10000000-0000-4000-8000-000000000001'
const P1 = '20000000-0000-4000-8000-000000000001'
const P2 = '20000000-0000-4000-8000-000000000002'
const ROJO = '30000000-0000-4000-8000-000000000001'
const AZUL = '30000000-0000-4000-8000-000000000002'
let pg
let n = 0
const uuid = () => `a0000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

// Cliente mínimo con la forma de supabase-js que usa la sincronización, leyendo la vista COMO ANÓNIMO.
const clienteAnonimo = () => ({
  from: (tabla) => ({
    select: () => ({
      order: () => ({
        range: async (a, b) => {
          try {
            const filas = await como(pg, null, () => q(pg, `select * from ${tabla} order by codigo limit ${b - a + 1} offset ${a}`))
            return { data: filas, error: null }
          } catch (e) {
            return { data: null, error: { message: e.message, code: e.code } }
          }
        },
      }),
    }),
  }),
  storage: { from: (b) => ({ getPublicUrl: (r) => ({ data: { publicUrl: `https://prueba.supabase.co/storage/v1/object/public/${b}/${r}` } }) }) },
})

// La publicación en la tienda la guarda la función de la tienda (como en la app real).
const publicar = (id, campos) => como(pg, U.maria.id, () => rpc(pg, 'tienda_guardar_publicacion', { id, ...campos }))

beforeAll(async () => {
  pg = await crearServidor()
  // El catálogo lo guarda la función del sistema de nota; la publicación en la tienda, la de la tienda (como en la app real).
  const guardar = async (id, codigo, nombre, extra) => {
    const { precio_unidad_bs_cent, publicado_tienda, destacado, ...catalogo } = extra
    await como(pg, U.maria.id, () =>
      rpc(pg, 'naty_guardar_producto', { id, codigo, nombre, categoria: { id: CAT, nombre: 'BLUSAS', orden: 3 }, descripcion: 'd', precio_docena_usd_cent: 1000, activo: true, ...catalogo }),
    )
    await publicar(id, { precio_unidad_bs_cent, publicado_tienda, destacado })
  }
  await guardar(P1, 'MN-001', 'Blusa Satín', { precio_unidad_bs_cent: 15000, publicado_tienda: true, destacado: true, nuevo: true, colores: [{ id: ROJO, nombre: 'Rojo', hex: '#f00', orden: 0 }, { id: AZUL, nombre: 'Azul', hex: '#00f', orden: 1 }], fotos: [{ id: uuid(), orden: 0, ruta: 'MN-001/1.jpg' }, { id: uuid(), orden: 1, ruta: 'https://cdn.test/otra.jpg' }] })
  await guardar(P2, 'MN-002', 'Oculta', { precio_unidad_bs_cent: 9000, publicado_tienda: false, colores: [], fotos: [] })
  await q(pg, "insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, creado_en) values ($1, $2, $3, 'entrada', 10, 'i', now()), ($4, $2, $5, 'entrada', 1, 'i', now())", [uuid(), P1, ROJO, uuid(), AZUL])
}, 60_000)
afterAll(() => pg?.close())

describe('sincronización pública del catálogo', () => {
  it('baja solo lo publicado, con categorías, colores, fotos y stock disponible', async () => {
    const r = await descargarCatalogoPublico(clienteAnonimo())
    expect(r).toEqual({ productos: 1, colores: 2 })
    const lista = await productos.listarTienda()
    expect(lista.map((p) => p.codigo)).toEqual(['MN-001'])
    expect(lista[0]).toMatchObject({ slug: 'blusa-satin-mn-001', precio_unidad_bs_cent: 15000, destacado: true, nuevo: true })
    expect(lista[0].colores.map((c) => c.nombre)).toEqual(['Rojo', 'Azul'])
    expect(lista[0].fotos.map((f) => f.ruta)).toEqual(['https://prueba.supabase.co/storage/v1/object/public/naty_productos/MN-001/1.jpg', 'https://cdn.test/otra.jpg'])
    expect((await db.categorias.toArray())[0]).toMatchObject({ nombre: 'BLUSAS', orden: 3 })
    const s = await stock.stockPorColor(P1)
    expect(s[ROJO]).toBe(10)
    expect(s[AZUL]).toBe(1)
    expect((await db.config.get('origen_datos')).valor).toBe('publico')
  })

  it('las reservas de pedidos pendientes bajan el disponible que ve el público', async () => {
    await como(pg, null, () => rpc(pg, 'tienda_crear_pedido', { id: uuid(), comprador_nombre: 'Ana', comprador_telefono: '59171234567', items: [{ producto_id: P1, color_id: AZUL, cantidad: 1 }, { producto_id: P1, color_id: ROJO, cantidad: 3 }] }))
    await descargarCatalogoPublico(clienteAnonimo())
    const s = await stock.stockPorColor(P1)
    expect(s[ROJO]).toBe(7)
    expect(s[AZUL] ?? 0).toBe(0)
  })

  it('lo que se despublica desaparece del dispositivo y la foto de stock no se acumula', async () => {
    await publicar(P1, { publicado_tienda: false })
    await descargarCatalogoPublico(clienteAnonimo())
    expect(await db.productos.count()).toBe(0)
    expect(await db.producto_colores.count()).toBe(0)
    expect(await db.movimientos_stock.count()).toBe(0)
  })

  it('al iniciar sesión se limpian los datos públicos para bajar el catálogo completo', async () => {
    await publicar(P1, { publicado_tienda: true, precio_unidad_bs_cent: 15000 })
    await descargarCatalogoPublico(clienteAnonimo())
    expect(await db.productos.count()).toBe(1)
    expect(await limpiarDatosPublicos()).toBe(true)
    expect(await db.productos.count()).toBe(0)
    expect(await db.movimientos_stock.count()).toBe(0)
    expect(await limpiarDatosPublicos()).toBe(false)
  })

  it('un error de la base se informa y no deja la base local a medias', async () => {
    await descargarCatalogoPublico(clienteAnonimo())
    const antes = await db.productos.count()
    const roto = { from: () => ({ select: () => ({ order: () => ({ range: async () => ({ data: null, error: { message: 'caído', code: '500' } }) }) }) }), storage: clienteAnonimo().storage }
    await expect(descargarCatalogoPublico(roto)).rejects.toThrow(/catálogo público/)
    expect(await db.productos.count()).toBe(antes)
  })
})
