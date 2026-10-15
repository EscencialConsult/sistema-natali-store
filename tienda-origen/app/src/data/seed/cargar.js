import { db } from '../db.js'
import { idDeterministico, nuevoId } from '../../lib/id.js'
import { iniciales, PERFILES_SEED } from './perfiles.js'
import { slugDe } from '../../lib/slug.js'

// Valores base de configuración; los tipos de cambio son de EJEMPLO hasta que Natali los defina (B5).
export const CONFIG_BASE = {
  negocio: { nombre: 'Modas Naty' },
  tipo_cambio: { bs: 6.96, ars: 1400, actualizado_en: null, ejemplo: true },
  // Conversión de la tienda: 5 bolivianos = 1 peso argentino (se cambia desde el panel).
  cambio: { bs: 5, ars: 1, version: 1, actualizado_en: null },
  // Recargo por pago en línea (% que descuenta Mercado Pago). En el modo de ejemplo no se cobra pasarela real: 0.
  recargo_mp: { pct: 0 },
  whatsapp_tienda: '',
  stock_bajo_unidades: 6,
}

// Categorías de gasto iniciales (genéricas hasta que Natali diga las suyas, bloqueo B-G1).
export const GASTO_CATEGORIAS_BASE = ['Mercadería', 'Alquiler', 'Sueldos', 'Envíos', 'Servicios', 'Otros']

// Precio minorista de EJEMPLO para el seed: se deriva del precio por docena en USD (bloqueo B-C1: Natali carga los reales).
const precioUnidadEjemplo = (docenaUsdCent) => Math.round((docenaUsdCent * CONFIG_BASE.tipo_cambio.bs) / 12)

let enCurso = null

// Carga perfiles, config y catálogo de ejemplo solo si faltan. Segura de llamar varias veces.
export function cargarSeedSiVacio() {
  enCurso ??= cargar().finally(() => {
    enCurso = null
  })
  return enCurso
}

async function cargar() {
  const hizo = { perfiles: false, config: false, catalogo: false }

  await db.transaction('rw', db.perfiles, db.config, async () => {
    if ((await db.perfiles.count()) === 0) {
      await db.perfiles.bulkAdd(PERFILES_SEED.map((p) => ({ ...p, iniciales: iniciales(p.nombre), activo: true })))
      hizo.perfiles = true
    }
    for (const [clave, valor] of Object.entries(CONFIG_BASE)) {
      if (!(await db.config.get(clave))) {
        await db.config.put({ clave, valor })
        hizo.config = true
      }
    }
  })

  if ((await db.gasto_categorias.count()) === 0) {
    await db.gasto_categorias.bulkAdd(GASTO_CATEGORIAS_BASE.map((nombre, i) => ({ id: idDeterministico(`gasto_categoria:${nombre.toLowerCase()}`), nombre, orden: i + 1 })))
  }

  if ((await db.productos.count()) === 0) {
    const { default: seed } = await import('./productos.json')
    const ahora = new Date().toISOString()
    await db.transaction('rw', db.categorias, db.productos, db.producto_colores, db.producto_fotos, db.movimientos_stock, async () => {
      if ((await db.productos.count()) > 0) return
      const catId = new Map()
      for (const [orden, nombre] of seed.categorias.entries()) {
        const id = idDeterministico(`categoria:${nombre}`)
        catId.set(nombre, id)
        await db.categorias.add({ id, nombre, orden })
      }
      for (const p of seed.productos) {
        const id = nuevoId()
        await db.productos.add({
          id,
          codigo: p.codigo,
          nombre: p.nombre,
          categoria_id: catId.get(p.categoria),
          descripcion: p.descripcion,
          precio_docena_usd_cent: p.precio_docena_usd_cent,
          precio_unidad_bs_cent: precioUnidadEjemplo(p.precio_docena_usd_cent),
          publicado_tienda: true,
          destacado: false,
          slug: slugDe(`${p.nombre} ${p.codigo}`),
          nuevo: p.nuevo,
          activo: true,
          provisional: true,
          creado_en: ahora,
        })
        await db.producto_fotos.bulkAdd(p.fotos.map((ruta, orden) => ({ id: nuevoId(), producto_id: id, orden, ruta })))
        for (const [orden, c] of p.colores.entries()) {
          const colorId = nuevoId()
          await db.producto_colores.add({ id: colorId, producto_id: id, nombre: c.nombre, hex: c.hex, orden })
          if (c.stock_unidades > 0) {
            await db.movimientos_stock.add({
              id: nuevoId(),
              producto_id: id,
              color_id: colorId,
              tipo: 'entrada',
              delta: c.stock_unidades,
              motivo: 'Stock inicial (ejemplo)',
              usuario_id: null,
              venta_id: null,
              creado_en: ahora,
            })
          }
        }
      }
      hizo.catalogo = true
    })
  }
  return hizo
}

// Con servidor NO hay datos de ejemplo: lo que hay en el dispositivo viene de Supabase. La primera vez que una versión con
// servidor abre un dispositivo que tenía datos de prueba, se limpian (esos datos de ejemplo no existen en el servidor).
export async function prepararBase({ conServidor }) {
  if (!conServidor) return cargarSeedSiVacio()
  const origen = await db.config.get('origen')
  if (origen?.valor !== 'supabase') {
    await db.delete()
    await db.open()
    await db.config.put({ clave: 'origen', valor: 'supabase' })
  }
  return null
}

// Solo desarrollo: borra todo y vuelve a cargar los datos de prueba.
export async function reiniciarDatos() {
  await db.delete()
  await db.open()
  return cargarSeedSiVacio()
}
