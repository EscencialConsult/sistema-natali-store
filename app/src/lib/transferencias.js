// Transferencias: cada venta por transferencia queda pendiente hasta que se completa, con comprobante o sin él.
import { comprimirImagen } from './imagen.js'

// Las ventas anteriores a esta función no tienen el campo: cuentan como completadas (sin comprobante).
export const transferenciaPendiente = (v) => v.comprobante_completado === false

// Con archivo en el servidor o esperando subirse desde este dispositivo.
export const tieneComprobante = (v) => !!(v.comprobante_ruta || v.comprobante_blob)

export const esPdf = (v) => (v.comprobante_blob ? v.comprobante_blob.type === 'application/pdf' : /\.pdf$/i.test(v.comprobante_ruta ?? ''))

const MAX_PDF = 5 * 1024 * 1024

// Foto: se comprime, pero más grande que la de un producto (los números del comprobante tienen que leerse). PDF: tal cual.
export async function prepararComprobante(archivo) {
  if (archivo.type === 'application/pdf') {
    if (archivo.size > MAX_PDF) throw new Error('El PDF es muy pesado (máximo 5 MB).')
    return new Blob([await archivo.arrayBuffer()], { type: 'application/pdf' })
  }
  if (!archivo.type.startsWith('image/')) throw new Error('El comprobante tiene que ser una foto o un PDF.')
  return comprimirImagen(archivo, { maxLado: 1600, calidad: 0.85 })
}
