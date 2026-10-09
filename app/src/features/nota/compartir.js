// Compartir la nota por WhatsApp. Todo se genera en el dispositivo (funciona sin internet hasta el momento de enviar).
import { formatear } from '../../lib/moneda.js'

export async function notaComoImagen(nodo) {
  const { toBlob } = await import('html-to-image')
  const blob = await toBlob(nodo, { pixelRatio: 2, backgroundColor: '#ffffff' })
  if (!blob) throw new Error('No se pudo generar la imagen de la nota.')
  return blob
}

export function textoResumen(venta, negocio) {
  const lineas = venta.items.map((i) => `• ${i.codigo} ${i.nombre} (${i.color_nombre}) × ${i.cantidad} doc. — ${formatear(i.subtotal_cent, venta.moneda)}`)
  return [`*${negocio}* — Nota ${venta.numero}`, ...lineas, `*Total: ${formatear(venta.total_cent, venta.moneda)}*`].join('\n')
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Devuelve 'compartida' (menú del celular), 'descargada' (se bajó la imagen y se abrió WhatsApp) o 'cancelada'.
export async function compartirPorWhatsApp({ nodo, venta, negocio }) {
  const texto = textoResumen(venta, negocio)
  const blob = await notaComoImagen(nodo)
  const archivo = new File([blob], `${venta.numero}.png`, { type: 'image/png' })

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto })
      return 'compartida'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelada'
      throw e
    }
  }
  // Sin menú de compartir (escritorio): se descarga la imagen y se abre el chat con el resumen en texto.
  descargar(blob, archivo.name)
  const tel = String(venta.cliente_telefono ?? '').replace(/\D/g, '')
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  return 'descargada'
}
