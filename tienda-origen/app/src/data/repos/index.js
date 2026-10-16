// Repositorios activos. Las pantallas importan SOLO desde acá (nunca db.js ni Supabase).
// Con servidor configurado (hayBackend) lo propio de la tienda va a Supabase; el catálogo, el stock, los perfiles y la
// configuración siguen leyéndose de la base local, que `sync/remoto.js` mantiene al día (así el sitio y el kiosco abren sin red).
// El carrito es siempre local.
import { hayBackend } from '../supabase.js'
import { cambio as cambioLocal } from './local/cambio.js'
import { gastos as gastosLocal } from './local/gastos.js'
import { kiosco as kioscoLocal } from './local/kiosco.js'
import { pagos as pagosLocal } from './local/pagos.js'
import { pedidos as pedidosLocal } from './local/pedidos.js'
import { sitio as sitioLocal } from './local/sitio.js'
import { cambio as cambioRemoto } from './remoto/cambio.js'
import { gastos as gastosRemoto } from './remoto/gastos.js'
import { kiosco as kioscoRemoto } from './remoto/kiosco.js'
import { pagos as pagosRemoto } from './remoto/pagos.js'
import { pedidos as pedidosRemoto } from './remoto/pedidos.js'
import { sitio as sitioRemoto } from './remoto/sitio.js'

export { productos, esquemaProducto } from './local/productos.js'
export { categorias } from './local/categorias.js'
export { stock } from './local/stock.js'
export { perfiles } from './local/perfiles.js'
export { config } from './local/config.js'
export { carrito } from './local/carrito.js'
export { esquemaGasto } from './local/gastos.js'
export { esquemaSitio } from './local/sitio.js'

export const pedidos = hayBackend ? pedidosRemoto : pedidosLocal
export const pagos = hayBackend ? pagosRemoto : pagosLocal
export const gastos = hayBackend ? gastosRemoto : gastosLocal
export const sitio = hayBackend ? sitioRemoto : sitioLocal
export const kiosco = hayBackend ? kioscoRemoto : kioscoLocal
export const cambio = hayBackend ? cambioRemoto : cambioLocal
