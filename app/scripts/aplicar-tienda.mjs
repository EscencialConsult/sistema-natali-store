// Aplica app/supabase/tienda_schema.sql de forma segura. Reemplaza a aplicar-schema.mjs para la tienda (decisión D17).
//
// Qué garantiza:
//   1. Guardia estática: el archivo solo puede crear o tocar objetos `tienda_*`. Rechaza DELETE, TRUNCATE, DROP de
//      cualquier cosa que no sea tienda_, ALTER sobre naty_*, CREATE OR REPLACE sobre naty_*, extensiones y SQL dinámico.
//   2. Una sola transacción, con lock_timeout y statement_timeout cortos.
//   3. Foto de la estructura de Renzo ANTES y DESPUÉS (Docs/tienda/herramientas/linea-base.sql).
//      Si algo de naty_* o `proyectos` cambió, REVIERTE solo. Aunque la guardia estática no lo hubiera visto.
//   4. Por defecto NO aplica: prueba y revierte (dry-run). Para aplicar de verdad hace falta --aplicar.
//   5. TLS validado. La cadena de conexión viene de DATABASE_URL y nunca se imprime ni se guarda.
//
// Uso (desde la raíz del repo, en PowerShell):
//   $env:DATABASE_URL = "postgresql://postgres.<ref>:<clave>@<host>:5432/postgres"
//   node app/scripts/aplicar-tienda.mjs                      # prueba y revierte
//   node app/scripts/aplicar-tienda.mjs --aplicar            # aplica de verdad
//   node app/scripts/aplicar-tienda.mjs --guardar C:\respaldos\fotos   # guarda antes.json y despues.json
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { comparar } from '../../Docs/tienda/herramientas/comparar-linea-base.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '..', '..')
export const ARCHIVO_TIENDA = join(RAIZ, 'app', 'supabase', 'tienda_schema.sql')
export const LINEA_BASE_SQL = join(RAIZ, 'Docs', 'tienda', 'herramientas', 'linea-base.sql')

