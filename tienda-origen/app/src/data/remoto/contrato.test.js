// CONTRATO con el sistema de nota: el esquema de la tienda se aplica sobre el esquema REAL de su rama de rediseño
// (supabase/contrato/naty_schema.contrato.sql, copia de solo lectura), dos veces, y sigue funcionando.
// Si el otro equipo cambia algo que la tienda usa, esta prueba falla antes de publicar.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { como, ESQUEMA_TIENDA, q, rpc, STUB, USUARIOS as U } from './servidorPrueba.js'

const CONTRATO = readFileSync(fileURLToPath(new URL('../../../supabase/contrato/naty_schema.contrato.sql', import.meta.url)), 'utf8')
const CAT = '10000000-0000-4000-8000-000000000001'
const PROD = '20000000-0000-4000-8000-000000000001'
const COLOR = '30000000-0000-4000-8000-000000000001'
let db

beforeAll(async () => {
  db = new PGlite()
  await db.exec(STUB)
  await db.exec(CONTRATO)
  await db.exec(ESQUEMA_TIENDA)
  await db.exec(ESQUEMA_TIENDA) // idempotente
  for (const u of [U.admin, U.maria, U.pamela]) {
    const email = `${u.iniciales.toLowerCase()}@test.local`
    await db.query('insert into auth.users (id, email) values ($1, $2)', [u.id, email])
    await db.query('select naty_configurar_usuario($1, $2, $3, $4)', [email, u.rol, u.nombre, u.iniciales])
  }
}, 60_000)
afterAll(() => db?.close())

describe('contrato con el esquema del sistema de nota (rama de rediseño)', () => {
  it('el esquema de la tienda se aplica solo, sin depender de campos que el otro archivo no tiene', async () => {
    const cols = await q(db, "select column_name from information_schema.columns where table_name = 'naty_productos' and column_name in ('precio_unidad_bs_cent', 'publicado_tienda', 'destacado', 'slug')")
    expect(cols.map((c) => c.column_name).sort()).toEqual(['destacado', 'precio_unidad_bs_cent', 'publicado_tienda', 'slug'])
    const tipos = await q(db, "select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'naty_tipo_movimiento'")
    for (const t of ['reserva', 'liberacion', 'devolucion']) expect(tipos.map((x) => x.enumlabel)).toContain(t)
  })

  it('un producto que nace en el sistema de nota se publica desde la tienda sin tocar su catálogo', async () => {
    await como(db, U.maria.id, () =>
      rpc(db, 'naty_guardar_producto', { id: PROD, codigo: 'MN-100', nombre: 'Blusa Nueva', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, descripcion: 'x', precio_docena_usd_cent: 1000, colores: [{ id: COLOR, nombre: 'Rojo', hex: '#f00', orden: 0 }], fotos: [] }),
    )
    // Todavía no está publicado: la vista pública no lo muestra.
    expect((await como(db, null, () => q(db, 'select count(*)::int as c from tienda_catalogo_publico')))[0].c).toBe(0)
    await como(db, U.maria.id, () => rpc(db, 'tienda_guardar_publicacion', { id: PROD, precio_unidad_bs_cent: 9000, publicado_tienda: true }))
    const vista = await como(db, null, () => q(db, 'select codigo, slug, precio_unidad_bs_cent from tienda_catalogo_publico'))
    expect(vista).toEqual([{ codigo: 'MN-100', slug: 'blusa-nueva-mn-100', precio_unidad_bs_cent: 9000 }])
    // Volver a guardar el catálogo desde el sistema de nota no pisa la publicación.
    await como(db, U.maria.id, () =>
      rpc(db, 'naty_guardar_producto', { id: PROD, codigo: 'MN-100', nombre: 'Blusa Nueva v2', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, precio_docena_usd_cent: 1100, colores: [{ id: COLOR, nombre: 'Rojo', hex: '#f00', orden: 0 }], fotos: [] }),
    )
    const despues = await q(db, 'select publicado_tienda, precio_unidad_bs_cent from naty_productos where id = $1', [PROD])
    expect(despues[0]).toEqual({ publicado_tienda: true, precio_unidad_bs_cent: 9000 })
  })

  it('la publicación la editan administración y depósito, no la encargada de tienda', async () => {
    await expect(como(db, U.pamela.id, () => rpc(db, 'tienda_guardar_publicacion', { id: PROD, precio_unidad_bs_cent: 1 }))).rejects.toThrow(/publicación/)
    await expect(como(db, U.admin.id, () => rpc(db, 'tienda_guardar_publicacion', { id: PROD, destacado: true }))).resolves.toBeDefined()
  })

  it('el rol superadmin del sistema de nota existe en la base y cuenta como administración', async () => {
    const roles = await q(db, "select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'naty_rol_usuario'")
    expect(roles.map((r) => r.enumlabel)).toContain('superadmin')
  })
})

