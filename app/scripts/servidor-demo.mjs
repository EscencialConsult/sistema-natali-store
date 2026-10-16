// Servidor LOCAL de demostración. Para ver y probar la tienda y el sistema de notas sin tocar ninguna base real.
//
// Qué es: un único proceso (sin Docker) que
//   · corre el esquema REAL de Renzo (naty_schema.sql) y el de la tienda (tienda_schema.sql) en un Postgres en memoria (PGlite),
//     con sus permisos por rol y sus funciones: lo que la app hace acá es lo que haría contra Supabase;
//   · imita la parte de la API de Supabase que usa la app: login con usuario y contraseña, lectura y escritura de tablas,
//     funciones (rpc) y fotos;
//   · sirve la app compilada (carpeta dist-demo).
//
// Qué NO es: no es Supabase. Todo vive en memoria y se pierde al apagarlo. Escucha solo en 127.0.0.1. No usa ni conoce
// ninguna clave ni dato de producción: los usuarios, productos y datos bancarios son de ejemplo.
//
// Uso (desde la raíz del repo, con la unidad S: montada; ver Docs/tienda/herramientas/iniciar-dev.bat demo):
//   node app/scripts/servidor-demo.mjs [--puerto 4300]
import http from 'node:http'
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { cargarConfig } from './cargar-config-tienda.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const APP = resolve(AQUI, '..')
const RAIZ = resolve(APP, '..')
const DIST = join(APP, 'dist-demo')
const FOTOS = join(RAIZ, 'Docs', 'biblioteca-provisional', 'imagenes')
const PUERTO = Number(process.argv[process.argv.indexOf('--puerto') + 1]) || 4300
// Datos reales de la tienda (cuenta, locales), guardados FUERA del repo. Si el archivo existe, la demo los usa en vez de los de ejemplo;
// solo se sirven en 127.0.0.1. Se puede apuntar a otro archivo con DEMO_CONFIG_TIENDA.
const RUTA_CONFIG_REAL = process.env.DEMO_CONFIG_TIENDA ?? join(homedir(), '.claude', 'secretos', 'modas-naty-tienda-config-inicial.json')
const ANON_KEY = 'clave-publica-de-demostracion'
const JWT_SECRET = randomBytes(32).toString('hex')
const ALMACEN = join(tmpdir(), `modas-naty-demo-${process.pid}`)

export const USUARIOS_DEMO = [
  { usuario: 'natali', nombre: 'Natali (superadmin demo)', rol: 'superadmin', clave: 'Demo-Naty-2026', telefono: '59170000010' },
  { usuario: 'fabiana', nombre: 'Fabiana (admin demo)', rol: 'admin', clave: 'Demo-Naty-2026', telefono: '59170000011' },
  { usuario: 'pamela', nombre: 'Pamela Aramayo', rol: 'enc_tienda', clave: 'Demo-Naty-2026', telefono: '59170000001' },
  { usuario: 'ariel', nombre: 'Ariel Maydana', rol: 'vendedor', clave: 'Demo-Naty-2026', telefono: '59170000002' },
  { usuario: 'carla', nombre: 'Carla Mamani', rol: 'vendedor', clave: 'Demo-Naty-2026', telefono: '59170000003' },
]

