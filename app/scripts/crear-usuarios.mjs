// Da de alta a las personas del equipo en la instancia: crea el usuario en Supabase Auth (API de administración, sin enviar correos)
// y le asigna rol, nombre e iniciales con naty_configurar_usuario. Es repetible: si el correo ya existe no vuelve a crearlo ni le cambia la clave.
//   node scripts/crear-usuarios.mjs --lista <archivo.json> --salida <archivo.md>
// Variables de entorno (NUNCA en el repo): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL (Session pooler 5432).
// El archivo --lista tiene los correos reales (datos personales) y debe vivir FUERA del proyecto; --salida recibe las contraseñas generadas.
//   lista: [ { "email": "...", "nombre": "...", "iniciales": "XX", "rol": "vendedor" }, ... ]
import { randomInt } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import pg from 'pg'

const arg = (nombre) => process.argv[process.argv.indexOf(nombre) + 1]
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL || !process.argv.includes('--lista') || !process.argv.includes('--salida')) {
  console.error('Faltan variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL) o los argumentos --lista y --salida.')
  process.exit(1)
}

const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin letras que se confunden (l, I, 1, O, 0)
const clave = () => Array.from({ length: 12 }, () => ALFABETO[randomInt(ALFABETO.length)]).join('') + '-' + randomInt(10, 99)

const lista = JSON.parse(readFileSync(arg('--lista'), 'utf8'))
const db = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
await db.connect()

const creados = []
const resultados = []
try {
  for (const p of lista) {
    const email = p.email.trim().toLowerCase()
    const existente = (await db.query('select id from auth.users where lower(email) = $1', [email])).rows[0]
    let estado = 'ya existía'
    if (!existente) {
      const password = clave()
      const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nombre: p.nombre } }),
      })
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}))
        resultados.push({ email, ok: false, detalle: `Auth rechazó el alta (${r.status}): ${cuerpo.msg ?? cuerpo.message ?? 'sin detalle'}` })
        continue
      }
      creados.push({ ...p, email, password })
      estado = 'creado'
    }
    await db.query('select naty_configurar_usuario($1, $2, $3, $4)', [email, p.rol, p.nombre, p.iniciales])
    resultados.push({ email, ok: true, detalle: `${estado} · ${p.rol} · ${p.nombre} (${p.iniciales})` })
  }
} finally {
  await db.end()
}

for (const r of resultados) console.log(`${r.ok ? 'OK   ' : 'FALLA'}  ${r.email}  ${r.detalle}`)
if (creados.length) {
  const filas = creados.map((c) => `| ${c.nombre} | ${c.rol} | ${c.email} | \`${c.password}\` |`)
  const tabla = ['| Persona | Rol | Correo | Contraseña inicial |', '|---|---|---|---|', ...filas, '']
  const salida = arg('--salida')
  if (existsSync(salida)) {
    // Nunca se pisa lo anterior: las contraseñas de corridas previas siguen siendo las vigentes.
    appendFileSync(salida, ['', `## Agregados el ${new Date().toISOString().slice(0, 10)}`, '', ...tabla].join('\n'), 'utf8')
  } else {
    writeFileSync(
      salida,
      ['# Modas Naty — usuarios y contraseñas iniciales', '', '> Archivo FUERA del proyecto a propósito (contiene contraseñas). Entregarlas a cada persona por un canal seguro y pedirle que la cambie.', '', ...tabla].join('\n'),
      'utf8',
    )
  }
  console.log(`\nContraseñas de los ${creados.length} usuarios nuevos guardadas en: ${salida}`)
}
process.exitCode = resultados.every((r) => r.ok) ? 0 : 1
