// Límites de almacenamiento del plan contratado. Los fija quien instala el sistema (variables de entorno);
// la clienta solo ve porcentajes y "contactá a tu proveedor".
const MB = 1024 * 1024
export const LIMITES = {
  datos: Number(import.meta.env.VITE_LIMITE_DATOS_MB || 500) * MB,
  fotos: Number(import.meta.env.VITE_LIMITE_FOTOS_MB || 1024) * MB,
}

export const UMBRAL_AVISO = 80
export const UMBRAL_URGENTE = 95

export const porcentaje = (usados, limite) => (limite > 0 ? Math.min(100, Math.round((usados / limite) * 1000) / 10) : 0)

// 'ok' | 'aviso' (80 %+) | 'urgente' (95 %+)
export const nivelDe = (pct) => (pct >= UMBRAL_URGENTE ? 'urgente' : pct >= UMBRAL_AVISO ? 'aviso' : 'ok')

// { datos_bytes, fotos_bytes } → { datos: { usados, limite, pct }, fotos: {...}, pct (el mayor), nivel }
export function resumenUso({ datos_bytes, fotos_bytes }, limites = LIMITES) {
  const datos = { usados: datos_bytes, limite: limites.datos, pct: porcentaje(datos_bytes, limites.datos) }
  const fotos = { usados: fotos_bytes, limite: limites.fotos, pct: porcentaje(fotos_bytes, limites.fotos) }
  const pct = Math.max(datos.pct, fotos.pct)
  return { datos, fotos, pct, nivel: nivelDe(pct) }
}

export function formatoBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < MB) return `${(b / 1024).toFixed(1).replace('.', ',')} KB`
  if (b < 1024 * MB) return `${(b / MB).toFixed(1).replace('.', ',')} MB`
  return `${(b / (1024 * MB)).toFixed(2).replace('.', ',')} GB`
}