// Ids fijos por nombre. El servidor arranca en memoria cada vez: si los ids cambiaran en cada arranque, la base local del
// navegador (que ya guardó usuarios y modelos de la vez anterior) chocaría con sus índices únicos (usuario, código) al sincronizar.
const uuidDe = (nombre) => {
  const h = createHash('sha1').update(`modas-naty-demo:${nombre}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`
}

// ── Base de datos ───────────────────────────────────────────────────────────────────────────────────
const STUB = `
  create role anon nologin; create role authenticated nologin;
  create schema extensions; create extension pgcrypto schema extensions;
  create schema auth;
  create table auth.users (
    instance_id uuid, id uuid primary key default gen_random_uuid(), aud text, role text, email text, encrypted_password text,
    email_confirmed_at timestamptz, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}',
    created_at timestamptz default now(), updated_at timestamptz default now(),
    confirmation_token text, recovery_token text, email_change_token_new text, email_change text);
  create table auth.identities (provider_id text, user_id uuid, identity_data jsonb, provider text,
    last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema extensions to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb default '{}');
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`

const CATEGORIAS = [
  [/blusa|camisa|polera|rib|top|halter|corset|body|camiseta/i, 'BLUSAS Y TOPS'],
  [/pantalon|short|wide|skinny|palazzo/i, 'PANTALONES Y SHORTS'],
  [/falda/i, 'FALDAS'],
  [/chaleco|blazer/i, 'CHALECOS Y BLAZERS'],
  [/vestido|conjunto|strapless/i, 'VESTIDOS Y CONJUNTOS'],
]
const categoriaDe = (f) => CATEGORIAS.find(([re]) => re.test(f))?.[1] ?? 'ACCESORIOS'
const bonito = (f) => f.replace(/\.jpg$/i, '').replace(/-+/g, ' ').replace(/^./, (c) => c.toUpperCase())

async function crearBase(puerto, configReal) {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(STUB)
  await db.exec(readFileSync(join(APP, 'supabase', 'naty_schema.sql'), 'utf8'))
  await db.exec(readFileSync(join(APP, 'supabase', 'tienda_schema.sql'), 'utf8'))

  // Ajustes del negocio (de ejemplo).
  const ajuste = (clave, valor) => db.query(`insert into naty_config (clave, valor) values ($1, $2::jsonb) on conflict (clave) do update set valor = excluded.valor`, [clave, JSON.stringify(valor)])
  await ajuste('negocio', { nombre: 'Modas Naty' })
  await ajuste('tipo_cambio', { bs: 12, ars: 1590, ejemplo: false, actualizado_en: new Date().toISOString() })
  await ajuste('mostrar_precios_publico', true)
  await ajuste('url_catalogo', `http://localhost:${puerto}/`)

  // Usuarios con contraseña real (la función de Renzo la guarda con crypt). Después se les fija un id estable (ver uuidDe):
  // las claves foráneas se saltean solo durante ese cambio de id, en esta base en memoria.
  for (const u of USUARIOS_DEMO) {
    const { rows } = await db.query(`select naty_crear_usuario_interno($1, $2, $3::naty_rol_usuario, $4, $5) as id`, [u.usuario, u.nombre, u.rol, u.clave, u.telefono])
    const viejo = rows[0].id
    const nuevo = uuidDe(`usuario:${u.usuario}`)
    await db.exec(`set session_replication_role = replica`)
    // El id nuevo va dos veces (uuid y texto): Postgres no deja usar un mismo parámetro con dos tipos.
    await db.query(`update auth.identities set user_id = $2, provider_id = $3::text, identity_data = jsonb_set(identity_data, '{sub}', to_jsonb($3::text)) where user_id = $1`, [viejo, nuevo, nuevo])
    await db.query(`update naty_perfiles set id = $2 where id = $1`, [viejo, nuevo])
    await db.query(`update auth.users set id = $2 where id = $1`, [viejo, nuevo])
    await db.exec(`set session_replication_role = default`)
  }

  // Catálogo de ejemplo con las fotos de la biblioteca provisional del repo.
  const archivos = existsSync(FOTOS) ? readdirSync(FOTOS).filter((f) => /\.jpg$/i.test(f)).sort().slice(0, 60) : []
  const ids = new Map()
  let orden = 0
  for (const f of archivos) {
    const nombreCat = categoriaDe(f)
    if (!ids.has(nombreCat)) {
      const id = uuidDe(`categoria:${nombreCat}`)
      ids.set(nombreCat, id)
      await db.query(`insert into naty_categorias (id, nombre, orden) values ($1, $2, $3)`, [id, nombreCat, orden++])
    }
  }
  let i = 0
  for (const f of archivos) {
    const codigo = `F${String(30 + i).padStart(4, '0')}`
    const id = uuidDe(`producto:${codigo}`)
    await db.query(
      `insert into naty_productos (id, codigo, nombre, categoria_id, descripcion, precio_docena_usd_cent, nuevo, activo)
       values ($1, $2, $3, $4, $5, $6, $7, true)`,
      [id, codigo, bonito(f), ids.get(categoriaDe(f)), 'Modelo de demostración.', [12000, 9000, 15000, 7500][i % 4], i % 5 === 0],
    )
    await db.query(`insert into naty_producto_fotos (id, producto_id, orden, ruta) values ($1, $2, 0, $3)`, [uuidDe(`foto:${codigo}:0`), id, `${codigo}/${f}`])
    await db.query(`insert into naty_movimientos_stock (id, producto_id, tipo, delta, motivo, creado_en) values ($1, $2, 'entrada', 72, 'Stock inicial de demostración', now())`, [uuidDe(`stock:${codigo}`), id])
    i += 1
  }

  // Configuración de ejemplo: cuenta FICTICIA; locales y horarios reales y públicos, con la esquina según OpenStreetMap
  // (Chalanitas exacta; 27 de Mayo aproximada: su calle no tiene nombre en el mapa. Las definitivas las carga la administración).
  const ejemplo = {
    transferencia: { titular: 'Cuenta de demostración', cuit: '20-12345678-6', banco: 'Banco de ejemplo', cbu: '0140000000000000000001', alias: 'demo.modas.naty', cuenta: '0000000001' },
    locales: [
      { nombre: 'Local 27 de Mayo', direccion: 'Calle sin nombre, esquina Colorados', horario: 'Lunes a sábado: 6:00 a 12:00 y 14:00 a 16:00', lat: -22.73105, lng: -64.3486 },
      { nombre: 'Local Chalanitas', direccion: 'Calle 23 de Marzo, esquina Colorados', horario: 'Lunes a sábado: 6:00 a 13:00 y 14:00 a 17:00', lat: -22.7307161, lng: -64.3502285 },
    ],
    contactos: USUARIOS_DEMO.filter((u) => u.rol === 'vendedor' || u.rol === 'enc_tienda').map((u) => ({ nombre: u.nombre, telefono: u.telefono })),
  }
  let datos = ejemplo
  let origenConfig = 'de ejemplo (cuenta ficticia)'
  if (configReal) {
    // Lo real pisa lo de ejemplo; un local real sin coordenadas toma las del local de ejemplo con el mismo nombre.
    const real = JSON.parse(readFileSync(configReal, 'utf8'))
    const locales = (real.locales ?? ejemplo.locales).map((l) => {
      if (l.lat != null && l.lng != null) return l
      const base = ejemplo.locales.find((e) => e.nombre === l.nombre)
      return base ? { ...l, lat: base.lat, lng: base.lng } : l
    })
    datos = { ...ejemplo, ...real, locales, contactos: real.contactos ?? ejemplo.contactos }
    origenConfig = `REAL, leída de ${configReal} (solo se sirve en esta máquina)`
  }
  const r = await cargarConfig({ consulta: (s, p) => db.query(s, p), ejecutar: (s) => db.exec(s), aplicar: true, datos })
  if (r.estado !== 'APLICADO') throw new Error(`No se pudo cargar la configuración de la tienda: ${r.errores.join('; ')}`)
  console.log(`Configuración de la tienda: ${origenConfig}`)
  return { db, productos: archivos.length }
}

// ── Sesiones (JWT HS256) ────────────────────────────────────────────────────────────────────────────
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
const firmar = (payload) => {
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`
  return `${cuerpo}.${createHmac('sha256', JWT_SECRET).update(cuerpo).digest('base64url')}`
}
function verificar(token) {
  const [h, p, s] = String(token).split('.')
  if (!h || !p || !s) return null
  const esperado = createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url')
  if (esperado !== s) return null
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'))
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null
  } catch {
    return null
  }
}
const refrescos = new Map() // refresh_token -> user id

// ── Servidor ────────────────────────────────────────────────────────────────────────────────────────
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' }
const IDENT = /^[a-z_][a-z0-9_]*$/i
const RESERVADOS = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

class ErrorApi extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}
const mal = (m) => new ErrorApi(400, 'PGRST100', m)

function leerCuerpo(req) {
  return new Promise((ok, fallo) => {
    const trozos = []
    req.on('data', (t) => trozos.push(t))
    req.on('end', () => ok(Buffer.concat(trozos)))
    req.on('error', fallo)
  })
}

// Valor de un filtro PostgREST: in.(a,b,"c d")
function listaIn(texto) {
  const dentro = texto.trim().replace(/^\(/, '').replace(/\)$/, '')
  const out = []
  let actual = ''
  let comillas = false
  for (const c of dentro) {
    if (c === '"') comillas = !comillas
    else if (c === ',' && !comillas) {
      out.push(actual)
      actual = ''
    } else actual += c
  }
  if (actual !== '' || out.length) out.push(actual)
  return out
}

function armarFiltros(params, valores) {
  const donde = []
  for (const [k, v] of params) {
    if (RESERVADOS.has(k)) continue
    if (!IDENT.test(k)) throw mal(`Columna inválida: ${k}`)
    const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.([\s\S]*)$/.exec(v)
    if (!m) throw mal(`Filtro no soportado: ${k}=${v}`)
    const [, no, op, val] = m
    const col = `"${k}"`
    const par = (x) => {
      valores.push(x)
      return `$${valores.length}`
    }
    let c
    if (op === 'is') {
      if (!['null', 'true', 'false', 'unknown'].includes(val)) throw mal(`Valor inválido para is: ${val}`)
      c = `${col} is ${val}`
    } else if (op === 'in') c = `${col} in (${listaIn(val).map(par).join(', ') || 'null'})`
    else if (op === 'like') c = `${col} like ${par(val.replace(/\*/g, '%'))}`
    else if (op === 'ilike') c = `${col} ilike ${par(val.replace(/\*/g, '%'))}`
    else c = `${col} ${{ eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[op]} ${par(val)}`
    donde.push(no ? `not (${c})` : c)
  }
  return donde
}

function armarOrden(texto) {
  if (!texto) return ''
  const partes = texto.split(',').map((p) => {
    const [col, dir = 'asc', nulos] = p.split('.')
    if (!IDENT.test(col) || !['asc', 'desc'].includes(dir)) throw mal(`Orden inválido: ${p}`)
    return `"${col}" ${dir}${nulos === 'nullsfirst' ? ' nulls first' : nulos === 'nullslast' ? ' nulls last' : ''}`
  })
  return ` order by ${partes.join(', ')}`
}

function estadoDeError(e, rol) {
  if (e instanceof ErrorApi) return e.status
  const c = e.code
  if (c === '42501') return rol === 'anon' ? 401 : 403
  if (c === '23505' || c === '23503') return 409
  if (c === '42P01') return 404
  return 400
}

// puerto: 0 elige uno libre (lo usan las pruebas automáticas).
// configReal: ruta a un JSON con la configuración real (ver RUTA_CONFIG_REAL); las pruebas no lo pasan y usan la de ejemplo.
export async function iniciarServidor({ puerto = PUERTO, configReal } = {}) {
  const { db, productos } = await crearBase(puerto, configReal)
  mkdirSync(ALMACEN, { recursive: true })

  // PGlite es de una sola conexión: las operaciones se encolan.
  let cola = Promise.resolve()
  const serializar = (fn) => {
    const r = cola.then(fn, fn)
    cola = r.catch(() => {})
    return r
  }
  const comoRol = (rol, uid, fn) =>
    serializar(async () => {
      await db.exec('begin')
      try {
        await db.exec(`set local role ${rol}`)
        await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? ''])
        const r = await fn()
        await db.exec('commit')
        return r
      } catch (e) {
        await db.exec('rollback').catch(() => {})
        throw e
      }
    })

  const json = (res, status, cuerpo, extra = {}) => {
    const texto = cuerpo === undefined ? '' : JSON.stringify(cuerpo)
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...extra })
    res.end(texto)
  }
  const sesion = (req) => {
    const t = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '')
    if (!t || t === ANON_KEY) return { rol: 'anon', uid: null }
    const p = verificar(t)
    if (!p) throw new ErrorApi(401, 'PGRST301', 'JWT inválido o vencido')
    return { rol: 'authenticated', uid: p.sub }
  }
  const usuarioJson = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.email_confirmed_at, app_metadata: u.raw_app_meta_data, user_metadata: u.raw_user_meta_data, created_at: u.created_at, updated_at: u.updated_at })
  const emitirSesion = (u) => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const refresh_token = randomBytes(12).toString('hex')
    refrescos.set(refresh_token, u.id)
    return { access_token: firmar({ aud: 'authenticated', exp, iat: Math.floor(Date.now() / 1000), sub: u.id, role: 'authenticated', email: u.email }), token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token, user: usuarioJson(u) }
  }

  async function autenticacion(req, res, url) {
    if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
      const cuerpo = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}')
      const modo = url.searchParams.get('grant_type')
      let u = null
      if (modo === 'password') {
        const r = await serializar(() =>
          db.query(`select * from auth.users where lower(email) = lower($1) and encrypted_password = extensions.crypt($2, encrypted_password)`, [String(cuerpo.email ?? ''), String(cuerpo.password ?? '')]),
        )
        u = r.rows[0] ?? null
      } else if (modo === 'refresh_token') {
        const id = refrescos.get(cuerpo.refresh_token)
        if (id) u = (await serializar(() => db.query(`select * from auth.users where id = $1`, [id]))).rows[0] ?? null
      }
      if (!u) return json(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials', message: 'Invalid login credentials', error: 'invalid_grant', error_description: 'Invalid login credentials' })
      return json(res, 200, emitirSesion(u))
    }
    if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
      const { uid } = sesion(req)
      if (!uid) throw new ErrorApi(401, 'no_authorization', 'Falta la sesión')
      const u = (await serializar(() => db.query(`select * from auth.users where id = $1`, [uid]))).rows[0]
      return u ? json(res, 200, usuarioJson(u)) : json(res, 404, { code: 404, msg: 'Usuario no encontrado' })
    }
    if (url.pathname === '/auth/v1/logout') {
      res.writeHead(204)
      return res.end()
    }
    return json(res, 404, { code: 404, msg: 'Endpoint de autenticación no soportado en la demostración' })
  }

  async function rest(req, res, url) {
    const { rol, uid } = sesion(req)
    const ruta = url.pathname.replace(/^\/rest\/v1\//, '')
    const prefer = String(req.headers.prefer ?? '')

    // Funciones (rpc)
    if (ruta.startsWith('rpc/')) {
      const fn = ruta.slice(4)
      if (!IDENT.test(fn)) throw mal('Función inválida')
      const args = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}')
      const nombres = Object.keys(args)
      if (!nombres.every((n) => IDENT.test(n))) throw mal('Argumento inválido')
      const valores = nombres.map((n) => (args[n] !== null && typeof args[n] === 'object' ? JSON.stringify(args[n]) : String(args[n])))
      const sql = `select public."${fn}"(${nombres.map((n, i) => `"${n}" => $${i + 1}`).join(', ')}) as r`
      const r = await comoRol(rol, uid, () => db.query(sql, valores))
      const v = r.rows[0]?.r
      return json(res, 200, v === '' || v === undefined ? null : v)
    }

    const rel = ruta.split('/')[0]
    if (!IDENT.test(rel)) throw mal('Tabla inválida')
    const tabla = `public."${rel}"`
    const valores = []

    if (req.method === 'GET' || req.method === 'HEAD') {
      const sel = url.searchParams.get('select') ?? '*'
      if (sel.includes('(')) throw mal('Las relaciones anidadas no están soportadas en la demostración')
      const cols = sel === '*' ? '*' : sel.split(',').map((c) => (IDENT.test(c.trim()) ? `"${c.trim()}"` : (() => { throw mal(`Columna inválida: ${c}`) })())).join(', ')
      const donde = armarFiltros(url.searchParams, valores)
      let limite = url.searchParams.get('limit')
      let desde = url.searchParams.get('offset')
      const rango = /^(\d+)-(\d+)$/.exec(String(req.headers.range ?? ''))
      if (rango && limite === null) {
        desde = rango[1]
        limite = String(Number(rango[2]) - Number(rango[1]) + 1)
      }
      const sql = `select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as j from (select ${cols} from ${tabla}${donde.length ? ` where ${donde.join(' and ')}` : ''}${armarOrden(url.searchParams.get('order'))}${limite ? ` limit ${Number(limite) | 0}` : ''}${desde ? ` offset ${Number(desde) | 0}` : ''}) t`
      const filas = (await comoRol(rol, uid, () => db.query(sql, valores))).rows[0].j
      if (String(req.headers.accept ?? '').includes('vnd.pgrst.object')) {
        if (filas.length !== 1) throw new ErrorApi(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned')
        return json(res, 200, filas[0])
      }
      return json(res, 200, filas, { 'content-range': `0-${Math.max(filas.length - 1, 0)}/*` })
    }

    const cuerpo = JSON.parse((await leerCuerpo(req)).toString('utf8') || 'null')
    const devolver = /return=representation/.test(prefer)
    const envolver = (consulta) => `with r as (${consulta} returning *) select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) as j from r`

    if (req.method === 'POST') {
      const filas = Array.isArray(cuerpo) ? cuerpo : [cuerpo]
      const cols = [...new Set(filas.flatMap((f) => Object.keys(f ?? {})))]
      if (!cols.length || !cols.every((c) => IDENT.test(c))) throw mal('Columnas inválidas')
      const lista = cols.map((c) => `"${c}"`).join(', ')
      const destino = url.searchParams.get('on_conflict')
      let conflicto = ''
      if (/resolution=merge-duplicates/.test(prefer) && destino) {
        const llave = destino.split(',').map((c) => c.trim())
        const resto = cols.filter((c) => !llave.includes(c))
        conflicto = ` on conflict (${llave.map((c) => `"${c}"`).join(', ')}) ${resto.length ? `do update set ${resto.map((c) => `"${c}" = excluded."${c}"`).join(', ')}` : 'do nothing'}`
      } else if (/resolution=ignore-duplicates/.test(prefer)) {
        conflicto = ` on conflict ${destino ? `(${destino.split(',').map((c) => `"${c.trim()}"`).join(', ')}) ` : ''}do nothing`
      }
      valores.push(JSON.stringify(filas))
      const base = `insert into ${tabla} (${lista}) select ${lista} from jsonb_populate_recordset(null::${tabla}, $1::jsonb)${conflicto}`
      if (!devolver) {
        await comoRol(rol, uid, () => db.query(base, valores))
        res.writeHead(201)
        return res.end()
      }
      const r = await comoRol(rol, uid, () => db.query(envolver(base), valores))
      return json(res, 201, r.rows[0].j)
    }

    if (req.method === 'PATCH') {
      const cols = Object.keys(cuerpo ?? {})
      if (!cols.length || !cols.every((c) => IDENT.test(c))) throw mal('Columnas inválidas')
      valores.push(JSON.stringify(cuerpo))
      const donde = armarFiltros(url.searchParams, valores)
      const sets = cols.map((c) => `"${c}" = (jsonb_populate_record(null::${tabla}, $1::jsonb))."${c}"`).join(', ')
      const base = `update ${tabla} set ${sets}${donde.length ? ` where ${donde.join(' and ')}` : ''}`
      if (!devolver) {
        await comoRol(rol, uid, () => db.query(base, valores))
        res.writeHead(204)
        return res.end()
      }
      return json(res, 200, (await comoRol(rol, uid, () => db.query(envolver(base), valores))).rows[0].j)
    }

    if (req.method === 'DELETE') {
      const donde = armarFiltros(url.searchParams, valores)
      if (!donde.length) throw mal('DELETE sin filtros no está permitido')
      const base = `delete from ${tabla} where ${donde.join(' and ')}`
      if (!devolver) {
        await comoRol(rol, uid, () => db.query(base, valores))
        res.writeHead(204)
        return res.end()
      }
      return json(res, 200, (await comoRol(rol, uid, () => db.query(envolver(base), valores))).rows[0].j)
    }
    throw new ErrorApi(405, 'PGRST000', 'Método no soportado')
  }

  // Fotos: se guardan en una carpeta temporal; lo que no existe se completa con la biblioteca provisional de ejemplo.
  function parteArchivo(cuerpo, tipo) {
    const m = /boundary=(.+)$/i.exec(tipo ?? '')
    if (!m) return cuerpo
    const marca = Buffer.from(`--${m[1].replace(/^"|"$/g, '')}`)
    let i = cuerpo.indexOf(marca)
    while (i !== -1) {
      const cab = cuerpo.indexOf('\r\n\r\n', i)
      const sigue = cuerpo.indexOf(marca, i + marca.length)
      if (cab === -1) break
      if (/filename=/i.test(cuerpo.subarray(i, cab).toString('latin1'))) {
        const fin = sigue === -1 ? cuerpo.length : sigue - 2
        return cuerpo.subarray(cab + 4, fin)
      }
      i = sigue
    }
    return cuerpo
  }
  const rutaSegura = (base, relativa) => {
    const destino = normalize(join(base, relativa))
    return destino === base || destino.startsWith(base + sep) ? destino : null
  }

  async function almacenamiento(req, res, url) {
    const publico = /^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(url.pathname)
    if (publico && req.method === 'GET') {
      const relativa = decodeURIComponent(publico[2])
      const propio = rutaSegura(join(ALMACEN, publico[1]), relativa)
      const demo = rutaSegura(FOTOS, basename(relativa))
      const archivo = [propio, demo].find((p) => p && existsSync(p) && statSync(p).isFile())
      if (!archivo) return json(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' })
      res.writeHead(200, { 'content-type': TIPOS[extname(archivo).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache' })
      return res.end(readFileSync(archivo))
    }
    const subida = /^\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(url.pathname)
    if (subida && (req.method === 'POST' || req.method === 'PUT')) {
      const { rol } = sesion(req)
      if (rol !== 'authenticated') throw new ErrorApi(401, 'Unauthorized', 'Hace falta iniciar sesión')
      const relativa = decodeURIComponent(subida[2])
      const destino = rutaSegura(join(ALMACEN, subida[1]), relativa)
      if (!destino) throw mal('Ruta inválida')
      mkdirSync(dirname(destino), { recursive: true })
      const bytes = parteArchivo(await leerCuerpo(req), req.headers['content-type'])
      writeFileSync(destino, bytes)
      // Igual que Supabase: el archivo queda registrado con su tamaño (lo usa el aviso de almacenamiento).
      await serializar(async () => {
        await db.query(`delete from storage.objects where bucket_id = $1 and name = $2`, [subida[1], relativa])
        await db.query(`insert into storage.objects (bucket_id, name, metadata) values ($1, $2, $3::jsonb)`, [subida[1], relativa, JSON.stringify({ size: bytes.length })])
      })
      return json(res, 200, { Key: `${subida[1]}/${relativa}`, Id: randomUUID() })
    }
    return json(res, 404, { statusCode: '404', error: 'not_found', message: 'Operación de almacenamiento no soportada en la demostración' })
  }

  function estatico(req, res, url) {
    let relativa = decodeURIComponent(url.pathname)
    let archivo = rutaSegura(DIST, relativa)
    if (!archivo || !existsSync(archivo) || !statSync(archivo).isFile()) {
      // Rutas de la aplicación (React Router): siempre la página principal. Un archivo con extensión que no existe es 404.
      if (extname(relativa)) {
        res.writeHead(404)
        return res.end()
      }
      archivo = join(DIST, 'index.html')
    }
    if (!existsSync(archivo)) {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
      return res.end('Falta compilar la demostración. Corré: Docs\\tienda\\herramientas\\iniciar-dev.bat demo')
    }
    res.writeHead(200, { 'content-type': TIPOS[extname(archivo).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-cache' })
    res.end(readFileSync(archivo))
  }

  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    res.setHeader('access-control-allow-origin', '*')
    res.setHeader('access-control-allow-headers', '*')
    res.setHeader('access-control-allow-methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD')
    res.setHeader('access-control-expose-headers', 'content-range')
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      return res.end()
    }
    try {
      if (url.pathname === '/salud') return json(res, 200, { ok: true, productos })
      if (url.pathname.startsWith('/auth/v1/')) return await autenticacion(req, res, url)
      if (url.pathname.startsWith('/rest/v1/')) return await rest(req, res, url)
      if (url.pathname.startsWith('/storage/v1/')) return await almacenamiento(req, res, url)
      return estatico(req, res, url)
    } catch (e) {
      const rol = (() => {
        try {
          return sesion(req).rol
        } catch {
          return 'anon'
        }
      })()
      return json(res, estadoDeError(e, rol), { code: e.code ?? 'PGRST000', message: String(e.message ?? e), details: e.detail ?? null, hint: e.hint ?? null })
    }
  })

  await new Promise((ok) => servidor.listen(puerto, '127.0.0.1', ok))
  return { servidor, url: `http://localhost:${servidor.address().port}`, productos, db }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  iniciarServidor({ configReal: existsSync(RUTA_CONFIG_REAL) ? RUTA_CONFIG_REAL : undefined })
    .then(({ url, productos }) => {
      console.log('\n=== Modas Naty · servidor de demostración ===')
      console.log(`Tienda:   ${url}/`)
      console.log(`Sistema:  ${url}/admin`)
      console.log(`Productos de ejemplo: ${productos}`)
      console.log('\nUsuarios (todos con la clave Demo-Naty-2026):')
      for (const u of USUARIOS_DEMO) console.log(`  ${u.usuario.padEnd(8)} ${u.rol}`)
      console.log('\nTodo vive en memoria: al apagar el servidor se pierde. Ctrl+C para salir.\n')
    })
    .catch((e) => {
      console.error('No se pudo iniciar:', e.message)
      process.exit(1)
    })
}
