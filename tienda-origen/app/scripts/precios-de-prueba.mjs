// Deja el catálogo listo para que el equipo pruebe comprando: publica los productos activos en la tienda con precios chicos
// (entre 5 y 25 pesos argentinos) y guarda los valores originales para poder volver atrás.
//   node scripts/precios-de-prueba.mjs estado      Muestra cuántos productos hay y si hay un respaldo guardado.
//   node scripts/precios-de-prueba.mjs aplicar     Publica y pone precios de prueba (guarda el respaldo la primera vez).
//   node scripts/precios-de-prueba.mjs restaurar   Vuelve a los precios y a la publicación originales.
// Solo toca los campos de TIENDA (precio_unidad_bs_cent y publicado_tienda): nunca el precio por docena en USD ni el stock.
// No toca los productos PRUEBA-*. Requiere DATABASE_URL del Session pooler (puerto 5432).
import pg from 'pg'

const modo = process.argv[2] ?? 'estado'
const url = process.env.DATABASE_URL
if (!url || url.includes(':6543')) {
  console.error('Falta DATABASE_URL del Session pooler (puerto 5432).')
  process.exit(1)
}
// Precios de prueba en pesos argentinos: se reparten en este orden, repitiendo, sobre los productos ordenados por código.
const PRECIOS_ARS = [5, 6, 10, 10, 20, 25, 8, 12, 15, 18, 7, 9, 14, 16, 22, 11]
const CLAVE_RESPALDO = 'respaldo_precios_prueba'

const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await db.connect()
const q = async (sql, p) => (await db.query(sql, p)).rows

try {
  const [{ valor: cambio }] = await q("select valor from tienda_config where clave = 'cambio'")
  const tasa = Number(cambio.ars) / Number(cambio.bs) // pesos por 1 boliviano
  const [respaldo] = await q('select valor from tienda_config where clave = $1', [CLAVE_RESPALDO])

  if (modo === 'estado') {
    const [r] = await q("select count(*) filter (where activo and codigo not like 'PRUEBA%')::int as candidatos, count(*) filter (where publicado_tienda)::int as publicados from naty_productos")
    console.log(`Conversión vigente: ${cambio.bs} Bs = ${cambio.ars} ARS (1 Bs = ${tasa} ARS)`)
    console.log(`Productos activos (sin PRUEBA): ${r.candidatos} · publicados en la tienda: ${r.publicados}`)
    console.log(respaldo ? `Respaldo guardado: ${Object.keys(respaldo.valor.productos).length} productos (${respaldo.valor.fecha})` : 'Sin respaldo: todavía no se aplicaron los precios de prueba.')
  } else if (modo === 'aplicar') {
    await db.query('begin')
    const productos = await q("select id, codigo, precio_unidad_bs_cent, publicado_tienda from naty_productos where activo and codigo not like 'PRUEBA%' order by codigo")
    if (!respaldo) {
      const copia = Object.fromEntries(productos.map((p) => [p.id, { precio: p.precio_unidad_bs_cent, publicado: p.publicado_tienda }]))
      await q('insert into tienda_config (clave, valor) values ($1, $2)', [CLAVE_RESPALDO, JSON.stringify({ fecha: new Date().toISOString(), productos: copia })])
      console.log(`Respaldo guardado de ${productos.length} productos.`)
    } else {
      console.log('Ya había un respaldo de los valores originales: se conserva.')
    }
    let i = 0
    for (const p of productos) {
      const ars = PRECIOS_ARS[i % PRECIOS_ARS.length]
      const bsCent = Math.round((ars / tasa) * 100)
      await q('update naty_productos set precio_unidad_bs_cent = $2, publicado_tienda = true where id = $1', [p.id, bsCent])
      i += 1
    }
    await db.query('commit')
    console.log(`Listo: ${productos.length} productos publicados con precios de ${Math.min(...PRECIOS_ARS)} a ${Math.max(...PRECIOS_ARS)} pesos argentinos.`)
  } else if (modo === 'restaurar') {
    if (!respaldo) {
      console.log('No hay respaldo guardado: no se cambió nada.')
    } else {
      await db.query('begin')
      const filas = Object.entries(respaldo.valor.productos)
      for (const [id, v] of filas) {
        await q('update naty_productos set precio_unidad_bs_cent = $2, publicado_tienda = $3 where id = $1', [id, v.precio, v.publicado])
      }
      await q('delete from tienda_config where clave = $1', [CLAVE_RESPALDO])
      await db.query('commit')
      console.log(`Restaurados ${filas.length} productos a sus valores originales.`)
    }
  } else {
    console.error('Modos: estado | aplicar | restaurar')
  }
} catch (e) {
  await db.query('rollback').catch(() => {})
  console.error('Falló y no se cambió nada:', e.message)
  process.exitCode = 1
} finally {
  await db.end()
}
