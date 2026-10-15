// Construcción segura de filtros PostgREST (el texto de la persona nunca se pega tal cual en un `or=`).
export const TAMANO_PAGINA = 24

// Quita lo que rompe la sintaxis de filtros: , ( ) * % " \ y comodines.
export const limpiarTexto = (t) => String(t ?? '').replace(/[,()*%"\\_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)

const comillas = (v) => `"${String(v).replace(/["\\]/g, '')}"`

// Paginación por clave (codigo, id): estable aunque se agreguen productos mientras se navega.
export const filtroKeyset = (despues) =>
  despues ? `codigo.gt.${comillas(despues.codigo)},and(codigo.eq.${comillas(despues.codigo)},id.gt.${despues.id})` : null

export const filtroTexto = (texto) => {
  const t = limpiarTexto(texto)
  return t ? `codigo.ilike.*${t}*,nombre.ilike.*${t}*` : null
}
