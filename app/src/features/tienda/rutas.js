// Mapa del sitio (decisión D20):
//   /               → portada de la tienda pública
//   /catalogo       → catálogo mayorista
//   /quienes-somos, /contacto, /ayuda → información (el menú de la referencia de diseño)
//   /admin          → sistema de notas de venta y stock (el de Renzo), con basename /admin
// El sistema interno y la tienda nunca conviven en la misma carga de página.
export const BASE_ADMIN = '/admin'
export const esRutaAdmin = (pathname) => pathname === BASE_ADMIN || pathname.startsWith(`${BASE_ADMIN}/`)
export const esRutaTienda = (pathname) => !esRutaAdmin(pathname)

export const RUTA_INICIO = '/'
export const RUTA_CATALOGO = '/catalogo'
export const RUTA_PRODUCTO = '/p/:id'
export const RUTA_PEDIDO = '/pedido'
export const RUTA_QUIENES_SOMOS = '/quienes-somos'
export const RUTA_CONTACTO = '/contacto'
export const RUTA_AYUDA = '/ayuda'
export const rutaProducto = (id) => `/p/${id}`
export const rutaCategoria = (id) => `${RUTA_CATALOGO}?categoria=${encodeURIComponent(id)}`

// Direcciones que existieron antes: siguen funcionando y llevan a la pantalla que las reemplazó.
export const RUTAS_ANTERIORES = {
  '/como-comprar': RUTA_AYUDA,
  '/donde-estamos': RUTA_CONTACTO,
}
