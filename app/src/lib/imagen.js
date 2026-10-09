// Comprime una foto en el navegador antes de guardarla: la conexión es mala y el espacio del celular, limitado.
const MAX_LADO = 900
const CALIDAD = 0.82

// transparente: sale en PNG sin fondo (logos); si no, JPEG con fondo blanco (fotos, más livianas).
export async function comprimirImagen(archivo, { maxLado = MAX_LADO, calidad = CALIDAD, transparente = false } = {}) {
  if (!archivo.type.startsWith('image/')) throw new Error(`"${archivo.name}" no es una imagen.`)
  const bmp = await createImageBitmap(archivo)
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const ancho = Math.round(bmp.width * escala)
  const alto = Math.round(bmp.height * escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const ctx = lienzo.getContext('2d')
  if (!transparente) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ancho, alto)
  }
  ctx.drawImage(bmp, 0, 0, ancho, alto)
  bmp.close()
  const blob = await new Promise((ok) => lienzo.toBlob(ok, transparente ? 'image/png' : 'image/jpeg', calidad))
  if (!blob) throw new Error(`No se pudo procesar "${archivo.name}".`)
  return blob
}

const MAX_SVG = 300 * 1024

// Logo del negocio: respeta el formato. SVG se guarda tal cual (vectorial, nítido en cualquier tamaño);
// PNG/WebP/GIF pasan a PNG conservando la transparencia; JPG sigue en JPG.
export async function prepararLogo(archivo, { maxLado = 600 } = {}) {
  if (archivo.type === 'image/svg+xml') {
    if (archivo.size > MAX_SVG) throw new Error('El logo SVG es muy pesado (máximo 300 KB).')
    return new Blob([await archivo.arrayBuffer()], { type: 'image/svg+xml' })
  }
  const transparente = archivo.type !== 'image/jpeg'
  return comprimirImagen(archivo, { maxLado, calidad: 0.92, transparente })
}
