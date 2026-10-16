// Errores de la API que significan "la tienda todavía no está activada en la base": la tabla tienda_config no existe.
// Lo usan el Gestor web (para explicarlo) y la tienda pública (para mostrar la pantalla de mantenimiento).
export const esErrorSinTabla = (e) =>
  e?.code === '42P01' || e?.code === 'PGRST205' || (/tienda_config/.test(e?.message ?? '') && /does not exist|schema cache/i.test(e?.message ?? ''))
