// Carga el catálogo de EJEMPLO (138 productos con foto, colores y stock inicial) en la instancia, para probar la app con algo real.
// NO son productos de la clienta: salen del sitio de referencia y las fotos traen precios de otra marca. Se reemplazan por el catálogo real.
//   node scripts/cargar-catalogo-demo.mjs [--forzar]
// Variables de entorno (NUNCA en el repo): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL (Session pooler 5432).
// Sube las fotos a Storage (bucket naty_productos) y escribe las tablas en UNA transacción. Si ya hay productos, no hace nada salvo --forzar.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { idDeterministico } from '../src/lib/id.js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DATABASE_URL.')
  process.exit(1)
}
const ruta = (rel) => fileURLToPath(new URL(rel, import.meta.url))
const seed = JSON.parse(readFileSync(ruta('../src/data/seed/productos.json'), 'utf8'))
const BUCKET = 'naty_productos'

const db = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
try {
  const [{ c }] = (await db.query('select count(*)::int as c from naty_productos')).rows
  if (c > 0 && !process.argv.includes('--forzar')) {
    console.log(`Ya hay ${c} productos cargados: no se hace nada (usar --forzar para sumar igual).`)
    process.exit(0)
  }
  const deposito = (await db.query("select id from naty_perfiles where rol in ('enc_deposito', 'admin') and activo order by (rol = 'enc_deposito') desc limit 1")).rows[0]
  if (!deposito) throw new Error('No hay ningún perfil de depósito o administración: dar de alta a las personas primero (crear-usuarios.mjs).')

  // 1) Fotos a Storage (en tandas, para no saturar la conexión).
  const productos = seed.productos.map((p) => ({ ...p, id: randomUUID() }))
  const urlPublica = (codigo) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${codigo}/seed.jpg`
  let subidas = 0
  const cola = [...productos]
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (cola.length) {
        const p = cola.shift()
        const archivo = ruta(`../public${p.fotos[0]}`)
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${p.codigo}/seed.jpg`, {
          method: 'POST',
          headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
          body: readFileSync(archivo),
        })
        if (!r.ok) throw new Error(`No se pudo subir la foto de ${p.codigo}: ${r.status} ${await r.text()}`)
        subidas++
      }
    }),
  )
  console.log(`Fotos subidas a Storage: ${subidas}`)

  // 2) Tablas, todo o nada.
  const categorias = seed.categorias.map((nombre, orden) => ({ id: idDeterministico(`categoria:${nombre}`), nombre, orden }))
  const idCat = new Map(categorias.map((c) => [c.nombre, c.id]))
  const colores = []
  const fotos = []
  const movimientos = []
  const ahora = new Date().toISOString()
  for (const p of productos) {
    fotos.push({ id: randomUUID(), producto_id: p.id, orden: 0, ruta: urlPublica(p.codigo) })
    p.colores.forEach((col, orden) => {
      const id = randomUUID()
      colores.push({ id, producto_id: p.id, nombre: col.nombre, hex: col.hex, orden })
      if (col.stock_unidades > 0) movimientos.push({ id: randomUUID(), producto_id: p.id, color_id: id, tipo: 'entrada', delta: col.stock_unidades, motivo: 'Stock inicial (ejemplo)', usuario_id: deposito.id, creado_en: ahora })
    })
  }
  const filasProductos = productos.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, categoria_id: idCat.get(p.categoria), descripcion: p.descripcion, precio_docena_usd_cent: p.precio_docena_usd_cent, nuevo: p.nuevo, activo: true }))

  const insertar = (tabla, filas) => {
    const columnas = Object.keys(filas[0]).map((c) => `"${c}"`).join(', ')
    return db.query(`insert into ${tabla} (${columnas}) select ${columnas} from json_populate_recordset(null::${tabla}, $1::json) on conflict do nothing`, [JSON.stringify(filas)])
  }
  await db.query('begin')
  try {
    await insertar('naty_categorias', categorias)
    await insertar('naty_productos', filasProductos)
    await insertar('naty_producto_colores', colores)
    await insertar('naty_producto_fotos', fotos)
    await insertar('naty_movimientos_stock', movimientos)
    await db.query('commit')
  } catch (e) {
    await db.query('rollback')
    throw e
  }
  console.log(`Cargado: ${categorias.length} categorías, ${filasProductos.length} productos, ${colores.length} colores, ${fotos.length} fotos, ${movimientos.length} movimientos de stock inicial.`)
} finally {
  await db.end()
}
