// Servidor LOCAL para probar la tienda completa contra la base real y Mercado Pago real, sin publicar nada:
//   · sirve la app compilada en modo real (dist-real/) con "vuelve a index.html" para las rutas del sitio;
//   · hace de Netlify para /.netlify/functions/*: ejecuta las MISMAS Functions de netlify/functions/ pero conectadas a
//     la base por DATABASE_URL (no hace falta la clave de servicio);
//   · cada 10 s concilia los pagos (como no hay dirección pública, el aviso de Mercado Pago no llega acá).
//
//   node --env-file=netlify/.env scripts/servidor-local.mjs            (variable DATABASE_URL en el entorno)
// No es para producción: en producción corre Netlify con el aviso firmado de Mercado Pago.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { clienteSql } from '../netlify/functions/_lib/clienteSql.js'
import { usarClienteServicio } from '../netlify/functions/_lib/supabase.js'

const PUERTO = Number(process.env.PUERTO ?? 5190)
const RAIZ = fileURLToPath(new URL('../dist-real/', import.meta.url))
const url = process.env.DATABASE_URL
if (!url || url.includes(':6543')) {
  console.error('Falta DATABASE_URL del Session pooler (puerto 5432).')
  process.exit(1)
}
if (!existsSync(join(RAIZ, 'index.html'))) {
  console.error('Falta compilar la app en modo real: scripts/compilar-real.ps1 (genera dist-real/).')
  process.exit(1)
}
// La dirección pública de la prueba es la de este servidor. El tipo de cambio sale de la base (lo carga la administración).
process.env.SITE_URL = `http://localhost:${PUERTO}`

const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await db.connect()
usarClienteServicio(clienteSql(db))

const funciones = {
  checkout: () => import('../netlify/functions/checkout.js'),
  'reconciliar-pagos': () => import('../netlify/functions/reconciliar-pagos.js'),
  'webhook-mercadopago': () => import('../netlify/functions/webhook-mercadopago.js'),
  salud: () => import('../netlify/functions/salud.js'),
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain' }

async function leerCuerpo(req) {
  const partes = []
  for await (const p of req) partes.push(p)
  return Buffer.concat(partes).toString('utf8')
}

async function llamarFuncion(nombre, req, res, ruta) {
  const cargar = funciones[nombre]
  if (!cargar) {
    res.writeHead(404, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Función no disponible en el servidor local' }))
    return
  }
  const { handler } = await cargar()
  const cuerpo = req.method === 'GET' || req.method === 'HEAD' ? '' : await leerCuerpo(req)
  const parametros = Object.fromEntries(new URL(req.url, 'http://x').searchParams)
  const r = await handler({ httpMethod: req.method, headers: req.headers, body: cuerpo, isBase64Encoded: false, queryStringParameters: parametros, path: ruta })
  res.writeHead(r.statusCode, r.headers ?? {}).end(r.body ?? '')
}

function estatico(req, res) {
  const limpio = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
  let archivo = join(RAIZ, limpio)
  if (!archivo.startsWith(RAIZ) || !existsSync(archivo) || statSync(archivo).isDirectory()) archivo = join(RAIZ, 'index.html')
  res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
  createReadStream(archivo).pipe(res)
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x')
    const m = /^\/\.netlify\/functions\/([\w-]+)/.exec(pathname)
    if (m) return await llamarFuncion(m[1], req, res, pathname)
    return estatico(req, res)
  } catch (e) {
    console.error('[servidor-local]', e.message)
    res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'Error del servidor local' }))
  }
}).listen(PUERTO, '127.0.0.1', () => {
  console.log(`Tienda en http://localhost:${PUERTO}  (base real y Mercado Pago de prueba; el tipo de cambio sale de la base)`)
})

// Conciliación periódica: confirma los pedidos pagados aunque no llegue el aviso.
const { conciliar } = await import('../netlify/functions/reconciliar-pagos.js')
const { rpcServicio, supabaseServicio } = await import('../netlify/functions/_lib/supabase.js')
let corriendo = false
setInterval(async () => {
  if (corriendo) return
  corriendo = true
  try {
    const r = await conciliar({ sb: supabaseServicio(), rpc: rpcServicio })
    if (r.confirmados > 0) console.log(`[conciliación] ${r.confirmados} pedido(s) confirmado(s):`, r.detalle.filter((d) => d.resultado === 'confirmado').map((d) => d.codigo).join(', '))
  } catch (e) {
    console.error('[conciliación]', e.message)
  } finally {
    corriendo = false
  }
}, 10_000)
