// Pantalla completa para el kiosco. Si Chrome ya corre con --kiosk, el navegador ignora el pedido sin error.
export const enPantallaCompleta = () => !!document.fullscreenElement

export async function pedirPantallaCompleta() {
  if (enPantallaCompleta() || !document.documentElement.requestFullscreen) return false
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    return true
  } catch {
    return false
  }
}

export async function salirPantallaCompleta() {
  if (enPantallaCompleta() && document.exitFullscreen) await document.exitFullscreen().catch(() => {})
}
