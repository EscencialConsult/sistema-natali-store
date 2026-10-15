// Prueba tienda_schema.sql (sobre naty_schema.sql) contra un Postgres real en memoria: idempotencia, permisos por rol,
// pedidos con reserva de stock, pagos, transiciones, vencimiento, consulta pública y vista del catálogo.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TRANSICIONES } from '../../lib/pedido.js'
import { aplicarEsquemas, como, crearServidor, INTRUSO, q, rpc, USUARIOS as U } from './servidorPrueba.js'

const CAT = '10000000-0000-4000-8000-000000000001'
const PROD = '20000000-0000-4000-8000-000000000001'
const PROD_OCULTO = '20000000-0000-4000-8000-000000000002'
const ROJO = '30000000-0000-4000-8000-000000000001'
const AZUL = '30000000-0000-4000-8000-000000000002'
let n = 0
const uuid = () => `a0000000-0000-4000-8000-${String(++n).padStart(12, '0')}`

let db
const disponible = async (color) => (await q(db, 'select tienda_disponible($1, $2) as d', [PROD, color]))[0].d
const comprador = { comprador_nombre: 'Ana Pérez', comprador_telefono: '591 7123-4567' }
const pedido = (extra = {}) => ({ id: uuid(), ...comprador, items: [{ producto_id: PROD, color_id: ROJO, cantidad: 2 }], ...extra })
const crearComo = (quien, p) => como(db, quien, () => rpc(db, 'tienda_crear_pedido', p))
const estadoComo = (quien, p) => como(db, quien, () => rpc(db, 'tienda_cambiar_estado', p))
const pagoComo = (quien, p) => como(db, quien, () => rpc(db, 'tienda_confirmar_pago', p))

beforeAll(async () => {
  db = await crearServidor()
  // Catálogo mínimo (como lo cargaría depósito): un producto publicado con dos colores y otro sin publicar.
  await como(db, U.maria.id, () =>
    rpc(db, 'naty_guardar_producto', {
      id: PROD, codigo: 'MN-001', nombre: 'Blusa Satín', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, descripcion: 'Linda', precio_docena_usd_cent: 10000,
      nuevo: true, activo: true,
      colores: [{ id: ROJO, nombre: 'Rojo', hex: '#f00', orden: 0 }, { id: AZUL, nombre: 'Azul', hex: '#00f', orden: 1 }],
      fotos: [{ id: uuid(), orden: 0, ruta: 'MN-001/1.jpg' }],
    }),
  )
  await como(db, U.maria.id, () => rpc(db, 'tienda_guardar_publicacion', { id: PROD, precio_unidad_bs_cent: 15000, publicado_tienda: true, destacado: true }))
  await como(db, U.maria.id, () =>
    rpc(db, 'naty_guardar_producto', { id: PROD_OCULTO, codigo: 'MN-002', nombre: 'Oculto', categoria: { id: CAT, nombre: 'BLUSAS', orden: 1 }, precio_docena_usd_cent: 1000, colores: [], fotos: [] }),
  )
  await como(db, U.maria.id, () =>
    q(db, `insert into naty_movimientos_stock (id, producto_id, color_id, tipo, delta, motivo, usuario_id, creado_en) values ($1, $2, $3, 'entrada', 100, 'inicial', $4, now()), ($5, $2, $6, 'entrada', 1, 'inicial', $4, now())`, [uuid(), PROD, ROJO, U.maria.id, uuid(), AZUL]),
  )
}, 60_000)
afterAll(() => db?.close())

describe('esquema', () => {
  it('se puede aplicar dos veces sin error y los campos de la tienda existen en naty_productos', async () => {
    await aplicarEsquemas(db)
    const cols = (await q(db, "select column_name from information_schema.columns where table_name = 'naty_productos'")).map((c) => c.column_name)
    expect(cols).toEqual(expect.arrayContaining(['precio_unidad_bs_cent', 'publicado_tienda', 'destacado', 'slug']))
    expect((await q(db, 'select slug from naty_productos where id = $1', [PROD]))[0].slug).toBe('blusa-satin-mn-001')
    expect((await q(db, "select identificador from proyectos where identificador in ('naty', 'tienda') order by 1")).map((p) => p.identificador)).toEqual(['naty', 'tienda'])
  }, 60_000)

  it('la tabla de transiciones de la base coincide con la de la app', async () => {
    for (const [de, lista] of Object.entries(TRANSICIONES)) {
      for (const a of Object.keys(TRANSICIONES)) {
        const r = (await q(db, 'select tienda_transicion_valida($1, $2) as v', [de, a]))[0].v
        expect(r, `${de} → ${a}`).toBe(lista.includes(a))
      }
    }
  })
})