// ── Guardia estática ────────────────────────────────────────────────────────────
const sinComentarios = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
// Funciones de Renzo que se pueden LEER desde políticas y vistas (no se modifican).
const sinLecturasPermitidas = (t) => t.replace(/\bnaty_es_rol\s*\(|\bnaty_es_miembro\s*\(/gi, '(')
const nombreTienda = (n) => /^(tienda_|idx_tienda_|trg_tienda_)/i.test(n.replace(/^public\./i, '').replace(/"/g, ''))

export function verificarSoloTienda(sqlOriginal) {
  const sql = sinComentarios(sqlOriginal)
  const violaciones = []
  const mal = (msg) => violaciones.push(msg)

  if (/\btruncate\b/i.test(sql)) mal('TRUNCATE no está permitido')
  if (/\bdelete\s+from\b/i.test(sql)) mal('DELETE FROM no está permitido: la tienda no borra filas')
  if (/\bcreate\s+extension\b/i.test(sql)) mal('CREATE EXTENSION no está permitido')
  if (/\bset\s+(session\s+)?role\b|session_replication_role|\bdisable\s+trigger\b/i.test(sql)) mal('Cambios de rol o triggers no permitidos')
  if (/\balter\s+(type|database|system|role|default\s+privileges)\b/i.test(sql)) mal('ALTER TYPE/DATABASE/ROLE/DEFAULT PRIVILEGES no está permitido')
  if (/\bexecute\s+(format\s*\(|'|\$)/i.test(sql) || /\bexecute\s+[a-z_]+\s*(\(|;)/i.test(sql.replace(/execute\s+function/gi, ''))) {
    mal('SQL dinámico (EXECUTE) no está permitido: no se puede verificar estáticamente')
  }

  const objetos = /\b(create|alter|drop)\s+(?:or\s+replace\s+)?(?:unique\s+)?(?:temporary\s+|temp\s+)?(table|view|materialized\s+view|function|type|index|trigger|policy|sequence|schema)\s+(?:if\s+(?:not\s+)?exists\s+)?("?[\w.]+"?)(?:\s+on\s+("?[\w.]+"?))?/gi
  for (const m of sql.matchAll(objetos)) {
    const verbo = m[1].toLowerCase()
    const tipo = m[2].toLowerCase()
    const nombre = m[3]
    const sobre = m[4]
    if (tipo === 'schema') { mal(`${verbo.toUpperCase()} SCHEMA no está permitido`); continue }
    if (verbo === 'drop' && /^(table|type|schema|sequence|materialized\s+view)$/.test(tipo)) mal(`DROP ${tipo.toUpperCase()} ${nombre} no está permitido`)
    if (!nombreTienda(nombre)) mal(`${verbo.toUpperCase()} ${tipo.toUpperCase()} ${nombre}: el objeto no empieza con tienda_`)
    if (sobre && !nombreTienda(sobre)) mal(`${verbo.toUpperCase()} ${tipo.toUpperCase()} ${nombre} ON ${sobre}: la tabla no es tienda_`)
  }

  const resto = sinLecturasPermitidas(sql)
  // Cualquier otro uso de un objeto naty_ en una sentencia que no sea un SELECT de lectura es sospechoso.
  for (const trozo of resto.split(';')) {
    if (!/\bnaty_[a-z_]+/i.test(trozo) && !/\bproyectos\b/i.test(trozo)) continue
    if (/\b(insert|update|grant|revoke|alter|drop|comment|create\s+(trigger|index|policy|unique))\b/i.test(trozo)) {
      const sobreTienda = /\b(on|into|update|table)\s+(public\.)?"?tienda_/i.test(trozo) && !/\b(on|into|update|table)\s+(public\.)?"?(naty_|proyectos)/i.test(trozo)
      if (!sobreTienda) mal(`Sentencia que toca objetos de Renzo: «${trozo.trim().replace(/\s+/g, ' ').slice(0, 90)}…»`)
    }
  }
  return violaciones
}

// ── Aplicación ──────────────────────────────────────────────────────────────────
/**
 * @param {object} o
 * @param {(sql:string)=>Promise<{rows:any[]}>} o.consulta  una sentencia, devuelve filas
 * @param {(sql:string)=>Promise<any>} o.ejecutar  uno o varios comandos
 * @param {string} o.sql  contenido de tienda_schema.sql
 * @param {string} o.lineaBaseSql  contenido de linea-base.sql
 * @param {boolean} [o.aplicar]
 */
export async function aplicarTienda({ consulta, ejecutar, sql, lineaBaseSql, aplicar = false, guardia = verificarSoloTienda }) {
  // `guardia` solo se reemplaza en pruebas, para demostrar que la comparación antes/después atrapa lo que la guardia no vio.
  const violaciones = guardia(sql)
  if (violaciones.length) return { estado: 'RECHAZADO_POR_GUARDIA', violaciones, cambios: [] }

  const foto = async () => JSON.parse((await consulta(lineaBaseSql)).rows[0].linea_base)
  await ejecutar('begin')
  try {
    await ejecutar(`set local lock_timeout = '5s'`)
    await ejecutar(`set local statement_timeout = '60s'`)
    const antes = await foto()
    await ejecutar(sql)
    const despues = await foto()
    const cambios = comparar(antes, despues)
    const nuevos = (despues.relaciones ?? []).map((r) => r.nombre).filter((n) => /^tienda_/.test(n) && !(antes.relaciones ?? []).some((r) => r.nombre === n))
    if (cambios.length) {
      await ejecutar('rollback')
      return { estado: 'REVERTIDO_POR_CAMBIOS_EN_NATY', cambios, antes, despues, nuevos }
    }
    if (!aplicar) {
      await ejecutar('rollback')
      return { estado: 'PROBADO_Y_REVERTIDO', cambios: [], antes, despues, nuevos }
    }
    await ejecutar('commit')
    return { estado: 'APLICADO', cambios: [], antes, despues, nuevos }
  } catch (e) {
    await ejecutar('rollback').catch(() => {})
    return { estado: 'ERROR_REVERTIDO', error: String(e.message ?? e).replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]'), cambios: [] }
  }
}

// ── Línea de comandos ───────────────────────────────────────────────────────────
async function principal() {
  const args = process.argv.slice(2)
  const aplicar = args.includes('--aplicar')
  const iGuardar = args.indexOf('--guardar')
  const carpeta = iGuardar >= 0 ? args[iGuardar + 1] : null
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('Falta DATABASE_URL (variable de entorno). No se hizo nada.')
    process.exit(2)
  }
  if (carpeta) {
    const rel = relative(RAIZ, resolve(carpeta))
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
      console.error('--guardar debe apuntar a una carpeta fuera del repositorio.')
      process.exit(2)
    }
  }
  const require = createRequire(join(RAIZ, 'app', 'package.json'))
  const { Client } = require('pg')
  const ca = process.env.PG_CA_FILE && existsSync(process.env.PG_CA_FILE) ? readFileSync(process.env.PG_CA_FILE, 'utf8') : undefined
  const cliente = new Client({ connectionString: url, ssl: { rejectUnauthorized: true, ca }, query_timeout: 120000 })
  await cliente.connect()
  try {
    const r = await aplicarTienda({
      consulta: (s) => cliente.query(s),
      ejecutar: (s) => cliente.query(s),
      sql: readFileSync(ARCHIVO_TIENDA, 'utf8'),
      lineaBaseSql: readFileSync(LINEA_BASE_SQL, 'utf8'),
      aplicar,
    })
    console.log(`Estado: ${r.estado}`)
    if (r.violaciones?.length) console.log('Rechazado por la guardia:\n  - ' + r.violaciones.join('\n  - '))
    if (r.cambios?.length) console.log('Cambios detectados en objetos de Renzo (se revirtió todo):\n  - ' + r.cambios.join('\n  - '))
    if (r.error) console.log('Error (se revirtió todo): ' + r.error)
    if (r.nuevos?.length) console.log('Objetos nuevos: ' + r.nuevos.join(', '))
    if (carpeta && r.antes) {
      mkdirSync(carpeta, { recursive: true })
      writeFileSync(join(carpeta, 'linea-base-ANTES.json'), JSON.stringify(r.antes, null, 2))
      writeFileSync(join(carpeta, 'linea-base-DESPUES.json'), JSON.stringify(r.despues, null, 2))
      console.log(`Fotos guardadas en ${resolve(carpeta)}`)
    }
    if (!aplicar && r.estado === 'PROBADO_Y_REVERTIDO') console.log('Era una prueba: no quedó nada aplicado. Para aplicar de verdad: --aplicar')
    process.exit(['APLICADO', 'PROBADO_Y_REVERTIDO'].includes(r.estado) ? 0 : 1)
  } finally {
    await cliente.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => {
    console.error('Error:', String(e.message ?? e).replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]'))
    if (/self.signed|unable to verify|certificate/i.test(String(e.message))) {
      console.error('No se pudo validar el certificado. Bajá el certificado raíz de Supabase (Database → SSL) y apuntá PG_CA_FILE a ese archivo.')
    }
    process.exit(1)
  })
}
