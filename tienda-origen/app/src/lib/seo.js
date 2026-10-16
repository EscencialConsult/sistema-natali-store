// SEO del lado del navegador: título, descripción, Open Graph, canonical, noindex y datos estructurados por pantalla.
// Ojo: WhatsApp y Google a veces no ejecutan JavaScript; para eso existe la Netlify Function `og-producto`, que entrega las
// mismas etiquetas ya puestas en el HTML de /p/:slug. Esto cubre la navegación dentro de la app y a quien sí ejecuta JS.
import { useEffect } from 'react'

const NOMBRE = 'Modas Naty'

function poner(selector, crear, atributo, valor) {
  let el = document.head.querySelector(selector)
  if (valor == null || valor === '') {
    el?.remove()
    return
  }
  if (!el) {
    el = crear()
    document.head.appendChild(el)
  }
  el.setAttribute(atributo, valor)
}

const meta = (nombre, valor) => poner(`meta[name="${nombre}"]`, () => Object.assign(document.createElement('meta'), { name: nombre }), 'content', valor)
const og = (propiedad, valor) => {
  poner(`meta[property="${propiedad}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('property', propiedad)
    return m
  }, 'content', valor)
}

export const urlAbsoluta = (ruta) => (!ruta ? '' : /^(https?:)?\/\//.test(ruta) || ruta.startsWith('data:') ? ruta : `${window.location.origin}${ruta.startsWith('/') ? '' : '/'}${ruta}`)

// opciones: { titulo, descripcion, imagen, noindex, jsonld, tipo }
export function useSeo({ titulo, descripcion, imagen, noindex = false, jsonld = null, tipo = 'website' } = {}) {
  useEffect(() => {
    const completo = titulo ? `${titulo} · ${NOMBRE}` : NOMBRE
    const url = `${window.location.origin}${window.location.pathname}`
    document.title = completo
    meta('description', descripcion)
    meta('robots', noindex ? 'noindex, nofollow' : '')
    poner('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', noindex ? '' : url)
    og('og:title', completo)
    og('og:description', descripcion)
    og('og:type', tipo)
    og('og:url', url)
    og('og:image', urlAbsoluta(imagen) || urlAbsoluta('/icons/icon-512.png'))
    meta('twitter:card', 'summary_large_image')
    let script = null
    if (jsonld) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonld)
      document.head.appendChild(script)
    }
    return () => {
      script?.remove()
      // Al salir de una pantalla se quita lo específico para que no se herede en la siguiente.
      meta('robots', '')
    }
  }, [titulo, descripcion, imagen, noindex, jsonld, tipo])
}

// Pantallas que nunca deben indexarse (panel, kiosco, carrito, checkout, pedido, seguimiento): solo marca `robots`;
// el título lo sigue poniendo cada pantalla.
export function useSoloNoIndex() {
  useEffect(() => {
    meta('robots', 'noindex, nofollow')
    return () => meta('robots', '')
  }, [])
}

// Datos estructurados de un producto (Google muestra precio y disponibilidad).
export function jsonldProducto(p, { disponible, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nombre,
    sku: p.codigo,
    description: p.descripcion || p.nombre,
    image: (p.fotos ?? []).map((f) => urlAbsoluta(f.ruta)).filter(Boolean),
    brand: { '@type': 'Brand', name: NOMBRE },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BOB',
      price: (p.precio_unidad_bs_cent / 100).toFixed(2),
      availability: disponible ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }
}
