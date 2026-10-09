import Dexie from 'dexie'

// Base local (IndexedDB): copia de lo que viene de Supabase. Es la fuente de lectura de toda la app (funciona sin internet).
// Para cambiar el esquema NO se edita la versión 1: se agrega db.version(2).stores({...}).upgrade(...).
export const db = new Dexie('modas-naty')

db.version(1).stores({
  perfiles: 'id, rol, activo',
  categorias: 'id, &nombre, orden',
  productos: 'id, &codigo, categoria_id, activo, nombre',
  producto_colores: 'id, producto_id',
  producto_fotos: 'id, producto_id',
  ventas: 'id, numero, vendedor_id, creada_en, sync_status, moneda, estado',
  venta_items: 'id, venta_id, producto_id',
  movimientos_stock: 'id, producto_id, color_id, creado_en, venta_id',
  config: 'clave',
  cola_sync: 'id, estado, creado_en',
})

// v2: la cola se consulta por entidad (para no pisar con datos del servidor lo que está por enviarse).
db.version(2).stores({
  cola_sync: 'id, estado, creado_en, entidad, entidad_id',
})

// v4: índice por CI (versión intermedia, reemplazada por v5).
db.version(4).stores({ perfiles: 'id, rol, activo, &ci' })

// v5: se ingresa con nombre de usuario (solo el nombre, ej. "ariel"). Los perfiles son una copia del servidor:
// se vacían y se vuelven a descargar con el usuario de cada uno.
db.version(5)
  .stores({ perfiles: 'id, rol, activo, &usuario' })
  .upgrade((tx) => tx.table('perfiles').clear())
