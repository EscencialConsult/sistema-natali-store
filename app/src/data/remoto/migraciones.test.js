// Prueba las migraciones de supabase/migrations contra un Postgres real en memoria (PGlite):
// esquema, permisos por rol (RLS), funciones de venta/anulación/producto y vista pública.
// En Supabase real existen auth.uid(), los roles anon/authenticated y Storage; acá se simulan con un stub mínimo.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const esquema = readFileSync(fileURLToPath(new URL('../../../supabase/naty_schema.sql', import.meta.url)), 'utf8')

const STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`

const U = {
  admin: '00000000-0000-4000-8000-000000000001',
  ariel: '00000000-0000-4000-8000-000000000002',
  brayan: '00000000-0000-4000-8000-000000000003',
  maria: '00000000-0000-4000-8000-000000000004',
  pamela: '00000000-0000-4000-8000-000000000005',
  jehovana: '00000000-0000-4000-8000-000000000006',
  intruso: '00000000-0000-4000-8000-000000000007',
}
const CAT = '10000000-0000-4000-8000-000000000001'
const PROD = '20000000-0000-4000-8000-000000000001'
const ROJO = '30000000-0000-4000-8000-000000000001'
const AZUL = '30000000-0000-4000-8000-000000000002'
let n = 0
const uuid = () => `a0000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

let db
const como = async (usuario, fn) => {
  await db.exec(`set role ${usuario ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${usuario ?? ''}', false);`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}
const q = async (sql, params) => (await db.query(sql, params)).rows
const stockDe = async (color) => (await q('select coalesce(sum(delta), 0)::int as s from naty_movimientos_stock where color_id = $1', [color]))[0].s

const venta = (extra = {}) => {
  const idVenta = uuid()
  return {
    id: idVenta,
    numero: 'NV-AM-0001',
    vendedor_id: U.ariel,
    vendedor_nombre: 'Ariel Maydana',
    moneda: 'usd',
    tipo_cambio: 1,
    metodo_pago: 'efectivo',
    cliente_nombre: 'Ana',
    cliente_telefono: '',
    total_cent: 2 * 10000 + 1 * 5000,
    creada_en: '2026-10-08T15:00:00Z',
    items: [
      { id: uuid(), producto_id: PROD, color_id: ROJO, codigo: 'MN-001', nombre: 'Blusa', color_nombre: 'Rojo', cantidad: 2, unidad: 'docena', unidades: 24, precio_cent: 10000, subtotal_cent: 20000 },
      { id: uuid(), producto_id: PROD, color_id: AZUL, codigo: 'MN-001', nombre: 'Blusa', color_nombre: 'Azul', cantidad: 1, unidad: 'docena', unidades: 12, precio_cent: 5000, subtotal_cent: 5000 },
    ],
    movimientos: [
      { id: uuid(), producto_id: PROD, color_id: ROJO, delta: -24, motivo: 'NV-AM-0001', creado_en: '2026-10-08T15:00:00Z' },
      { id: uuid(), producto_id: PROD, color_id: AZUL, delta: -12, motivo: 'NV-AM-0001', creado_en: '2026-10-08T15:00:00Z' },
    ],
    ...extra,
  }
}
const registrar = (usuario, v) => como(usuario, () => q('select naty_registrar_venta($1::jsonb) as id', [JSON.stringify(v)]))

beforeAll(async () => {
  db = new PGlite()
  await db.exec(STUB)
  await db.exec(esquema)
  await db.exec(esquema) // idempotente: correrlo dos veces no puede romper nada ni duplicar nada
  // Las personas del equipo las da de alta la administración con naty_configurar_usuario (no hay alta automática).
  const usuario = async (id, nombre, rol, iniciales) => {
    const email = `${nombre.toLowerCase().replaceAll(' ', '.')}@test.local`
    await q('insert into auth.users (id, email) values ($1, $2)', [id, email])
    if (rol) await q('select naty_configurar_usuario($1, $2, $3, $4)', [email, rol, nombre, iniciales])
  }
  await usuario(U.admin, 'Natali', 'admin', 'NT')
  await usuario(U.ariel, 'Ariel Maydana', 'vendedor', 'AR')
  await usuario(U.brayan, 'Brayan Aquino', 'vendedor', 'BR')
  await usuario(U.maria, 'María Córdoba', 'enc_deposito', 'MC')
  await usuario(U.pamela, 'Pamela Aramayo', 'enc_tienda', 'PA')
  await usuario(U.jehovana, 'Jehovana Calla', 'enc_ventas', 'JE')
  // Usuario de OTRO proyecto de la instancia compartida (o alguien que se registró solo): existe en Auth pero NO es de Modas Naty.
  await usuario(U.intruso, 'Intruso', null)
  // Catálogo base cargado por la administración, usando la función real.
  await como(U.admin, () =>
    q('select naty_guardar_producto($1::jsonb)', [
      JSON.stringify({
        id: PROD, codigo: 'MN-001', nombre: 'Blusa', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, descripcion: 'x', precio_docena_usd_cent: 10000, nuevo: true, activo: true,
        colores: [{ id: ROJO, nombre: 'Rojo', hex: '#c00', orden: 0 }],
        fotos: [{ id: uuid(), orden: 0, ruta: 'MN-001/a.jpg' }, { id: uuid(), orden: 1, ruta: 'MN-001/b.jpg' }],
      }),
    ]),
  )
  // Un segundo color "de antes" (cuando un producto podía tener varios): datos viejos que la app nueva tiene que tolerar.
  await q("insert into naty_producto_colores (id, producto_id, nombre, hex, orden) values ($1, $2, 'Azul', '#00c', 1)", [AZUL, PROD])
  await como(U.maria, async () => {
    for (const color of [ROJO, AZUL]) {
      await q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, usuario_id, creado_en) values ($1, $2, $3, 'entrada', 100, 'inicial', $4, now())", [uuid(), PROD, color, U.maria])
    }
  })
}, 60_000)

