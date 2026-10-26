// Por qué falló un envío. Cambia qué se le dice a la persona y cómo reintenta la cola:
//   'sesion'  token vencido o sesión sin renovar: la venta está bien, se reenvía sola al renovarse.
//   'red'     sin comunicación con el servidor: se reenvía sola al volver.
//   'rechazo' el servidor miró la venta y la rechazó (permiso, total que no cierra…): hay que mirarla.
const SESION = /JWT|PGRST30[123]|No autenticado|Invalid Refresh Token|Auth session missing/i
const RED = /Failed to fetch|NetworkError|network|Load failed|fetch failed|timed? ?out|ECONN|ENOTFOUND|AbortError|PGRST002|\b50[234]\b|Retryable/i

export function clasificar(error) {
  const texto = `${error?.name ?? ''} ${error?.message ?? error ?? ''} ${error?.code ?? ''}`
  if (error?.code === '28000' || SESION.test(texto)) return 'sesion'
  if (RED.test(texto)) return 'red'
  return 'rechazo'
}

export const TEXTO_CAUSA = {
  sesion: 'La sesión de este equipo no se pudo renovar.',
  red: 'No hay comunicación con el servidor.',
  rechazo: 'El servidor rechazó el cambio.',
}
