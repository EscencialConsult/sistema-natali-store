// Verificación de SOLO LECTURA de lo que dejó tienda_schema.sql en la instancia (DATABASE_URL, Session pooler 5432).
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL (Session pooler, puerto 5432).')
  process.exit(1)
}
const cliente = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
const q = async (sql, params) => (await cliente.query(sql, params)).rows
let fallos = 0
const ok = (cond, texto) => {
  console.log(`${cond ? 'OK ' : 'MAL'} ${texto}`)
  if (!cond) fallos++
}
const funcion = async (firma, rol) => (await q(`select has_function_privilege($1, $2, 'execute') as p`, [rol, firma]))[0].p

await cliente.connect()
try {
  const tablas = await q("select c.relname as t, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'tienda\_%' order by 1")
  ok(tablas.length === 9, `9 tablas tienda_* (hay ${tablas.length}: ${tablas.map((t) => t.t).join(', ')})`)
  ok(tablas.every((t) => t.rls), 'RLS activado en todas las tablas tienda_*')
  const priv = await q("select t.relname as tabla, has_table_privilege('anon', t.oid, 'select') as anon_select, has_table_privilege('authenticated', t.oid, 'delete') as auth_delete from pg_class t join pg_namespace n on n.oid = t.relnamespace where n.nspname = 'public' and t.relkind = 'r' and t.relname like 'tienda\_%'")
  ok(priv.every((p) => !p.anon_select), 'anon no lee ninguna tabla tienda_*')
  ok(priv.every((p) => !p.auth_delete), 'authenticated no borra en ninguna tabla tienda_*')
  const vista = await q("select has_table_privilege('anon', 'public.tienda_catalogo_publico', 'select') as anon")
  ok(vista[0].anon, 'anon lee la vista tienda_catalogo_publico')
  for (const f of ['tienda_crear_pedido(jsonb)', 'tienda_pedido_publico(text, text)', 'tienda_sitio_publico()']) ok(await funcion(f, 'anon'), `${f}: anon puede ejecutar`)
  for (const f of ['tienda_vencer_reservas()', 'tienda_aplicar_estado(uuid, tienda_estado_pedido, text, uuid)']) ok(!(await funcion(f, 'anon')) && !(await funcion(f, 'authenticated')), `${f}: solo servicio`)
  const cols = await q("select column_name from information_schema.columns where table_name = 'naty_productos' and column_name in ('precio_unidad_bs_cent','publicado_tienda','destacado','slug')")
  ok(cols.length === 4, 'naty_productos tiene los 4 campos de la tienda')
  const enumv = await q("select enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'naty_tipo_movimiento' and enumlabel in ('reserva','liberacion','devolucion')")
  ok(enumv.length === 3, 'naty_tipo_movimiento tiene reserva/liberacion/devolucion')
  ok((await q("select 1 from storage.buckets where id = 'tienda_comprobantes' and not public")).length === 1, 'bucket tienda_comprobantes privado')
  ok((await q("select 1 from proyectos where identificador = 'tienda'")).length === 1, "registro 'tienda' en proyectos")
  ok((await q('select count(*)::int as c from tienda_gasto_categorias'))[0].c >= 6, 'categorías de gasto base')
} finally {
  await cliente.end()
}
console.log(fallos ? `\n${fallos} comprobación(es) fallaron` : '\nTodo en orden')
process.exit(fallos ? 1 : 0)
