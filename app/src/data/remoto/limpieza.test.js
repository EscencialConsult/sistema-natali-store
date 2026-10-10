// Eliminar productos y liberar espacio, de punta a punta: funciones del servidor (permisos reales) + cómo se entera cada dispositivo.
import 'fake-indexeddb/auto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { productos, stock, ventas } from '../repos/index.js'
import { procesar } from '../sync/cola.js'
import { descargar, enviarRemoto } from '../sync/remoto.js'
import { clienteDe, crearServidor, USUARIOS as U } from './servidorPrueba.js'

const SUPER = { id: '00000000-0000-4000-8000-000000000009' }
const CAT = '10000000-0000-4000-8000-000000000001'
const A = { id: '20000000-0000-4000-8000-00000000000a', color: '30000000-0000-4000-8000-00000000000a', codigo: 'MN-A' }
const B = { id: '20000000-0000-4000-8000-00000000000b', color: '30000000-0000-4000-8000-00000000000b', codigo: 'MN-B' }
const MANANA = new Date(Date.now() + 86_400_000).toISOString()

let servidor
const q = async (sql, params) => (await servidor.db.query(sql, params)).rows
const rpc = (quien, nombre, p = {}) => clienteDe(servidor, quien.id).rpc(nombre, { p })
const bajar = (quien) => descargar(clienteDe(servidor, quien.id))
const enviar = (quien) => procesar({ enviar: (item) => enviarRemoto(clienteDe(servidor, quien.id), item) })
const dispositivoNuevo = async () => {
  await db.delete()
  await db.open()
}
const stockServidor = async (color) => (await q('select coalesce(sum(delta), 0)::int as s from naty_movimientos_stock where color_id = $1', [color]))[0].s
const vender = (prod, docenas = 1) => ventas.crear({ vendedor_id: U.ariel.id, moneda: 'usd', tipo_cambio: 1, metodo_pago: 'efectivo', items: [{ producto_id: prod.id, color_id: prod.color, cantidad: docenas, unidad: 'docena', precio_cent: 1000 }] })

beforeAll(async () => {
  servidor = await crearServidor()
  await q("insert into auth.users (id, email) values ($1, 'sa@test.local')", [SUPER.id])
  await q("select naty_configurar_usuario('sa@test.local', 'superadmin', 'Super', 'SA')")
  for (const p of [A, B]) {
    const r = await rpc(U.admin, 'naty_guardar_producto', {
      id: p.id, codigo: p.codigo, nombre: `Modelo ${p.codigo}`, categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, precio_docena_usd_cent: 1000, activo: true,
      colores: [{ id: p.color, nombre: 'Rojo', hex: '#c00', orden: 0 }], fotos: [{ id: p.color.replace('3000', '4000'), orden: 0, ruta: `https://prueba.supabase.co/storage/v1/object/public/naty_productos/${p.codigo}/a.jpg` }],
    })
    expect(r.error).toBeNull()
    await q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, creado_en) values (gen_random_uuid(), $1, $2, 'entrada', 120, 'inicial', '2026-01-01T00:00:00Z')", [p.id, p.color])
  }
  // Ariel vende A y B desde su celular.
  await dispositivoNuevo()
  await bajar(U.ariel)
  await vender(A)
  await vender(B)
  expect(await enviar(U.ariel)).toEqual({ enviadas: 2, errores: 0 })
}, 60_000)

afterAll(async () => servidor?.db.close())

describe('permisos', () => {
  it('un vendedor no elimina productos; la administración no borra notas ni historial (solo el superadmin)', async () => {
    expect((await rpc(U.ariel, 'naty_eliminar_productos', { ids: [A.id] })).error.message).toMatch(/Solo la administración/)
    expect((await rpc(U.maria, 'naty_eliminar_productos', { ids: [A.id] })).error.message).toMatch(/Solo la administración/)
    expect((await rpc(U.admin, 'naty_borrar_ventas', { antes_de: MANANA })).error.message).toMatch(/superadmin/)
    expect((await rpc(U.admin, 'naty_resumir_movimientos', { antes_de: MANANA })).error.message).toMatch(/superadmin/)
    expect((await rpc(U.admin, 'naty_previsualizar_limpieza', {})).error.message).toMatch(/superadmin/)
  })
})

