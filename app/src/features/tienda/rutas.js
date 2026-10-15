// Mapa del sitio (decisión D20):
//   /          → portada de la tienda pública
//   /catalogo  → catálogo mayorista
//   /admin     → sistema de notas de venta y stock (el de Renzo), con basename /admin
// El sistema interno y la tienda nunca conviven en la misma carga de página.
export const BASE_ADMIN = '/admin'
export const esRutaAdmin = (pathname) => pathname === BASE_ADMIN || pathname.startsWith(`${BASE_ADMIN}/`)
export const esRutaTienda = (pathname) => !esRutaAdmin(pathname)

export const RUTA_INICIO = '/'
export const RUTA_CATALOGO = '/catalogo'
export const RUTA_PRODUCTO = '/p/:id'
export const RUTA_PEDIDO = '/pedido'
export const RUTA_COMO_COMPRAR = '/como-comprar'
export const RUTA_DONDE_ESTAMOS = '/donde-estamos'
export const rutaProducto = (id) => `/p/${id}`
export const rutaCategoria = (id) => `${RUTA_CATALOGO}?categoria=${encodeURIComponent(id)}`
