import Dexie from 'dexie'

// Base local (IndexedDB). Es la fuente de lectura de toda la app: catálogo, carrito, pedidos del dispositivo, cola.
// Nombre distinto al del sistema de nota ('modas-naty'): los dos corren en localhost durante el desarrollo y no deben pisarse.
// Para cambiar el esquema NO se edita la versión 1: se agrega db.version(2).stores({...}).upgrade(...).
export const db = new Dexie('modas-naty-tienda')

db.version(1).stores({
  // Catálogo compartido con el sistema de nota (decisión D4)
  perfiles: 'id, rol, activo',
  categorias: 'id, &nombre, orden',
  productos: 'id, &codigo, categoria_id, activo, nombre, slug',
  producto_colores: 'id, producto_id',
  producto_fotos: 'id, producto_id',
  movimientos_stock: 'id, producto_id, color_id, creado_en, pedido_id',
  config: 'clave',
  cola_sync: 'id, estado, creado_en, entidad, entidad_id',
  // Propio de la tienda
  carrito: 'key, producto_id, agregado_en',
  pedidos: 'id, &codigo, numero, estado, origen, creado_en, comprador_telefono',
  pedido_items: 'id, pedido_id, producto_id',
  pedido_historial: 'id, pedido_id, creado_en',
  gastos: 'id, categoria_id, fecha, creado_en',
  gasto_categorias: 'id, &nombre, orden',
})