describe('público (anon)', () => {
  it('ve el catálogo publicado con precio y disponible, pero no los productos ocultos ni las tablas', async () => {
    const vista = await como(db, null, () => q(db, 'select * from tienda_catalogo_publico'))
    expect(vista.map((p) => p.codigo)).toEqual(['MN-001'])
    expect(vista[0].precio_unidad_bs_cent).toBe(15000)
    expect(vista[0].colores.find((c) => c.id === ROJO).disponible).toBe(100)
    await expect(como(db, null, () => q(db, 'select * from tienda_pedidos'))).rejects.toThrow(/permission denied/)
    await expect(como(db, null, () => q(db, 'select * from naty_productos'))).rejects.toThrow(/permission denied/)
    await expect(como(db, null, () => q(db, 'select * from tienda_gastos'))).rejects.toThrow(/permission denied/)
  })
  it('lee la configuración pública sin datos internos', async () => {
    const cfg = (await como(db, null, () => q(db, 'select tienda_sitio_publico() as c')))[0].c
    expect(cfg).toHaveProperty('sitio')
    expect(cfg).toHaveProperty('whatsapp_tienda')
    expect(cfg).not.toHaveProperty('pagos')
  })
})

describe('pedidos', () => {
  it('anon crea un pedido: código TN-, precio copiado, reserva de stock, historial; es idempotente', async () => {
    const p = pedido({ proveedor_pago: 'caja', moneda: 'bs' }) // efectivo en bolivianos: precio de lista sin convertir
    const r = await crearComo(null, p)
    expect(r.codigo).toMatch(/^TN-\d{6}$/)
    expect(r.estado).toBe('pendiente_pago')
    expect(r.comprador_telefono).toBe('59171234567')
    expect(r.items[0]).toMatchObject({ codigo: 'MN-001', color_nombre: 'Rojo', cantidad: 2, precio_cent: 15000, subtotal_cent: 30000 })
    expect(r.total_cent).toBe(30000)
    expect(r.historial).toHaveLength(1)
    expect(await disponible(ROJO)).toBe(98)
    const otra = await crearComo(null, p)
    expect(otra.codigo).toBe(r.codigo)
    expect(await disponible(ROJO)).toBe(98)
  })

  it('valida datos y no deja nada a medias', async () => {
    await expect(crearComo(null, pedido({ items: [] }))).rejects.toThrow(/vacío/)
    await expect(crearComo(null, pedido({ comprador_telefono: '12' }))).rejects.toThrow(/teléfono/)
    await expect(crearComo(null, pedido({ entrega: 'envio' }))).rejects.toThrow(/dirección/)
    await expect(crearComo(null, pedido({ items: [{ producto_id: PROD_OCULTO, color_id: ROJO, cantidad: 1 }] }))).rejects.toThrow(/no está disponible/)
    await expect(crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: AZUL, cantidad: 1 }, { producto_id: PROD, color_id: ROJO, cantidad: 99 }] }))).rejects.toThrow(/stock suficiente/)
    // El primer ítem (Azul) no quedó reservado: la transacción entera se deshizo.
    expect(await disponible(AZUL)).toBe(1)
  })

  it('la última unidad la gana el primero; el segundo recibe el código de stock insuficiente', async () => {
    await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: AZUL, cantidad: 1 }] }))
    expect(await disponible(AZUL)).toBe(0)
    const err = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: AZUL, cantidad: 1 }] })).catch((e) => e)
    expect(err.message).toMatch(/stock suficiente/)
    expect(err.detail ?? err.message).toMatch(/TIENDA_STOCK_INSUFICIENTE|stock/)
  })

  it('el envío suma el costo en bolivianos', async () => {
    const r = await crearComo(null, pedido({ proveedor_pago: 'caja', entrega: 'envio', envio_ciudad: 'Bermejo', envio_direccion: 'Calle 1', envio_costo_cent: 1500, items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    expect(r.moneda).toBe('bs')
    expect(r.total_cent).toBe(16500)
  })

  describe('moneda y tipo de cambio', () => {
    const unidad = [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }]
    // La conversión es "bs bolivianos = ars pesos argentinos" de la tienda (tienda_config.cambio), con versión.
    const fijarCambio = (bs, ars, version = 1) =>
      q(db, "insert into tienda_config (clave, valor) values ('cambio', $1::jsonb) on conflict (clave) do update set valor = excluded.valor", [JSON.stringify({ bs, ars, version })])

    it('en pesos el precio sale de la conversión de la administración, al centavo', async () => {
      await fijarCambio(1, 200) // 1 Bs = 200 pesos
      const r = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', items: unidad }))
      expect(r.moneda).toBe('ars')
      expect(Number(r.tipo_cambio)).toBe(200)
      expect(r.items[0].precio_cent).toBe(15000 * 200) // Bs 150 → $ 30.000
    })

    it('con 5 bolivianos = 1 peso, Bs 150 son $ 30,00 (y se redondea al centavo)', async () => {
      await fijarCambio(5, 1)
      const r = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', items: unidad }))
      expect(Number(r.tipo_cambio)).toBe(0.2)
      expect(r.items[0].precio_cent).toBe(3000)
      expect(r.total_cent).toBe(3000)
      await fijarCambio(3, 1) // 1/3: 15000 × 0,3333… = 5000 centavos exactos; el redondeo no pierde centavos
      const t = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', items: unidad }))
      expect(t.items[0].precio_cent).toBe(5000)
    })

    it('ignora el tipo de cambio que mande el navegador', async () => {
      await fijarCambio(1, 200)
      const r = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', tipo_cambio: 0.0001, items: unidad }))
      expect(Number(r.tipo_cambio)).toBe(200)
      expect(r.total_cent).toBe(15000 * 200)
    })

    it('el costo de envío en Bs también se pasa a pesos', async () => {
      await fijarCambio(1, 200)
      const r = await crearComo(null, pedido({ proveedor_pago: 'transferencia', moneda: 'ars', entrega: 'envio', envio_ciudad: 'Bermejo', envio_direccion: 'Calle 1', envio_costo_cent: 1500, items: unidad }))
      expect(r.envio_costo_cent).toBe(1500 * 200)
      expect(r.total_cent).toBe(15000 * 200 + 1500 * 200)
    })

    it('el pago en línea y la transferencia solo se aceptan en pesos; el efectivo, en bolivianos o pesos', async () => {
      await fijarCambio(1, 200)
      await expect(crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'bs', items: unidad }))).rejects.toThrow(/pesos argentinos/)
      await expect(crearComo(null, pedido({ proveedor_pago: 'transferencia', moneda: 'bs', items: unidad }))).rejects.toThrow(/pesos argentinos/)
      expect((await crearComo(null, pedido({ proveedor_pago: 'caja', moneda: 'bs', items: unidad }))).moneda).toBe('bs')
      expect((await crearComo(null, pedido({ proveedor_pago: 'caja', moneda: 'ars', items: unidad }))).moneda).toBe('ars')
    })

    it('sin conversión cargada no se puede cobrar en pesos', async () => {
      await q(db, "delete from tienda_config where clave = 'cambio'")
      await q(db, "delete from naty_config where clave = 'tipo_cambio'")
      await expect(crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', items: unidad }))).rejects.toThrow(/tipo de cambio/)
      expect((await crearComo(null, pedido({ proveedor_pago: 'caja', moneda: 'bs', items: unidad }))).moneda).toBe('bs')
      await fijarCambio(1, 200)
    })

    describe('estrategia ante un cambio de la conversión', () => {
      it('la administración la cambia, sube la versión y queda en el historial; los demás roles no pueden', async () => {
        await fijarCambio(5, 1, 1)
        await expect(como(db, U.pamela.id, () => rpc(db, 'tienda_guardar_cambio', { bs: 4, ars: 1 }))).rejects.toThrow(/administración/)
        await expect(como(db, U.maria.id, () => rpc(db, 'tienda_guardar_cambio', { bs: 4, ars: 1 }))).rejects.toThrow(/administración/)
        const nuevo = await como(db, U.admin.id, () => rpc(db, 'tienda_guardar_cambio', { bs: 4, ars: 1, nota: 'Ajuste del día' }))
        expect(nuevo).toMatchObject({ bs: 4, ars: 1, version: 2 })
        expect(nuevo.actualizado_por).toBeUndefined()
        const hist = await como(db, U.admin.id, () => q(db, 'select version, bs::float as bs, ars::float as ars, nota from tienda_cambio_historial order by id desc limit 1'))
        expect(hist[0]).toEqual({ version: 2, bs: 4, ars: 1, nota: 'Ajuste del día' })
        // La encargada no lee el historial
        expect(await como(db, U.pamela.id, () => q(db, 'select * from tienda_cambio_historial'))).toHaveLength(0)
      })

      it('rechaza valores que no sean mayores a cero', async () => {
        for (const mal of [{ bs: 0, ars: 1 }, { bs: 5, ars: -1 }, { bs: 'x', ars: 1 }, { ars: 1 }]) {
          await expect(como(db, U.admin.id, () => rpc(db, 'tienda_guardar_cambio', mal))).rejects.toThrow()
        }
      })

      it('el público ve la conversión vigente (sin quién la cargó)', async () => {
        await fijarCambio(5, 1, 7)
        const sitio = await como(db, null, () => rpc(db, 'tienda_sitio_publico', {}).catch(async () => (await q(db, 'select tienda_sitio_publico() as r'))[0].r))
        const cambio = sitio.cambio ?? (await como(db, null, () => q(db, 'select tienda_sitio_publico() as r')))[0].r.cambio
        expect(cambio).toMatchObject({ bs: 5, ars: 1, version: 7 })
        expect(cambio.actualizado_por).toBeUndefined()
      })

      it('si la conversión cambió mientras la persona confirmaba, el servidor frena y no crea nada', async () => {
        await fijarCambio(5, 1, 3)
        const antes = (await q(db, 'select count(*)::int as c from tienda_pedidos'))[0].c
        await expect(crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', cambio_visto: 2, items: unidad }))).rejects.toThrow(/se actualizó/)
        expect((await q(db, 'select count(*)::int as c from tienda_pedidos'))[0].c).toBe(antes)
        const ok = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', cambio_visto: 3, items: unidad }))
        expect(ok.total_cent).toBe(3000)
      })

      it('un pedido ya creado conserva su valor aunque cambie la conversión; en bolivianos no importa la versión', async () => {
        await fijarCambio(5, 1, 4)
        const p = await crearComo(null, pedido({ proveedor_pago: 'mercadopago', moneda: 'ars', cambio_visto: 4, items: unidad }))
        await como(db, U.admin.id, () => rpc(db, 'tienda_guardar_cambio', { bs: 1, ars: 200 }))
        const despues = await como(db, 'servicio', () => q(db, 'select total_cent::int as t, tipo_cambio::float as tc, cambio_version from tienda_pedidos where id = $1', [p.id]))
        expect(despues[0]).toEqual({ t: 3000, tc: 0.2, cambio_version: 4 })
        const caja = await crearComo(null, pedido({ proveedor_pago: 'caja', moneda: 'bs', cambio_visto: 1, items: unidad }))
        expect(caja.total_cent).toBe(15000)
      })
    })
  })

  it('consulta pública solo con código y teléfono correctos', async () => {
    const r = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    const ok = (await como(db, null, () => q(db, 'select tienda_pedido_publico($1, $2) as p', [r.codigo.toLowerCase(), '+591 7123 4567'])))[0].p
    expect(ok.id).toBe(r.id)
    expect(ok).not.toHaveProperty('dispositivo_kiosco_id')
    expect((await como(db, null, () => q(db, 'select tienda_pedido_publico($1, $2) as p', [r.codigo, '59100000000'])))[0].p).toBeNull()
  })
})

