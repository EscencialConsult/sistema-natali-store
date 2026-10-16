// Carga los datos iniciales de la tienda (transferencia, locales, horarios, contactos, «Cómo comprar») en `tienda_config`.
//
// Es CARGA DE DATOS, no de estructura: solo escribe en `tienda_config` (tabla propia de la tienda) y nunca toca `naty_*`.
// Los datos se leen de un archivo JSON que debe estar FUERA del repositorio (tiene datos bancarios) y pasan por
// las mismas validaciones que el editor de Ajustes y las pantallas públicas.
//
// Uso (desde la raíz del repo, en PowerShell):
//   $env:DATABASE_URL = "postgresql://postgres.<ref>:<clave>@<host>:5432/postgres"
//   node app/scripts/cargar-config-tienda.mjs C:\ruta\fuera-del-repo\config-inicial.json            # prueba y revierte
//   node app/scripts/cargar-config-tienda.mjs C:\ruta\fuera-del-repo\config-inicial.json --aplicar  # guarda
//
// Formato del archivo: { "transferencia": {...}, "locales": [...], "horarios": [...], "contactos": [...], "como_comprar": [...], "tienda": { "cerrada": true } }
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { validarComoComprar, validarContactos, validarEstadoTienda, validarHorarios, validarLocales, validarQuienesSomos, validarTransferencia } from '../src/features/tienda/lib/configTienda.js'
import { validarTextos } from '../src/features/tienda/lib/textos.js'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Cada clave conocida con su validación. Una clave desconocida se rechaza: no se escribe nada que no se pueda verificar.
export const VALIDADORES = {
  transferencia: validarTransferencia,
  locales: validarLocales,
  horarios: validarHorarios,
  contactos: validarContactos,
  como_comprar: validarComoComprar,
  quienes_somos: validarQuienesSomos,
  // { "cerrada": true } publica la tienda cerrada al público; se abre después desde el Gestor web.
  tienda: validarEstadoTienda,
  // Textos de las páginas (ver lib/textos.js); lo normal es editarlos desde el Gestor web.
  textos: validarTextos,
}

/** @returns {{ filas: {clave: string, valor: any}[], errores: string[] }} */
export function prepararConfig(datos) {
  const errores = []
  const filas = []
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return { filas, errores: ['El archivo debe ser un objeto JSON.'] }
  for (const [clave, crudo] of Object.entries(datos)) {
    const validar = VALIDADORES[clave]
    if (!validar) {
      errores.push(`Clave desconocida: «${clave}». Se aceptan: ${Object.keys(VALIDADORES).join(', ')}.`)
      continue
    }
    const { valor, errores: e } = validar(crudo)
    if (e.length) {
      errores.push(...e.map((m) => `${clave}: ${m}`))
      continue
    }
    if (valor === null || (Array.isArray(valor) && valor.length === 0)) {
      errores.push(`${clave}: está vacío; no se carga.`)
      continue
    }
    filas.push({ clave, valor: clave === 'transferencia' ? { ...valor, actualizado_en: valor.actualizado_en || new Date().toISOString() } : valor })
  }
  return { filas, errores }
}

/**
 * @param {{ consulta: (sql: string, params?: any[]) => Promise<any>, ejecutar: (sql: string) => Promise<any>, datos: any, aplicar?: boolean }} o
 */
export async function cargarConfig({ consulta, ejecutar, datos, aplicar = false }) {
  const { filas, errores } = prepararConfig(datos)
  if (errores.length) return { estado: 'RECHAZADO', errores, claves: [] }
  if (!filas.length) return { estado: 'RECHAZADO', errores: ['No hay nada para cargar.'], claves: [] }

  await ejecutar('begin')
  try {
    const existe = await consulta(`select to_regclass('public.tienda_config')::text as t`)
    if (!existe.rows[0].t) {
      await ejecutar('rollback')
      return { estado: 'RECHAZADO', errores: ['Falta la tabla tienda_config: primero hay que aplicar el esquema de la tienda.'], claves: [] }
    }
    await ejecutar(`set local lock_timeout = '5s'`)
    for (const f of filas) {
      await consulta(
        `insert into tienda_config (clave, valor, publico) values ($1, $2::jsonb, true)
         on conflict (clave) do update set valor = excluded.valor, publico = true`,
        [f.clave, JSON.stringify(f.valor)],
      )
    }
    await ejecutar(aplicar ? 'commit' : 'rollback')
    return { estado: aplicar ? 'APLICADO' : 'PROBADO_Y_REVERTIDO', errores: [], claves: filas.map((f) => f.clave) }
  } catch (e) {
    await ejecutar('rollback').catch(() => {})
    return { estado: 'ERROR_REVERTIDO', errores: [String(e.message ?? e).replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]')], claves: [] }
  }
}

async function principal() {
  const args = process.argv.slice(2)
  const archivo = args.find((a) => !a.startsWith('--'))
  const aplicar = args.includes('--aplicar')
  const url = process.env.DATABASE_URL
  if (!archivo || !url) {
    console.error('Falta el archivo JSON o DATABASE_URL.\nUso: node app/scripts/cargar-config-tienda.mjs <archivo.json> [--aplicar]')
    process.exit(2)
  }
  const rel = relative(RAIZ, resolve(archivo))
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
    console.error('El archivo con los datos tiene que estar FUERA del repositorio (contiene datos bancarios).')
    process.exit(2)
  }
  const datos = JSON.parse(readFileSync(archivo, 'utf8').replace(/^\uFEFF/, ''))
  const require = createRequire(join(RAIZ, 'app', 'package.json'))
  const { Client } = require('pg')
  const ca = process.env.PG_CA_FILE && existsSync(process.env.PG_CA_FILE) ? readFileSync(process.env.PG_CA_FILE, 'utf8') : undefined
  const cliente = new Client({ connectionString: url, ssl: { rejectUnauthorized: true, ca }, query_timeout: 60000 })
  await cliente.connect()
  try {
    const r = await cargarConfig({ consulta: (s, p) => cliente.query(s, p), ejecutar: (s) => cliente.query(s), datos, aplicar })
    console.log(`Estado: ${r.estado}`)
    if (r.errores.length) console.log('Problemas:\n  - ' + r.errores.join('\n  - '))
    if (r.claves.length) console.log('Claves: ' + r.claves.join(', '))
    if (r.estado === 'PROBADO_Y_REVERTIDO') console.log('Era una prueba: no se guardó nada. Para guardar: --aplicar')
    process.exit(['APLICADO', 'PROBADO_Y_REVERTIDO'].includes(r.estado) ? 0 : 1)
  } finally {
    await cliente.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => {
    console.error('Error:', String(e.message ?? e).replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]'))
    process.exit(1)
  })
}
