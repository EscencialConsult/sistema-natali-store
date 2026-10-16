// Productos de prueba para recorrer la compra completa en la tienda local.
//   node scripts/productos-prueba.mjs crear     Crea (o reactiva) PRUEBA-010, PRUEBA-025 y PRUEBA-050, publicados y con stock.
//   node scripts/productos-prueba.mjs limpiar   Los da de baja y los despublica (no borra nada: el historial queda).
// Precio en Bs = pesos a cobrar cuando el servidor local usa 1 Bs = 1 ARS (Bs 10 → 10 pesos argentinos).
// Requiere DATABASE_URL del Session pooler (puerto 5432).
import { randomUUID } from 'node:crypto'
import pg from 'pg'

const PRODUCTOS = [
  { codigo: 'PRUEBA-010', nombre: 'PRUEBA · Producto de 10 pesos (no comprar)', bs: 10, slug: 'prueba-010' },
  { codigo: 'PRUEBA-025', nombre: 'PRUEBA · Producto de 25 pesos (no comprar)', bs: 25, slug: 'prueba-025' },
  { codigo: 'PRUEBA-050', nombre: 'PRUEBA · Producto de 50 pesos (no comprar)', bs: 50, slug: 'prueba-050' },
]
const ANTERIORES = ['PRUEBA-100'] // producto de la primera corrida: se da de baja al crear los nuevos
const modo = process.argv[2] ?? 'crear'
const url = process.env.DATABASE_URL
if (!url || url.includes(':6543')) {
  console.error('Falta DATABASE_URL del Session pooler (puerto 5432).')
  process.exit(1)
}
const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await db.connect()
const q = async (sql, p) => (await db.query(sql, p)).rows

async function categoria() {
  const [c] = await q("select id from naty_categorias where nombre = 'PRUEBAS'")
  if (c) return c.id
  const id = randomUUID()
  await q("insert into naty_categorias (id, nombre, orden) values ($1, 'PRUEBAS', 99)", [id])
  return id
}

try {
  await db.query('begin')
  if (modo === 'crear') {
    const cat = await categoria()
    for (const p of PRODUCTOS) {
      const cent = p.bs * 100
      const [existe] = await q('select id from naty_productos where codigo = $1', [p.codigo])
      if (existe) {
        await q('update naty_productos set activo = true, publicado_tienda = true, precio_unidad_bs_cent = $2, nuevo = true, destacado = true where id = $1', [existe.id, cent])
        console.log(`${p.codigo}: ya existía, reactivado (Bs ${p.bs}).`)
        continue
      }
      const id = randomUUID()
      const color = randomUUID()
      await q('insert into naty_productos (id, codigo, nombre, categoria_id, descripcion, precio_docena_usd_cent, activo, nuevo, destacado, precio_unidad_bs_cent, publicado_tienda, slug) values ($1, $2, $3, $4, $5, 100, true, true, true, $6, true, $7)', [
        id, p.codigo, p.nombre, cat, 'Producto de prueba del cobro con Mercado Pago. No comprar de verdad.', cent, p.slug,
      ])
      await q("insert into naty_producto_colores (id, producto_id, nombre, hex, orden) values ($1, $2, 'Único', '#8a3a63', 0)", [color, id])
      await q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, creado_en) values ($1, $2, $3, 'entrada', 50, 'Stock de la prueba', now())", [randomUUID(), id, color])
      console.log(`${p.codigo}: creado, Bs ${p.bs}, stock 50.`)
    }
    for (const codigo of ANTERIORES) {
      const r = await db.query('update naty_productos set activo = false, publicado_tienda = false where codigo = $1 and activo', [codigo])
      if (r.rowCount) console.log(`${codigo}: dado de baja (era de la corrida anterior).`)
    }
  } else if (modo === 'limpiar') {
    const codigos = [...PRODUCTOS.map((p) => p.codigo), ...ANTERIORES]
    const r = await db.query('update naty_productos set activo = false, publicado_tienda = false where codigo = any($1)', [codigos])
    console.log(`Productos de prueba dados de baja: ${r.rowCount}.`)
  } else {
    console.error('Modos: crear | limpiar')
  }
  await db.query('commit')
} catch (e) {
  await db.query('rollback').catch(() => {})
  console.error('Falló y no se cambió nada:', e.message)
  process.exitCode = 1
} finally {
  await db.end()
}