describe('consulta por llave (enlace de vuelta y correo)', () => {
  it('abre el pedido con código + id, sin teléfono; con otra llave o código no devuelve nada', async () => {
    const r = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    const ok = (await como(db, null, () => q(db, 'select tienda_pedido_por_llave($1, $2) as p', [r.codigo.toLowerCase(), r.id])))[0].p
    expect(ok.id).toBe(r.id)
    expect(ok).not.toHaveProperty('dispositivo_kiosco_id')
    const otra = '00000000-0000-4000-8000-000000000000'
    expect((await como(db, null, () => q(db, 'select tienda_pedido_por_llave($1, $2) as p', [r.codigo, otra])))[0].p).toBeNull()
    expect((await como(db, null, () => q(db, 'select tienda_pedido_por_llave($1, $2) as p', ['TN-999999', r.id])))[0].p).toBeNull()
    expect((await como(db, null, () => q(db, 'select tienda_pedido_por_llave($1, $2) as p', [r.codigo, 'no-es-un-uuid'])))[0].p).toBeNull()
  })
})

describe('pagos y estados', () => {
  it('el pago en línea lo confirma solo el servidor; la reserva se vuelve venta y es idempotente', async () => {
    const r = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    const antes = await disponible(ROJO)
    await expect(pagoComo(U.pamela.id, { id: r.id, proveedor: 'mercadopago' })).rejects.toThrow(/servidor/)
    const pagado = await pagoComo('servicio', { id: r.id, proveedor: 'mercadopago', proveedor_id: 'mp-1', idempotency_key: 'evt-1' })
    expect(pagado.estado).toBe('pagado')
    expect(pagado.pagado_en).toBeTruthy()
    expect(await disponible(ROJO)).toBe(antes)
    const tipos = (await q(db, 'select tipo from naty_movimientos_stock where pedido_id = $1', [r.id])).map((m) => m.tipo).sort()
    expect(tipos).toEqual(['liberacion', 'reserva', 'venta'])
    const otraVez = await pagoComo('servicio', { id: r.id, proveedor: 'mercadopago', proveedor_id: 'mp-1', idempotency_key: 'evt-1' })
    expect(otraVez.estado).toBe('pagado')
    expect((await q(db, 'select count(*)::int as c from tienda_pagos where pedido_id = $1', [r.id]))[0].c).toBe(1)
  })

  it('la encargada confirma pagos en caja y mueve estados; no cancela ni reembolsa; depósito no toca pedidos', async () => {
    const r = await crearComo('servicio', { id: uuid(), origen: 'kiosco', proveedor_pago: 'caja', items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] })
    await expect(pagoComo(U.maria.id, { id: r.id, proveedor: 'caja' })).rejects.toThrow(/rol/)
    const pagado = await pagoComo(U.pamela.id, { id: r.id, proveedor: 'caja' })
    expect(pagado.estado).toBe('pagado')
    await expect(estadoComo(U.pamela.id, { id: r.id, estado: 'pagado' })).rejects.toThrow()
    const prep = await estadoComo(U.pamela.id, { id: r.id, estado: 'en_preparacion' })
    expect(prep.historial.map((h) => h.a_estado)).toEqual(['pendiente_pago', 'pagado', 'en_preparacion'])
    await expect(estadoComo(U.pamela.id, { id: r.id, estado: 'reembolsado', motivo: 'x' })).rejects.toThrow(/administración/)
    const err = await estadoComo(U.admin.id, { id: r.id, estado: 'pendiente_pago' }).catch((e) => e)
    expect(err.message).toMatch(/no puede pasar/)
    await expect(estadoComo(U.admin.id, { id: r.id, estado: 'reembolsado' })).rejects.toThrow(/motivo/)
    const antes = await disponible(ROJO)
    const reemb = await estadoComo(U.admin.id, { id: r.id, estado: 'reembolsado', motivo: 'falla' })
    expect(reemb.estado).toBe('reembolsado')
    expect(await disponible(ROJO)).toBe(antes + 1)
    expect((await q(db, "select estado from tienda_pagos where pedido_id = $1", [r.id]))[0].estado).toBe('reembolsado')
  })

  it('cancelar libera la reserva; vencer reservas cancela solo las vencidas', async () => {
    const a = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    const b = await crearComo(null, pedido({ items: [{ producto_id: PROD, color_id: ROJO, cantidad: 1 }] }))
    const antes = await disponible(ROJO)
    await estadoComo(U.admin.id, { id: a.id, estado: 'cancelado', motivo: 'se arrepintió' })
    expect(await disponible(ROJO)).toBe(antes + 1)
    await q(db, "update tienda_pedidos set reserva_vence_en = now() - interval '1 minute' where id = $1", [b.id])
    await expect(como(db, U.admin.id, () => q(db, 'select tienda_vencer_reservas()'))).rejects.toThrow()
    expect((await q(db, 'select tienda_vencer_reservas() as n'))[0].n).toBe(1)
    expect((await q(db, 'select estado from tienda_pedidos where id = $1', [b.id]))[0].estado).toBe('cancelado')
    expect(await disponible(ROJO)).toBe(antes + 2)
  })
})

