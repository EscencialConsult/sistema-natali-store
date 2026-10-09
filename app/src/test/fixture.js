// SOLO PRUEBAS: datos mínimos para los tests de la base local. No se usa en la app ni entra en el build
// (todo lo real viene de Supabase). Productos, colores y fotos son inventados.
import { db } from '../data/db.js'

const CATEGORIAS = ['BLAZER', 'BLUSAS', 'PANTALONES']
const NOMBRES = [
  'Blazer Clásico', 'Blazer Cropped', 'Blazer Oversize', 'Blusa Básica Rib', 'Blusa Asimétrica', 'Blusa de Lino',
  'Blusa Satín', 'Blusa Peplum', 'Pantalón Palazzo', 'Pantalón Recto', 'Pantalón Cargo', 'Pantalón de Lino',
]
const COLORES = [['Negro', '#1d1e20'], ['Rojo', '#b42318'], ['Beige', '#d9c3a5']]

export const PERFILES_PRUEBA = [
  { id: 'p-super', nombre: 'Natali', usuario: 'natyadmin', rol: 'superadmin', iniciales: 'N' },
  { id: 'p-admin', nombre: 'Administración', usuario: 'admin', rol: 'admin', iniciales: 'AD' },
  { id: 'p-ariel', nombre: 'Ariel Maydana', usuario: 'ariel', rol: 'vendedor', iniciales: 'AM' },
  { id: 'p-brayan', nombre: 'Brayan Aquino', usuario: 'brayan', rol: 'vendedor', iniciales: 'BA' },
  { id: 'p-norma', nombre: 'Norma Toloza', usuario: 'norma', rol: 'vendedor', iniciales: 'NT' },
  { id: 'p-maria', nombre: 'María Córdoba', usuario: 'maria', rol: 'enc_deposito', iniciales: 'MC' },
  { id: 'p-pamela', nombre: 'Pamela Aramayo', usuario: 'pamela', rol: 'enc_tienda', iniciales: 'PA' },
  { id: 'p-jehovana', nombre: 'Jehovana Calla', usuario: 'jehovana', rol: 'enc_ventas', iniciales: 'JC' },
]
export const CANTIDAD_PRODUCTOS = NOMBRES.length

const CONFIG = {
  negocio: { nombre: 'Modas Naty' },
  tipo_cambio: { bs: 6.96, ars: 1400, actualizado_en: null, ejemplo: true },
  url_catalogo: '',
  whatsapp_tienda: '',
  mostrar_precios_publico: false,
  stock_bajo_unidades: 24,
  unidades_por_docena: 12,
}

// Carga los datos de prueba una sola vez por archivo de test.
export async function cargarFixture() {
  if (await db.productos.count()) return
  const ahora = new Date().toISOString()
  await db.transaction('rw', db.perfiles, db.config, db.categorias, db.productos, db.producto_colores, db.producto_fotos, db.movimientos_stock, async () => {
    await db.perfiles.bulkAdd(PERFILES_PRUEBA.map((p) => ({ ...p, telefono: null, activo: true })))
    for (const [clave, valor] of Object.entries(CONFIG)) await db.config.put({ clave, valor })
    await db.categorias.bulkAdd(CATEGORIAS.map((nombre, orden) => ({ id: `cat-${orden}`, nombre, orden })))
    for (const [i, nombre] of NOMBRES.entries()) {
      const n = String(i + 1).padStart(3, '0')
      const id = `prod-${n}`
      await db.productos.add({
        id,
        codigo: `MN-${n}`,
        nombre,
        categoria_id: `cat-${Math.floor(i / 4)}`,
        descripcion: `Descripción de prueba de ${nombre}.`,
        precio_docena_usd_cent: 10_000 + i * 1_000,
        nuevo: i < 2,
        activo: true,
        creado_en: ahora,
      })
      await db.producto_fotos.add({ id: `foto-${n}`, producto_id: id, orden: 0, ruta: `/fotos-prueba/mn-${n}.jpg` })
      for (const [k, [color, hex]] of COLORES.entries()) {
        const colorId = `color-${n}-${k}`
        await db.producto_colores.add({ id: colorId, producto_id: id, nombre: color, hex, orden: k })
        await db.movimientos_stock.add({ id: `mov-${n}-${k}`, producto_id: id, color_id: colorId, tipo: 'entrada', delta: 60, motivo: 'Stock de prueba', usuario_id: null, venta_id: null, creado_en: ahora })
      }
    }
  })
}
