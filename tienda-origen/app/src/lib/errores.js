// Traduce los errores de la base (Supabase/Postgres) a errores de la app con el mismo `code` que usan los repositorios locales.
// Los mensajes de las funciones tienda_* ya vienen en español: se muestran tal cual.
const CODIGOS = ['TIENDA_STOCK_INSUFICIENTE', 'TIENDA_TRANSICION_INVALIDA', 'TIENDA_CAMBIO_ACTUALIZADO', 'TIENDA_SIN_TIPO_CAMBIO', 'TIENDA_MONEDA_INVALIDA']

export function errorDeBase(error, porDefecto = 'No pudimos completar la operación. Probá de nuevo.') {
  if (!error) return new Error(porDefecto)
  const e = new Error(limpiar(error.message) || porDefecto)
  const detalle = `${error.details ?? ''} ${error.hint ?? ''} ${error.message ?? ''}`
  e.code = CODIGOS.find((c) => detalle.includes(c)) ?? error.code ?? null
  if (/fetch|network|Failed to fetch/i.test(error.message ?? '')) {
    e.message = 'No hay conexión. Revisá internet y probá de nuevo.'
    e.code = 'SIN_CONEXION'
  }
  return e
}

// PostgREST envuelve el mensaje de `raise exception`: se deja solo el texto de la función.
const limpiar = (m) => String(m ?? '').replace(/^.*?:\s*(?=[A-ZÁÉÍÓÚÑ])/, '').trim()
