// Parte legible de la URL de un producto: "Blusa Satín MN-012" → "blusa-satin-mn-012". Único por producto (lleva el código).
export function slugDe(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
