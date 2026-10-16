// Respaldo de SOLO LECTURA de las tablas naty_* (y `proyectos`) a archivos NDJSON, uno por tabla.
//
// Qué hace: abre una transacción READ ONLY, lee cada tabla y la guarda como líneas JSON, más un manifiesto con
// el conteo y la huella SHA-256 de cada archivo. No escribe en la base. No guarda la cadena de conexión.
// Qué NO cubre: los archivos (fotos) del bucket de Storage, ni las cuentas de acceso (auth.users).
//
// Uso (PowerShell):
//   $env:DATABASE_URL = "postgresql://postgres.<ref>:<clave>@<host>:5432/postgres"
//   node Docs/tienda/herramientas/respaldo.mjs C:\respaldos\modas-naty-2026-10-15
//
// La carpeta de salida debe quedar FUERA del repositorio: contiene datos reales de clientas y ventas.
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, isAbsolute } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

const dentroDelRepo = (carpeta) => {
  const rel = relative(RAIZ_REPO, resolve(carpeta))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/**
 * @param {(sql: string) => Promise<{rows: any[]}>} consulta  función que ejecuta SQL y devuelve { rows }
 * @param {string} carpeta  carpeta de salida (fuera del repo)
 */
export async function respaldar(consulta, carpeta) {
  if (dentroDelRepo(carpeta)) throw new Error(`La carpeta de salida no puede estar dentro del repositorio: ${carpeta}`)
  mkdirSync(carpeta, { recursive: true })

  const { rows: tablas } = await consulta(
    `select c.relname as nombre from pg_class c join pg_namespace s on s.oid = c.relnamespace
      where s.nspname = 'public' and c.relkind = 'r' and (c.relname like 'naty\\_%' or c.relname = 'proyectos')
      order by 1`,
  )
  const manifiesto = { generado_en: new Date().toISOString(), solo_lectura: true, tablas: {} }
  for (const { nombre } of tablas) {
    const { rows } = await consulta(`select * from public."${nombre.replace(/"/g, '""')}"`)
    const texto = rows.map((f) => JSON.stringify(f)).join('\n') + (rows.length ? '\n' : '')
    writeFileSync(join(carpeta, `${nombre}.ndjson`), texto)
    manifiesto.tablas[nombre] = { filas: rows.length, sha256: createHash('sha256').update(texto).digest('hex') }
  }
  writeFileSync(join(carpeta, 'MANIFIESTO.json'), JSON.stringify(manifiesto, null, 2))
  return manifiesto
}

async function principal() {
  const url = process.env.DATABASE_URL
  const carpeta = process.argv[2]
  if (!url || !carpeta) {
    console.error('Falta DATABASE_URL (variable de entorno) o la carpeta de salida.\nUso: node respaldo.mjs <carpeta-fuera-del-repo>')
    process.exit(2)
  }
  if (dentroDelRepo(carpeta)) {
    console.error('La carpeta de salida está dentro del repositorio. Elegí otra (contiene datos reales).')
    process.exit(2)
  }
  const require = createRequire(join(RAIZ_REPO, 'app', 'package.json'))
  const { Client } = require('pg')
  const ca = process.env.PG_CA_FILE && existsSync(process.env.PG_CA_FILE) ? readFileSync(process.env.PG_CA_FILE, 'utf8') : undefined
  const cliente = new Client({ connectionString: url, ssl: { rejectUnauthorized: true, ca }, statement_timeout: 60000, query_timeout: 60000 })
  await cliente.connect()
  try {
    await cliente.query('begin read only')
    const m = await respaldar((sql) => cliente.query(sql), carpeta)
    await cliente.query('rollback')
    const total = Object.values(m.tablas).reduce((t, x) => t + x.filas, 0)
    console.log(`Listo: ${Object.keys(m.tablas).length} tablas, ${total} filas → ${resolve(carpeta)}`)
  } finally {
    await cliente.end()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((e) => {
    // Sin imprimir la cadena de conexión.
    console.error('Error:', String(e.message ?? e).replace(/postgres(ql)?:\/\/\S+/gi, '[conexión]'))
    if (/self.signed|unable to verify|certificate/i.test(String(e.message))) {
      console.error('El certificado no se pudo validar. Bajá el certificado raíz de Supabase (Database → SSL) y apuntá PG_CA_FILE a ese archivo.')
    }
    process.exit(1)
  })
}
