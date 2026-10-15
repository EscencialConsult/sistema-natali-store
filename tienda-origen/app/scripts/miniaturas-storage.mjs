// Genera y sube al Storage las miniaturas (.mini.webp, 640 px) de las fotos de producto que todavía no la tienen.
//   DATABASE_URL (Session pooler 5432), SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno (nunca en archivos):
//   node scripts/miniaturas-storage.mjs            hace el trabajo
//   node scripts/miniaturas-storage.mjs --dry      solo cuenta qué falta
// La app pide `<ruta>.mini.webp` por convención (src/lib/fotos.js); si no existe, cae a la original y deja un 400 en consola.
import pg from 'pg'
import sharp from 'sharp'

const BUCKET = 'naty_productos'
const ANCHO = 640
const dry = process.argv.includes('--dry')
const { DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!DATABASE_URL || !SUPABASE_URL || (!dry && !SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('Faltan DATABASE_URL, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

const db = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
const { rows } = await db.query('select distinct ruta from naty_producto_fotos order by ruta')
await db.end()

const base = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object`
// ruta → ruta dentro del bucket (acepta URL pública completa o ruta relativa)
const dentroDelBucket = (ruta) => {
  const m = String(ruta).match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)$`))
  if (m) return decodeURI(m[1])
  return /^https?:/i.test(ruta) ? null : String(ruta)
}
const existe = async (clave) => (await fetch(`${base}/public/${BUCKET}/${encodeURI(clave)}`, { method: 'HEAD' })).ok

let hechas = 0
let yaEstaban = 0
let fallaron = 0
const pendientes = []
for (const { ruta } of rows) {
  const clave = dentroDelBucket(ruta)
  if (!clave || clave.endsWith('.mini.webp')) continue
  pendientes.push(clave)
}

async function procesar(clave) {
  const mini = `${clave}.mini.webp`
  if (await existe(mini)) {
    yaEstaban += 1
    return
  }
  if (dry) {
    hechas += 1
    return
  }
  const original = await fetch(`${base}/public/${BUCKET}/${encodeURI(clave)}`)
  if (!original.ok) throw new Error(`no se pudo leer ${clave} (${original.status})`)
  const buf = Buffer.from(await original.arrayBuffer())
  const meta = await sharp(buf).metadata()
  if ((meta.width ?? 0) <= ANCHO) {
    yaEstaban += 1 // la original ya es chica: la app usa esa
    return
  }
  const webp = await sharp(buf).resize({ width: ANCHO, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer()
  const r = await fetch(`${base}/${BUCKET}/${encodeURI(mini)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'image/webp', 'x-upsert': 'true' },
    body: webp,
  })
  if (!r.ok) throw new Error(`no se pudo subir ${mini} (${r.status})`)
  hechas += 1
}

// En paralelo (CONCURRENCIA, por defecto 6): el Storage responde 429 si se lo satura.
let i = 0
await Promise.all(
  Array.from({ length: Number(process.env.CONCURRENCIA ?? 6) }, async () => {
    while (i < pendientes.length) {
      const clave = pendientes[i++]
      try {
        await procesar(clave)
      } catch (e) {
        fallaron += 1
        console.error(' ×', e.message)
      }
    }
  }),
)
console.log(`${dry ? 'Faltan' : 'Generadas'}: ${hechas} · ya estaban o no hacen falta: ${yaEstaban} · con error: ${fallaron} · fotos revisadas: ${pendientes.length}`)

