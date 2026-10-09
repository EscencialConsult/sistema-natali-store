// Datos de DEMOSTRACIÓN para probar el sistema con una semana de movimiento creíble.
// No es información real: nombres de clientas, teléfonos y ventas son inventados. Se puede repetir (suma más ventas)
// y se borra con "Reiniciar datos" (vuelve al catálogo de ejemplo).
import { db } from '../db.js'
import { config, perfiles, productos, stock, ventas } from '../repos/index.js'
import { convertirDesdeUsd } from '../../lib/moneda.js'

const CLIENTAS = ['Boutique Valentina', 'Ropa Lucía', 'Tienda La Moda', 'Carmen Rojas', 'Estilo Sur', 'Moda Express', 'Daniela Paz', 'Casa Aura', 'Boutique Sol', 'Rosa Mamani', 'Fashion Center', 'Gabriela Vega']
const TELEFONOS_DEMO = { 'p-ariel': '59170000001', 'p-brayan': '59170000002', 'p-norma': '59170000003', 'p-pamela': '59170000004' }

// Generador pseudoaleatorio con semilla: la demo sale igual cada vez que se genera.
const prng = (semilla) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

async function fecharVenta(id, iso) {
  await db.transaction('rw', db.ventas, db.movimientos_stock, db.cola_sync, async () => {
    await db.ventas.update(id, { creada_en: iso, sync_status: 'synced' })
    await db.movimientos_stock.where('venta_id').equals(id).modify({ creado_en: iso })
    // Las ventas de la demo se dan por ya enviadas: no quedan "por enviar".
    const pendientes = await db.cola_sync.filter((c) => c.entidad_id === id).toArray()
    await db.cola_sync.bulkDelete(pendientes.map((c) => c.id))
  })
}

export async function generarDemo({ cantidad = 40, dias = 9, semilla = 7, ahora = new Date() } = {}) {
  const inicio = new Date().toISOString()
  const rnd = prng(semilla)
  const elegir = (lista) => lista[Math.floor(rnd() * lista.length)]
  const [prods, equipo, tc, stockPorColor] = await Promise.all([productos.listar(), perfiles.listar(), config.obtener('tipo_cambio'), stock.resumen()])
  if (prods.length === 0) throw new Error('No hay productos para armar la demo.')

  // Datos que la nota necesita y que Natali todavía no cargó (solo si están vacíos).
  for (const p of equipo) if (TELEFONOS_DEMO[p.id] && !p.telefono) await perfiles.actualizar(p.id, { telefono: TELEFONOS_DEMO[p.id] })
  if (!(await config.obtener('url_catalogo'))) await config.guardar('url_catalogo', 'https://modasnaty.example/c')

  // Las vendedoras venden más que las encargadas.
  const vendedores = equipo.filter((p) => ['vendedor', 'enc_tienda', 'enc_ventas'].includes(p.rol)).flatMap((p) => (p.rol === 'vendedor' ? [p, p, p] : [p]))
  const admin = equipo.find((p) => p.rol === 'admin')

  // Momentos repartidos en los últimos días (horario comercial); algunas de hoy. Se crean en orden para que la numeración sea cronológica.
  const momentos = Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(ahora)
    const atras = i < Math.round(cantidad * 0.2) ? 0 : 1 + Math.floor(rnd() * (dias - 1))
    d.setDate(d.getDate() - atras)
    d.setHours(9 + Math.floor(rnd() * 10), Math.floor(rnd() * 60), 0, 0)
    return d > ahora ? new Date(ahora.getTime() - 60_000 * (1 + Math.floor(rnd() * 120))) : d
  }).sort((a, b) => a - b)

  const creadas = []
  for (const momento of momentos) {
    const moneda = rnd() < 0.65 ? 'usd' : rnd() < 0.55 ? 'bs' : 'ars'
    const items = []
    for (let k = 0, n = 1 + Math.floor(rnd() * 4); k < n; k++) {
      const p = elegir(prods)
      const color = elegir(p.colores)
      const cantidadDoc = 1 + Math.floor(rnd() * 3)
      const yaElegido = items.some((i) => i.color_id === color.id)
      if (yaElegido || (stockPorColor[color.id] ?? 0) < cantidadDoc * 12) continue
      stockPorColor[color.id] -= cantidadDoc * 12
      items.push({ producto_id: p.id, color_id: color.id, cantidad: cantidadDoc, unidad: 'docena', precio_cent: convertirDesdeUsd(p.precio_docena_usd_cent, moneda, tc) })
    }
    if (items.length === 0) continue
    const v = await ventas.crear({
      vendedor_id: elegir(vendedores).id,
      moneda,
      tipo_cambio: moneda === 'usd' ? 1 : tc[moneda],
      metodo_pago: rnd() < 0.6 ? 'efectivo' : 'transferencia',
      cliente_nombre: rnd() < 0.8 ? elegir(CLIENTAS) : '',
      items,
    })
    await fecharVenta(v.id, momento.toISOString())
    creadas.push({ id: v.id, momento })
  }

  // Dos ventas viejas anuladas, para ver cómo se ven.
  let anuladas = 0
  for (const c of creadas.filter((x) => x.momento < new Date(ahora.getTime() - 86_400_000)).slice(0, 2)) {
    await ventas.anular(c.id, { motivo: 'Error de carga (demo)', usuario_id: admin.id })
    await fecharVenta(c.id, c.momento.toISOString())
    anuladas++
  }

  // Reposiciones de mercadería de la encargada de depósito a lo largo de la semana.
  const deposito = equipo.find((p) => p.rol === 'enc_deposito') ?? admin
  let entradas = 0
  for (let i = 0; i < 6; i++) {
    const p = elegir(prods)
    const color = elegir(p.colores)
    const mov = await stock.registrarMovimiento({ producto_id: p.id, color_id: color.id, tipo: 'entrada', delta: 12 * (2 + Math.floor(rnd() * 5)), motivo: 'Ingreso de mercadería (demo)', usuario_id: deposito.id })
    const d = new Date(ahora)
    d.setDate(d.getDate() - Math.floor(rnd() * dias))
    d.setHours(8, 30, 0, 0)
    await db.movimientos_stock.update(mov.id, { creado_en: d.toISOString() })
    entradas++
  }

  // Lo de la demo se da por ya enviado: no queda nada "por enviar" ni se manda al servidor.
  await db.cola_sync.filter((c) => c.creado_en >= inicio).delete()
  return { ventas: creadas.length, anuladas, entradas }
}