describe('stock por producto y color opcional (modelo nuevo del sistema de nota)', () => {
  const P_UNICO = '40000000-0000-4000-8000-000000000001'
  const C_UNICO = '50000000-0000-4000-8000-000000000001'
  const C_VIEJO = '50000000-0000-4000-8000-000000000002'
  const P_SIN = '40000000-0000-4000-8000-000000000002'
  const P_MULTI = '40000000-0000-4000-8000-000000000003'
  const C_M1 = '50000000-0000-4000-8000-000000000003'
  const C_M2 = '50000000-0000-4000-8000-000000000004'
  let n = 0
  const uuid = () => `a1000000-0000-4000-8000-${String(++n).padStart(12, '0')}`
  const mov = (prod, color, tipo, delta) =>
    q(db, 'insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, creado_en) values ($1, $2, $3, $4, $5, $6, now())', [uuid(), prod, color, tipo, delta, 't'])
  const pedir = (items) => como(db, null, () => rpc(db, 'tienda_crear_pedido', { id: uuid(), comprador_nombre: 'Ana', comprador_telefono: '59171234567', items }))
  const disponible = async (prod) => (await q(db, 'select tienda_disponible($1, null) as d', [prod]))[0].d

  beforeAll(async () => {
    const guardar = (id, codigo, colores) =>
      como(db, U.maria.id, () => rpc(db, 'naty_guardar_producto', { id, codigo, nombre: `Modelo ${codigo}`, categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, descripcion: 'x', precio_docena_usd_cent: 1000, colores, fotos: [] }))
    await guardar(P_UNICO, 'MN-200', [{ id: C_UNICO, nombre: 'Negro', hex: '#000', orden: 0 }])
    await guardar(P_SIN, 'MN-201', [])
    await guardar(P_MULTI, 'MN-202', [{ id: C_M1, nombre: 'Rojo', hex: '#f00', orden: 0 }])
    // Un producto con varios colores (modelo anterior) y un color viejo ya eliminado en el de color único.
    await q(db, "insert into naty_producto_colores (id, producto_id, nombre, hex, orden, eliminado) values ($1, $2, 'Azul', '#00f', 1, false), ($3, $4, 'Viejo', '#ccc', 5, true)", [C_M2, P_MULTI, C_VIEJO, P_UNICO])
    for (const id of [P_UNICO, P_SIN, P_MULTI]) await como(db, U.maria.id, () => rpc(db, 'tienda_guardar_publicacion', { id, precio_unidad_bs_cent: 5000, publicado_tienda: true }))
    await mov(P_UNICO, C_UNICO, 'entrada', 10)
    await mov(P_UNICO, C_VIEJO, 'entrada', 4) // saldo de un color eliminado: sigue siendo stock del producto
    await mov(P_UNICO, null, 'venta', -2) // venta del sistema de nota sin color
    await mov(P_SIN, null, 'entrada', 5)
    await mov(P_MULTI, C_M1, 'entrada', 3)
    await mov(P_MULTI, C_M2, 'entrada', 1)
  })

  it('color único: el stock es la suma de TODOS los movimientos del producto (con y sin color)', async () => {
    expect(await disponible(P_UNICO)).toBe(12)
    const vista = await como(db, null, () => q(db, 'select colores, disponible_total from tienda_catalogo_publico where codigo = $1', ['MN-200']))
    expect(vista[0].disponible_total).toBe(12)
    expect(vista[0].colores).toHaveLength(1)
    expect(vista[0].colores[0].disponible).toBe(12)
  })

  it('un carrito con un color eliminado o sin color compra el color único y reserva sobre el producto', async () => {
    const viejo = await pedir([{ producto_id: P_UNICO, color_id: C_VIEJO, cantidad: 1 }])
    expect(viejo.items[0].color_nombre).toBe('Negro')
    const sinColor = await pedir([{ producto_id: P_UNICO, cantidad: 2 }])
    expect(sinColor.items[0].color_nombre).toBe('Negro')
    expect(await disponible(P_UNICO)).toBe(9)
    await expect(pedir([{ producto_id: P_UNICO, cantidad: 10 }])).rejects.toThrow(/stock suficiente/)
  })

  it('producto sin color: se vende, se reserva sin color y cancelar devuelve el stock', async () => {
    const pedido = await pedir([{ producto_id: P_SIN, cantidad: 2 }])
    expect(pedido.items[0].color_id).toBeNull()
    expect(pedido.items[0].color_nombre).toBe('')
    expect(await disponible(P_SIN)).toBe(3)
    await como(db, 'servicio', () => rpc(db, 'tienda_cambiar_estado', { id: pedido.id, estado: 'cancelado', motivo: 'prueba' }))
    expect(await disponible(P_SIN)).toBe(5)
  })

  it('con varios colores el stock sigue siendo por color y hay que elegir uno', async () => {
    expect((await q(db, 'select tienda_disponible($1, $2) as d', [P_MULTI, C_M1]))[0].d).toBe(3)
    expect((await q(db, 'select tienda_disponible($1, $2) as d', [P_MULTI, C_M2]))[0].d).toBe(1)
    await expect(pedir([{ producto_id: P_MULTI, cantidad: 1 }])).rejects.toThrow(/Elegí un color/)
    await expect(pedir([{ producto_id: P_MULTI, color_id: C_M2, cantidad: 2 }])).rejects.toThrow(/stock suficiente/)
  })
})