afterAll(async () => db?.close())

describe('esquema, instancia compartida y alta de usuarios', () => {
  it('es idempotente y registra el proyecto en la tabla maestra', async () => {
    expect((await q("select count(*)::int as c from proyectos where identificador = 'naty'"))[0].c).toBe(1)
    expect((await q('select count(*)::int as c from naty_config'))[0].c).toBeGreaterThanOrEqual(6)
    const [{ tablas }] = await q("select tablas from proyectos where identificador = 'naty'")
    expect(tablas).toContain('naty_ventas')
    expect(tablas).toContain('bucket:naty_productos')
  })

  it('crea solo objetos con prefijo naty_ (y la tabla maestra): no toca nada de otros proyectos', async () => {
    const tablas = await q("select tablename from pg_tables where schemaname = 'public' order by 1")
    expect(tablas.map((t) => t.tablename).filter((t) => !t.startsWith('naty_'))).toEqual(['proyectos'])
    const funciones = await q("select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1")
    expect(funciones.map((f) => f.proname).filter((f) => !f.startsWith('naty_'))).toEqual(['set_actualizado'])
    // Nada colgado de auth.users: un usuario de otro proyecto no se convierte en vendedor de Modas Naty.
    expect((await q("select count(*)::int as c from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'auth' and not t.tgisinternal"))[0].c).toBe(0)
  })

  it('un usuario nuevo NO recibe perfil automático; solo existen los dados de alta por la administración', async () => {
    const perfiles = Object.fromEntries((await q('select id, rol, iniciales from naty_perfiles')).map((p) => [p.id, p]))
    expect(perfiles[U.ariel]).toMatchObject({ rol: 'vendedor', iniciales: 'AR' })
    expect(perfiles[U.maria].rol).toBe('enc_deposito')
    expect(perfiles[U.intruso]).toBeUndefined()
  })

  it('quien no es miembro (usuario de otro proyecto) no ve nada y no puede operar', async () => {
    for (const tabla of ['naty_productos', 'naty_producto_colores', 'naty_producto_fotos', 'naty_categorias', 'naty_movimientos_stock', 'naty_ventas', 'naty_venta_items', 'naty_perfiles', 'naty_config']) {
      expect(await como(U.intruso, () => q(`select * from ${tabla}`)), tabla).toHaveLength(0)
    }
    await expect(registrar(U.intruso, venta({ vendedor_id: U.intruso }))).rejects.toThrow(/no puede registrar ventas/)
    await expect(como(U.intruso, () => q("select naty_guardar_producto('{}'::jsonb)"))).rejects.toThrow(/no puede modificar el catálogo/)
    await expect(como(U.intruso, () => q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, usuario_id, creado_en) values (gen_random_uuid(), $1, $2, 'entrada', 5, $3, now())", [PROD, ROJO, U.intruso]))).rejects.toThrow(/row-level security/)
  })
})

describe('alta de usuarios', () => {
  it('configurar_usuario asigna rol, nombre e iniciales; es repetible', async () => {
    const id = '00000000-0000-4000-8000-0000000000aa'
    await q("insert into auth.users (id, email) values ($1, 'Nueva.Persona@Ejemplo.com')", [id])
    await q("select naty_configurar_usuario('nueva.persona@ejemplo.com', 'enc_ventas', ' Ana Pérez ', 'ap', '5917000')")
    await q("select naty_configurar_usuario('NUEVA.PERSONA@ejemplo.com', 'enc_ventas', 'Ana Pérez', 'AP')")
    const filas = await q('select nombre, iniciales, rol, telefono, activo from naty_perfiles where id = $1', [id])
    expect(filas).toEqual([{ nombre: 'Ana Pérez', iniciales: 'AP', rol: 'enc_ventas', telefono: '5917000', activo: true }])
  })

  it('dos personas no pueden compartir iniciales (romperían la numeración de notas)', async () => {
    await q("insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000b1', 'otra@ejemplo.com'), ('00000000-0000-4000-8000-0000000000b2', 'otra2@ejemplo.com')")
    await q("select naty_configurar_usuario('otra@ejemplo.com', 'vendedor', 'Otra', 'ZZ')")
    await expect(q("select naty_configurar_usuario('otra2@ejemplo.com', 'vendedor', 'Otra Dos', 'zz')")).rejects.toThrow(/duplicate key|unique/)
  })

  it('avisa si el correo no existe y NO la puede llamar nadie desde la app', async () => {
    await expect(q("select naty_configurar_usuario('nadie@ejemplo.com', 'admin', 'X', 'X')")).rejects.toThrow(/No existe un usuario/)
    // Si un vendedor pudiera llamarla, se haría administrador: debe estar bloqueado.
    await expect(como(U.ariel, () => q("select naty_configurar_usuario('ariel@test.local', 'admin', 'Ariel', 'AM')"))).rejects.toThrow(/permission denied/)
    await expect(como(null, () => q("select naty_configurar_usuario('ariel@test.local', 'admin', 'Ariel', 'AM')"))).rejects.toThrow(/permission denied/)
    expect((await q('select rol from naty_perfiles where id = $1', [U.ariel]))[0].rol).toBe('vendedor')
  })
})

describe('catálogo', () => {
  it('guardar_producto: la encargada de depósito puede, un vendedor no', async () => {
    const p = JSON.stringify({ id: uuid(), codigo: 'MN-002', nombre: 'Falda', categoria: null, precio_docena_usd_cent: 5000, colores: [], fotos: [] })
    await como(U.maria, () => q('select naty_guardar_producto($1::jsonb)', [p]))
    await expect(como(U.ariel, () => q('select naty_guardar_producto($1::jsonb)', [p]))).rejects.toThrow(/no puede modificar el catálogo/)
  })

  it('un producto tiene un solo color', async () => {
    const p = JSON.stringify({ id: uuid(), codigo: 'MN-051', nombre: 'Top', categoria: null, precio_docena_usd_cent: 3000, colores: [{ id: uuid(), nombre: 'Verde' }, { id: uuid(), nombre: 'Rojo' }], fotos: [] })
    await expect(como(U.admin, () => q('select naty_guardar_producto($1::jsonb)', [p]))).rejects.toThrow(/un solo color/)
  })

  it('cambiar el color marca el anterior eliminado (no lo borra) y las fotos se reemplazan', async () => {
    const prod = uuid()
    const verde = uuid()
    const amarillo = uuid()
    const base = { id: prod, codigo: 'MN-050', nombre: 'Short', categoria: null, precio_docena_usd_cent: 3000 }
    await como(U.admin, () => q('select naty_guardar_producto($1::jsonb)', [JSON.stringify({ ...base, colores: [{ id: amarillo, nombre: 'Amarillo' }], fotos: [{ id: uuid(), orden: 0, ruta: 'a.jpg' }, { id: uuid(), orden: 1, ruta: 'b.jpg' }] })]))
    await como(U.admin, () => q('select naty_guardar_producto($1::jsonb)', [JSON.stringify({ ...base, colores: [{ id: verde, nombre: 'Verde' }], fotos: [{ id: uuid(), orden: 0, ruta: 'c.jpg' }] })]))
    const colores = await q('select nombre, eliminado from naty_producto_colores where producto_id = $1 order by nombre', [prod])
    expect(colores).toEqual([{ nombre: 'Amarillo', eliminado: true }, { nombre: 'Verde', eliminado: false }])
    expect((await q('select ruta from naty_producto_fotos where producto_id = $1', [prod])).map((f) => f.ruta)).toEqual(['c.jpg'])
  })

  it('cambiar colores o fotos avanza el updated_at del producto (descarga incremental)', async () => {
    const [{ antes }] = await q('select updated_at as antes from naty_productos where id = $1', [PROD])
    // Nadie edita colores por UPDATE directo (lo hace guardar_producto): se prueba con el propietario, como lo haría la función.
    await q("update naty_producto_colores set hex = '#abcdef' where id = $1", [ROJO])
    const [{ despues }] = await q('select updated_at as despues from naty_productos where id = $1', [PROD])
    expect(new Date(despues).getTime()).toBeGreaterThan(new Date(antes).getTime())
  })
})

describe('lectura según el rol', () => {
  it('cada vendedor ve solo sus ventas; administración y encargadas ven todas', async () => {
    await registrar(U.ariel, venta())
    await registrar(U.brayan, venta({ vendedor_id: U.brayan, vendedor_nombre: 'Brayan', numero: 'NV-BA-0001' }))
    const ver = (u) => como(u, async () => (await q('select numero from naty_ventas order by numero')).map((x) => x.numero))
    expect(await ver(U.ariel)).toEqual(['NV-AM-0001'])
    expect(await ver(U.brayan)).toEqual(['NV-BA-0001'])
    for (const u of [U.admin, U.pamela, U.jehovana]) expect((await ver(u)).length).toBeGreaterThanOrEqual(2)
    expect(await ver(U.maria)).toEqual([])
    const items = await como(U.ariel, () => q('select count(*)::int as c from naty_venta_items'))
    expect(items[0].c).toBe(2)
  })

  it('nadie escribe ventas por INSERT/UPDATE directo', async () => {
    await expect(como(U.ariel, () => q("insert into naty_ventas (id, numero, vendedor_id, moneda, tipo_cambio, metodo_pago, total_cent, creada_en) values ($1, 'X', $2, 'usd', 1, 'efectivo', 0, now())", [uuid(), U.ariel]))).rejects.toThrow(/permission denied|row-level security/)
    await expect(como(U.admin, () => q("update naty_ventas set total_cent = 1"))).rejects.toThrow(/permission denied/)
    await expect(como(U.admin, () => q('delete from naty_ventas'))).rejects.toThrow(/permission denied/)
  })
})

describe('registrar_venta', () => {
  it('descuenta stock, es idempotente y conserva los ids de los movimientos', async () => {
    const antesRojo = await stockDe(ROJO)
    const v = venta({ numero: 'NV-AM-0002' })
    const [{ id }] = await registrar(U.ariel, v)
    expect(id).toBe(v.id)
    expect(await stockDe(ROJO)).toBe(antesRojo - 24)
    await registrar(U.ariel, v)
    await registrar(U.ariel, v)
    expect(await stockDe(ROJO)).toBe(antesRojo - 24)
    expect((await q('select count(*)::int as c from naty_ventas where id = $1', [v.id]))[0].c).toBe(1)
    expect((await q('select count(*)::int as c from naty_movimientos_stock where id = $1', [v.movimientos[0].id]))[0].c).toBe(1)
    expect((await q('select tipo, venta_id, usuario_id from naty_movimientos_stock where id = $1', [v.movimientos[0].id]))[0]).toEqual({ tipo: 'venta', venta_id: v.id, usuario_id: U.ariel })
  })

  it('rechaza ventas a nombre de otra persona, de roles sin permiso, sin sesión, vacías o con total distinto', async () => {
    await expect(registrar(U.ariel, venta({ vendedor_id: U.brayan }))).rejects.toThrow(/a nombre de quien la registra/)
    await expect(registrar(U.maria, venta({ vendedor_id: U.maria }))).rejects.toThrow(/no puede registrar ventas/)
    await expect(registrar(null, venta())).rejects.toThrow(/No autenticado|permission denied/)
    await expect(registrar(U.ariel, venta({ items: [], total_cent: 0 }))).rejects.toThrow(/no tiene productos/)
    await expect(registrar(U.ariel, venta({ total_cent: 1 }))).rejects.toThrow(/no coincide/)
    const malo = venta()
    malo.movimientos[0].delta = 24
    await expect(registrar(U.ariel, malo)).rejects.toThrow(/debe restar stock/)
    // lo fallido no deja nada a medias
    expect((await q('select count(*)::int as c from naty_ventas where id = $1', [malo.id]))[0].c).toBe(0)
  })

  it('la administradora puede registrar a nombre de otra persona', async () => {
    const v = venta({ numero: 'NV-AM-0099', vendedor_id: U.ariel })
    await registrar(U.admin, v)
    expect((await q('select vendedor_id from naty_ventas where id = $1', [v.id]))[0].vendedor_id).toBe(U.ariel)
  })
})

describe('anular_venta', () => {
  it('solo la administración, con motivo; devuelve el stock y es idempotente', async () => {
    const v = venta({ numero: 'NV-AM-0003' })
    await registrar(U.ariel, v)
    const stockVendida = await stockDe(ROJO)
    const anulacion = { id: v.id, motivo: 'Error de carga', anulada_en: '2026-10-08T16:00:00Z', movimientos: [{ id: uuid(), producto_id: PROD, color_id: ROJO, delta: 24, motivo: 'Anulación', creado_en: '2026-10-08T16:00:00Z' }] }
    const anular = (u, p) => como(u, () => q('select naty_anular_venta($1::jsonb)', [JSON.stringify(p)]))
    await expect(anular(U.ariel, anulacion)).rejects.toThrow(/Solo la administración/)
    await expect(anular(U.pamela, anulacion)).rejects.toThrow(/Solo la administración/)
    await expect(anular(U.admin, { ...anulacion, motivo: '  ' })).rejects.toThrow(/motivo/)
    await anular(U.admin, anulacion)
    await anular(U.admin, anulacion)
    expect(await stockDe(ROJO)).toBe(stockVendida + 24)
    const [fila] = await q('select estado, anulacion_motivo from naty_ventas where id = $1', [v.id])
    expect(fila).toEqual({ estado: 'anulada', anulacion_motivo: 'Error de carga' })
  })
})

describe('stock y ajustes', () => {
  const mov = (tipo, usuario, delta = 5) => q('insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, usuario_id, creado_en) values ($1, $2, $3, $4, $5, $6, now())', [uuid(), PROD, ROJO, tipo, delta, usuario])

  it('la encargada de depósito y la administración cargan entradas/salidas/ajustes; los demás no', async () => {
    await como(U.maria, () => mov('entrada', U.maria))
    await como(U.admin, () => mov('ajuste', U.admin, -3))
    await expect(como(U.ariel, () => mov('entrada', U.ariel))).rejects.toThrow(/permission denied|row-level security/)
    await expect(como(U.pamela, () => mov('entrada', U.pamela))).rejects.toThrow(/permission denied|row-level security/)
  })

  it('no se pueden falsificar ventas ni anulaciones con un INSERT de stock, ni a nombre de otro', async () => {
    await expect(como(U.maria, () => mov('venta', U.maria, -5))).rejects.toThrow(/row-level security/)
    await expect(como(U.maria, () => mov('anulacion', U.maria))).rejects.toThrow(/row-level security/)
    await expect(como(U.maria, () => mov('entrada', U.admin))).rejects.toThrow(/row-level security/)
  })

  it('los ajustes los cambia solo la administración', async () => {
    await como(U.admin, () => q("update naty_config set valor = '48' where clave = 'stock_bajo_unidades'"))
    expect((await q("select valor from naty_config where clave = 'stock_bajo_unidades'"))[0].valor).toBe(48)
    // Sin permiso, el UPDATE no falla: simplemente no toca ninguna fila (RLS).
    const filas = await como(U.ariel, () => q("update naty_config set valor = '1' where clave = 'stock_bajo_unidades' returning clave"))
    expect(filas).toHaveLength(0)
    expect((await q("select valor from naty_config where clave = 'stock_bajo_unidades'"))[0].valor).toBe(48)
    await expect(como(U.ariel, () => q("insert into naty_config (clave, valor) values ('x', '1')"))).rejects.toThrow(/row-level security/)
  })

  it('un vendedor no puede cambiarse el rol ni modificar perfiles', async () => {
    const filas = await como(U.ariel, () => q("update naty_perfiles set rol = 'admin' where id = $1 returning id", [U.ariel]))
    expect(filas).toHaveLength(0)
    expect((await q('select rol from naty_perfiles where id = $1', [U.ariel]))[0].rol).toBe('vendedor')
  })
})

describe('catálogo público (sin login)', () => {
  it('anónimo ve la vista pero no las tablas', async () => {
    const filas = await como(null, () => q('select codigo, colores, fotos from naty_catalogo_publico order by codigo'))
    expect(filas.length).toBeGreaterThanOrEqual(1)
    const blusa = filas.find((f) => f.codigo === 'MN-001')
    expect(blusa.colores.map((c) => c.nombre)).toEqual(['Rojo', 'Azul'])
    expect(blusa.fotos).toEqual(['MN-001/a.jpg', 'MN-001/b.jpg'])
    for (const tabla of ['productos', 'ventas', 'movimientos_stock', 'config', 'perfiles']) {
      await expect(como(null, () => q(`select * from naty_${tabla}`))).rejects.toThrow(/permission denied/)
    }
  })

  it('no expone stock, costos ni datos internos', async () => {
    const [fila] = await como(null, () => q("select * from naty_catalogo_publico where codigo = 'MN-001'"))
    expect(Object.keys(fila).sort()).toEqual(['categoria', 'codigo', 'colores', 'descripcion', 'fotos', 'id', 'nombre', 'nuevo', 'precio_docena_usd_cent'])
  })

  it('el precio solo aparece si la administración lo habilita; los productos dados de baja no aparecen', async () => {
    const precio = async () => (await como(null, () => q("select precio_docena_usd_cent as p from naty_catalogo_publico where codigo = 'MN-001'")))[0].p
    expect(await precio()).toBeNull()
    await como(U.admin, () => q("update naty_config set valor = 'true' where clave = 'mostrar_precios_publico'"))
    expect(await precio()).toBe(10000)
    const p = JSON.stringify({ id: PROD, codigo: 'MN-001', nombre: 'Blusa', categoria: null, precio_docena_usd_cent: 10000, activo: false, colores: [{ id: ROJO, nombre: 'Rojo' }], fotos: [] })
    await como(U.admin, () => q('select naty_guardar_producto($1::jsonb)', [p]))
    expect(await como(null, () => q("select 1 from naty_catalogo_publico where codigo = 'MN-001'"))).toHaveLength(0)
  })
})

describe('storage de fotos', () => {
  it('cualquiera ve las fotos; solo administración y depósito suben', async () => {
    const subir = (u) => como(u, () => q("insert into storage.objects (bucket_id, name) values ('naty_productos', 'MN-001/x.jpg')"))
    await subir(U.maria)
    await subir(U.admin)
    await expect(subir(U.ariel)).rejects.toThrow(/row-level security/)
    expect(await como(null, () => q("select name from storage.objects where bucket_id = 'naty_productos'"))).toHaveLength(2)
    await expect(como(U.ariel, () => q("delete from storage.objects where bucket_id = 'naty_productos' returning name"))).resolves.toHaveLength(0)
  })
})

describe('stock por producto y un solo color (corrección de datos al aplicar el esquema)', () => {
  it('una venta sin color descuenta stock del producto', async () => {
    const v = venta({ numero: 'NV-AM-0900' })
    v.items = [{ id: uuid(), producto_id: PROD, color_id: null, codigo: 'MN-001', nombre: 'Blusa', color_nombre: '', cantidad: 1, unidad: 'docena', unidades: 12, precio_cent: 100, subtotal_cent: 100 }]
    v.movimientos = [{ id: uuid(), producto_id: PROD, color_id: null, delta: -12, motivo: v.numero, creado_en: v.creada_en }]
    v.total_cent = 100
    await registrar(U.ariel, v)
    expect(await q('select color_id, delta from naty_movimientos_stock where venta_id = $1', [v.id])).toEqual([{ color_id: null, delta: -12 }])
  })

  it('deja el primer color y redondea el stock a la media docena más cercana; correrlo de nuevo no cambia nada', async () => {
    const prod = uuid()
    const [c1, c2] = [uuid(), uuid()]
    await q("insert into naty_productos (id, codigo, nombre, precio_docena_usd_cent) values ($1, 'MN-090', 'Viejo', 1000)", [prod])
    await q("insert into naty_producto_colores (id, producto_id, nombre, orden) values ($1, $3, 'Negro', 0), ($2, $3, 'Rojo', 1)", [c1, c2, prod])
    // 64 + 30 = 94 prendas = 7,83 docenas → 8 docenas (96).
    await q("insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, creado_en) values (gen_random_uuid(), $1, $2, 'entrada', 64, now()), (gen_random_uuid(), $1, $3, 'entrada', 30, now())", [prod, c1, c2])
    await db.exec(esquema)
    expect(await q('select nombre from naty_producto_colores where producto_id = $1 and not eliminado', [prod])).toEqual([{ nombre: 'Negro' }])
    const total = async () => (await q('select sum(delta)::int as s from naty_movimientos_stock where producto_id = $1', [prod]))[0].s
    expect(await total()).toBe(96)
    expect(await q("select delta, motivo from naty_movimientos_stock where producto_id = $1 and tipo = 'ajuste'", [prod])).toEqual([{ delta: 2, motivo: 'Redondeo a media docena' }])
    await db.exec(esquema)
    expect(await total()).toBe(96)
    expect((await q('select count(*)::int as n from naty_movimientos_stock where producto_id = $1', [prod]))[0].n).toBe(3)
  })
})
