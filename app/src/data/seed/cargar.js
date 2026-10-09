import { db } from '../db.js'
import { idDeterministico, nuevoId } from '../../lib/id.js'
import { hashClave, nuevaSal } from '../../lib/clave.js'
import { CLAVE_INICIAL, iniciales, PERFILES_SEED } from './perfiles.js'

// Valores base de configuración; los tipos de cambio son de EJEMPLO hasta que Natali los defina (B5).
export const CONFIG_BASE = {
  negocio: { nombre: 'Modas Naty' },
  tipo_cambio: { bs: 6.96, ars: 1400, actualizado_en: null, ejemplo: true },
  url_catalogo: '',
  whatsapp_tienda: '',
  mostrar_precios_publico: false,
  stock_bajo_unidades: 24,
  unidades_por_docena: 12,
}

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

  await asegurarAccesos()

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

// Modo sin servidor: siempre tiene que haber un superadmin, y todo perfil sin contraseña recibe la inicial
// (dispositivos cargados antes de que existieran las contraseñas). El hash se calcula fuera de la transacción.
async function asegurarAccesos() {
  if (!(await db.perfiles.where('rol').equals('superadmin').count())) {
    const s = PERFILES_SEED.find((p) => p.rol === 'superadmin')
    if (!(await db.perfiles.get(s.id)) && !(await db.perfiles.where('ci').equals(s.ci).count())) {
      await db.perfiles.add({ ...s, iniciales: iniciales(s.nombre), activo: true })
    }
  }
  const sinClave = (await db.perfiles.toArray()).filter((p) => !p.clave_hash)
  for (const p of sinClave) {
    const clave_sal = nuevaSal()
    await db.perfiles.update(p.id, { clave_sal, clave_hash: await hashClave(CLAVE_INICIAL, clave_sal) })
  }
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
