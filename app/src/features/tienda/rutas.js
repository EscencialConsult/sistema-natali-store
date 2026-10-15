// La tienda pública vive bajo /tienda y se monta ANTES del arranque interno (Arranque, AuthProvider, SyncRunner).
export const BASE_TIENDA = '/tienda'
export const esRutaTienda = (pathname) => pathname === BASE_TIENDA || pathname.startsWith(`${BASE_TIENDA}/`)
export const rutaProducto = (id) => `${BASE_TIENDA}/p/${id}`