describe('eliminar un producto vendido', () => {
  it('se va del servidor con su stock; la nota queda con la copia de código y nombre', async () => {
    const r = await rpc(U.admin, 'naty_eliminar_productos', { ids: [A.id] })
    expect(r.data).toEqual({ cantidad: 1, fotos: [`https://prueba.supabase.co/storage/v1/object/public/naty_productos/${A.codigo}/a.jpg`] })
    expect(await q('select id from naty_productos where id = $1', [A.id])).toHaveLength(0)
    expect(await q('select id from naty_movimientos_stock where producto_id = $1', [A.id])).toHaveLength(0)
    expect(await q('select codigo, producto_id, color_id from naty_venta_items where codigo = $1', [A.codigo])).toEqual([{ codigo: A.codigo, producto_id: null, color_id: null }])
  })

  it('el celular de Ariel lo quita al sincronizar y sus notas siguen completas', async () => {
    expect(await db.productos.get(A.id)).toBeTruthy()
    await bajar(U.ariel)
    expect(await db.productos.get(A.id)).toBeUndefined()
    expect(await db.producto_colores.where('producto_id').equals(A.id).count()).toBe(0)
    expect(await db.movimientos_stock.where('producto_id').equals(A.id).count()).toBe(0)
    expect(await db.ventas.count()).toBe(2)
    expect((await db.venta_items.toArray()).map((i) => i.codigo).sort()).toEqual([A.codigo, B.codigo])
  })

  it('una venta hecha sin señal de un producto ya eliminado entra igual (sin descontar stock)', async () => {
    await dispositivoNuevo()
    await db.productos.put({ id: A.id, codigo: A.codigo, nombre: 'Modelo viejo', activo: true, precio_docena_usd_cent: 1000 })
    await db.producto_colores.put({ id: A.color, producto_id: A.id, nombre: 'Rojo', hex: '#c00' })
    await db.perfiles.put({ id: U.ariel.id, nombre: U.ariel.nombre, iniciales: 'AM', rol: 'vendedor', activo: true })
    const v = await vender(A)
    expect(await enviar(U.ariel)).toEqual({ enviadas: 1, errores: 0 })
    expect(await q('select producto_id from naty_venta_items where venta_id = $1', [v.id])).toEqual([{ producto_id: null }])
    expect(await q('select id from naty_movimientos_stock where venta_id = $1', [v.id])).toHaveLength(0)
  })

  it('una edición vieja del producto (de un celular sin señal) no lo revive', async () => {
    const r = await rpc(U.admin, 'naty_guardar_producto', { id: A.id, codigo: A.codigo, nombre: 'Revivido', precio_docena_usd_cent: 1000, colores: [], fotos: [] })
    expect(r.error).toBeNull()
    expect(await q('select id from naty_productos where id = $1', [A.id])).toHaveLength(0)
  })

  it('anular una nota de un producto eliminado no falla (no hay stock que devolver)', async () => {
    await dispositivoNuevo()
    await bajar(U.admin)
    const item = (await db.venta_items.toArray()).find((i) => i.codigo === A.codigo)
    await ventas.anular(item.venta_id, { motivo: 'prueba', usuario_id: U.admin.id })
    expect((await enviar(U.admin)).errores).toBe(0)
  })
})

describe('productos dados de baja', () => {
  it('se eliminan todos de una vez', async () => {
    await dispositivoNuevo()
    await bajar(U.maria)
    const p = await productos.obtener(B.id)
    await productos.eliminar(p.id) // baja lógica
    await enviar(U.maria)
    const r = await rpc(SUPER, 'naty_eliminar_productos_de_baja')
    expect(r.data.cantidad).toBe(1)
    expect(await q('select count(*)::int as c from naty_productos')).toEqual([{ c: 0 }])
    await bajar(U.maria)
    expect(await db.productos.count()).toBe(0)
  })
})

describe('liberar espacio por fecha (superadmin)', () => {
  const C = { id: '20000000-0000-4000-8000-00000000000c', color: '30000000-0000-4000-8000-00000000000c', codigo: 'MN-C' }

  it('borrar notas anteriores a una fecha: se van del servidor y de los celulares; el stock no cambia y la numeración sigue', async () => {
    await rpc(U.admin, 'naty_guardar_producto', { id: C.id, codigo: C.codigo, nombre: 'C', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, precio_docena_usd_cent: 1000, activo: true, colores: [{ id: C.color, nombre: 'Rojo', hex: '#c00', orden: 0 }], fotos: [] })
    await q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, creado_en) values (gen_random_uuid(), $1, $2, 'entrada', 120, 'inicial', now())", [C.id, C.color])
    await dispositivoNuevo()
    await bajar(U.ariel)
    await vender(C, 2)
    await enviar(U.ariel)
    const stockAntes = await stockServidor(C.color)
    const numeroAlto = (await q("select max(numero) as n from naty_ventas where numero like 'NV-AM-%'"))[0].n

    expect((await rpc(SUPER, 'naty_previsualizar_limpieza', { antes_de: MANANA })).data.ventas).toBeGreaterThan(0)
    const r = await rpc(SUPER, 'naty_borrar_ventas', { antes_de: MANANA })
    expect(r.data).toBeGreaterThan(0)
    expect(await q('select count(*)::int as c from naty_ventas')).toEqual([{ c: 0 }])
    expect(await stockServidor(C.color)).toBe(stockAntes)
    expect((await q("select valor from naty_config where clave = 'numeros_borrados'"))[0].valor['NV-AM-']).toBe(Number(numeroAlto.slice(6)))

    await bajar(U.ariel)
    expect(await db.ventas.count()).toBe(0)
    expect(await db.venta_items.count()).toBe(0)
    expect(await stock.stockActual(C.id, C.color)).toBe(stockAntes)

    // Un celular nuevo no vuelve a usar números ya usados.
    await dispositivoNuevo()
    await bajar(U.ariel)
    const nueva = await vender(C)
    expect(Number(nueva.numero.slice(6))).toBe(Number(numeroAlto.slice(6)) + 1)
    await enviar(U.ariel)
  })

  it('resumir el historial de stock: queda un saldo por color, el stock es el mismo en el servidor y en el celular', async () => {
    await dispositivoNuevo()
    await bajar(U.maria)
    const antes = await stockServidor(C.color)
    const r = await rpc(SUPER, 'naty_resumir_movimientos', { antes_de: MANANA })
    expect(r.data).toBeGreaterThan(1)
    expect(await q('select tipo, delta from naty_movimientos_stock where color_id = $1', [C.color])).toEqual([{ tipo: 'saldo', delta: antes }])

    await bajar(U.maria)
    expect(await stock.stockActual(C.id, C.color)).toBe(antes)
    expect(await db.movimientos_stock.count()).toBe((await q('select count(*)::int as c from naty_movimientos_stock'))[0].c)
  })

  it('un celular que entra después no repite limpiezas viejas', async () => {
    await dispositivoNuevo()
    await bajar(U.maria)
    const n = await db.movimientos_stock.count()
    await bajar(U.maria)
    expect(await db.movimientos_stock.count()).toBe(n)
  })
})
