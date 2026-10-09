// Un blob (foto o logo subido desde el dispositivo) se convierte en URL una sola vez.
// Son pocos archivos y de uso continuo, por eso no se liberan.
const urls = new WeakMap()

// Acepta { blob, ruta } y devuelve la URL para un <img>, o null si no hay imagen.
export function urlDeImagen(img) {
  if (!img) return null
  if (!img.blob) return img.ruta || null
  if (!urls.has(img.blob)) urls.set(img.blob, URL.createObjectURL(img.blob))
  return urls.get(img.blob)
}
