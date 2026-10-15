// Comprime una foto en el navegador antes de guardarla: la conexión es mala y el espacio del celular, limitado.
const MAX_LADO = 900
const CALIDAD = 0.82

export async function comprimirImagen(archivo, { maxLado = MAX_LADO, calidad = CALIDAD } = {}) {
  if (!archivo.type.startsWith('image/')) throw new Error(`"${archivo.name}" no es una imagen.`)
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const ancho = Math.round(bmp.width * escala)
  const alto = Math.round(bmp.height * escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ancho, alto)
  ctx.drawImage(bmp, 0, 0, ancho, alto)
  bmp.close()
  const blob = await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', calidad))
  if (!blob) throw new Error(`No se pudo procesar "${archivo.name}".`)
  return blob
}
