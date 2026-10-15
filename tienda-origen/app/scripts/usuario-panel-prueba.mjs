// Usuario de PRUEBA para entrar al panel de la tienda con servidor (correo y contraseña de Supabase Auth).
//   node scripts/usuario-panel-prueba.mjs crear    Crea (o repone la contraseña de) panel.prueba@modasnaty.test, rol admin.
//   node scripts/usuario-panel-prueba.mjs quitar   Lo elimina por completo (perfil, identidad y usuario).
// No toca ningún usuario real de la instancia. Requiere DATABASE_URL del Session pooler (puerto 5432).
// La contraseña nueva se muestra UNA vez en la consola y no se guarda en ningún archivo.
import { randomBytes, randomUUID } from 'node:crypto'
import pg from 'pg'

const CORREO = 'panel.prueba@modasnaty.test'
const modo = process.argv[2] ?? 'crear'
const url = process.env.DATABASE_URL
if (!url || url.includes(':6543')) {
  console.error('Falta DATABASE_URL del Session pooler (puerto 5432).')
  process.exit(1)
}
const db = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await db.connect()
const q = async (sql, p) => (await db.query(sql, p)).rows

async function hash(clave) {
  // pgcrypto vive en el esquema `extensions` en Supabase; si no está en el search_path se prueba con el prefijo.
  try {
    return (await q("select crypt($1, gen_salt('bf')) as h", [clave]))[0].h
  } catch {
    return (await q("select extensions.crypt($1, extensions.gen_salt('bf')) as h", [clave]))[0].h
  }
}

try {
  await db.query('begin')
  const [ya] = await q('select id from auth.users where email = $1', [CORREO])
  if (modo === 'crear') {
    const clave = randomBytes(9).toString('base64url') + '9a' // mezcla de letras y números, 14+ caracteres
    const h = await hash(clave)
    let id = ya?.id
    if (id) {
      await q('update auth.users set encrypted_password = $2, updated_at = now(), email_confirmed_at = coalesce(email_confirmed_at, now()) where id = $1', [id, h])
    } else {
      id = randomUUID()
      await q(
        `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                                 created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
         values ((select instance_id from auth.users limit 1), $1, 'authenticated', 'authenticated', $2, $3, now(),
                 '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')`,
        [id, CORREO, h],
      )
      await q(
        `insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
         values ($1, $1::uuid, jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', now(), now(), now(), gen_random_uuid())`,
        [id, CORREO],
      )
    }
    await q("select naty_configurar_usuario($1, 'admin', 'Panel de prueba', 'PP')", [CORREO])
    console.log('Usuario de prueba listo.')
    console.log(`  Correo:     ${CORREO}`)
    console.log(`  Contraseña: ${clave}`)
    console.log('  Rol: administración. Para eliminarlo: node scripts/usuario-panel-prueba.mjs quitar')
  } else if (modo === 'quitar') {
    if (!ya) console.log('No existe el usuario de prueba.')
    else {
      await q('delete from naty_perfiles where id = $1', [ya.id])
      await q('delete from auth.identities where user_id = $1', [ya.id])
      await q('delete from auth.users where id = $1', [ya.id])
      console.log('Usuario de prueba eliminado.')
    }
  } else {
    console.error('Modos: crear | quitar')
  }
  await db.query('commit')
} catch (e) {
  await db.query('rollback').catch(() => {})
  console.error('Falló y no se cambió nada:', e.message)
  process.exitCode = 1
} finally {
  await db.end()
}