describe('permisos del panel', () => {
  it('administración y encargada ven pedidos; depósito, vendedor e intrusos no', async () => {
    expect((await como(db, U.admin.id, () => q(db, 'select count(*)::int as c from tienda_pedidos')))[0].c).toBeGreaterThan(0)
    expect((await como(db, U.pamela.id, () => q(db, 'select count(*)::int as c from tienda_pedidos')))[0].c).toBeGreaterThan(0)
    expect((await como(db, U.maria.id, () => q(db, 'select count(*)::int as c from tienda_pedidos')))[0].c).toBe(0)
    expect((await como(db, U.ariel.id, () => q(db, 'select count(*)::int as c from tienda_pedidos')))[0].c).toBe(0)
    expect((await como(db, INTRUSO, () => q(db, 'select count(*)::int as c from tienda_pedidos')))[0].c).toBe(0)
  })
  it('gastos: la encargada carga los suyos, administración ve todos, depósito nada; precios solo depósito y administración', async () => {
    const cat = (await q(db, 'select id from tienda_gasto_categorias order by orden limit 1'))[0].id
    await como(db, U.pamela.id, () => q(db, "insert into tienda_gastos (id, categoria_id, fecha, monto_cent, descripcion, usuario_id) values ($1, $2, '2026-10-09', 1250, 'Bolsas', $3)", [uuid(), cat, U.pamela.id]))
    await expect(como(db, U.pamela.id, () => q(db, "insert into tienda_gastos (id, categoria_id, fecha, monto_cent, usuario_id) values ($1, $2, '2026-10-09', 1, $3)", [uuid(), cat, U.admin.id]))).rejects.toThrow()
    expect((await como(db, U.pamela.id, () => q(db, 'select count(*)::int as c from tienda_gastos')))[0].c).toBe(1)
    expect((await como(db, U.admin.id, () => q(db, 'select count(*)::int as c from tienda_gastos')))[0].c).toBe(1)
    expect((await como(db, U.maria.id, () => q(db, 'select count(*)::int as c from tienda_gastos')))[0].c).toBe(0)
    await expect(como(db, U.pamela.id, () => rpc(db, 'tienda_guardar_publicacion', { id: PROD, precio_unidad_bs_cent: 1 }))).rejects.toThrow(/publicación/)
  })
  it('la configuración de la tienda la leen los miembros y la edita administración', async () => {
    expect((await como(db, U.pamela.id, () => q(db, "select valor from tienda_config where clave = 'sitio'"))).length).toBe(1)
    await expect(como(db, U.pamela.id, () => q(db, "update tienda_config set valor = '{\"lema\": \"x\"}' where clave = 'sitio'"))).resolves.toBeDefined()
    expect((await q(db, "select valor from tienda_config where clave = 'sitio'"))[0].valor).toEqual({})
    await como(db, U.admin.id, () => q(db, "update tienda_config set valor = '{\"lema\": \"Nuevo\"}' where clave = 'sitio'"))
    expect((await q(db, "select valor from tienda_config where clave = 'sitio'"))[0].valor.lema).toBe('Nuevo')
  })
})
