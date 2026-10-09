// Verificación de SOLO LECTURA de lo que dejó naty_schema.sql en la instancia (DATABASE_URL, Session pooler 5432).
// Comprueba: tablas y RLS, permisos de anon/authenticated, funciones, bucket y que los otros proyectos no se tocaron.
import pg from 'pg'

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const q = async (sql, params) => (await cliente.query(sql, params)).rows
let fallas = 0
const ok = (cond, texto) => {
  console.log(`${cond ? 'OK   ' : 'FALLA'}  ${texto}`)
  if (!cond) fallas++
}

await cliente.connect()
try {
  const tablas = (await q("select c.relname as t, c.relrowsecurity as rls, (select count(*)::int from pg_policy p where p.polrelid = c.oid) as politicas from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'naty\\_%' order by 1"))
  ok(tablas.length === 9, `9 tablas naty_* (hay ${tablas.length})`)
  ok(tablas.every((t) => t.rls), 'RLS activado en todas las tablas naty_*')
  for (const t of tablas) console.log(`        ${t.t}: ${t.politicas} política(s)`)

  const privilegios = await q(
    "select t.relname as tabla, has_table_privilege('anon', t.oid, 'select,insert,update,delete') as anon_todo, has_table_privilege('anon', t.oid, 'select') as anon_select, has_table_privilege('authenticated', t.oid, 'delete') as auth_delete, has_table_privilege('authenticated', t.oid, 'select') as auth_select from pg_class t join pg_namespace n on n.oid = t.relnamespace where n.nspname = 'public' and t.relkind = 'r' and t.relname like 'naty\\_%'",
  )
  ok(privilegios.every((p) => !p.anon_select), 'anon NO puede ni leer las tablas naty_*')
  ok(privilegios.every((p) => !p.auth_delete), 'authenticated NO puede borrar en ninguna tabla naty_*')
  ok(privilegios.every((p) => p.auth_select), 'authenticated puede leer (filtrado por las políticas de miembro)')

  const vista = await q("select has_table_privilege('anon', 'public.naty_catalogo_publico', 'select') as anon, has_table_privilege('authenticated', 'public.naty_catalogo_publico', 'select') as auth")
  ok(vista[0].anon && vista[0].auth, 'el catálogo público (vista) se puede leer sin login')

  const funcion = async (firma, rol) => (await q('select has_function_privilege($1, $2, $3) as p', [rol, firma, 'execute']))[0].p
  for (const f of ['naty_registrar_venta(jsonb)', 'naty_anular_venta(jsonb)', 'naty_guardar_producto(jsonb)']) {
    ok(!(await funcion(f, 'anon')) && (await funcion(f, 'authenticated')), `${f}: anon NO, authenticated sí`)
  }
  const alta = 'naty_configurar_usuario(text, naty_rol_usuario, text, text, text)'
  ok(!(await funcion(alta, 'anon')) && !(await funcion(alta, 'authenticated')), 'naty_configurar_usuario: ni anon ni authenticated (solo quien administra el proyecto)')

  const reg = await q("select estado, jsonb_array_length(tablas)::int as n from proyectos where identificador = 'naty'")
  ok(reg.length === 1, `registrado en proyectos (estado ${reg[0]?.estado}, ${reg[0]?.n} elementos)`)
  ok((await q('select count(*)::int as c from naty_config'))[0].c >= 6, 'ajustes base cargados')

  const bucket = await q("select public from storage.buckets where id = 'naty_productos'")
  ok(bucket.length === 1 && bucket[0].public === true, 'bucket naty_productos existe (lectura pública)')
  const polStorage = await q("select count(*)::int as c from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'storage' and c.relname = 'objects' and p.polname like 'naty\\_%'")
  ok(polStorage[0].c === 4, `4 políticas naty_* en storage.objects (hay ${polStorage[0].c})`)

  ok((await q("select count(*)::int as c from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and not t.tgisinternal"))[0].c === 0, 'sin triggers sobre auth.users')

  // Los otros proyectos no se tocaron: FAREP sigue en MODO CERRADO (RLS activado y CERO políticas).
  const farpep = await q("select c.relname as t, c.relrowsecurity as rls, (select count(*)::int from pg_policy p where p.polrelid = c.oid) as politicas from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'farpep\\_%'")
  ok(farpep.length === 10, `FAREP: sus 10 tablas siguen ahí (hay ${farpep.length})`)
  ok(farpep.every((t) => t.rls && t.politicas === 0), 'FAREP sigue en modo cerrado: RLS activado y cero políticas')
  ok((await q("select count(*)::int as c from proyectos"))[0].c === 2, 'la tabla proyectos tiene 2 proyectos (farpep y naty)')
} finally {
  await cliente.end()
}
console.log(fallas ? `\n${fallas} FALLA(S)` : '\nTodo en orden.')
process.exitCode = fallas ? 1 : 0
