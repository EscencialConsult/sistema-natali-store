// Repositorios activos. Las pantallas importan SOLO desde acá (nunca db.js ni Supabase).
// En la etapa 8 esta línea pasa a exportar la implementación remota con la misma interfaz.
export { productos, esquemaProducto } from './local/productos.js'
export { categorias } from './local/categorias.js'
export { ventas } from './local/ventas.js'
export { stock } from './local/stock.js'
export { perfiles } from './local/perfiles.js'
export { config } from './local/config.js'
