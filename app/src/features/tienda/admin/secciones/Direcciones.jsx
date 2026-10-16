import { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'

function Fila({ nombre, ayuda, url }) {
  const [copiado, setCopiado] = useState(false)
  const [fallo, setFallo] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setFallo(true)
      setTimeout(() => setFallo(false), 4000)
    }
  }
  return (
    <li className="flex flex-col gap-1 border-t border-borde/50 py-3 first:border-t-0">
      <span className="text-sm font-medium">{nombre}</span>
      <span className="text-sm text-texto-suave">{ayuda}</span>
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 break-all rounded-control bg-superficie-2 px-2 py-1 text-sm">{url}</code>
          <button type="button" onClick={copiar} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta">
            {copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado ? 'Copiada' : 'Copiar'}
          </button>
          <span role="status" className="text-sm text-texto-suave">{copiado ? 'Dirección copiada' : fallo ? 'No se pudo copiar: seleccioná la dirección y copiala a mano.' : ''}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta">
            <ExternalLink size={16} aria-hidden /> Abrir
          </a>
        </div>
      ) : (
        <span className="text-sm text-texto-suave">Todavía sin cargar: se define en Ajustes, «Catálogo y código QR».</span>
      )}
    </li>
  )
}

// Todas las direcciones web del negocio en un solo lugar. Solo lectura: se cambian donde nacen (Ajustes o el hosting).
export default function Direcciones({ resumen }) {
  const { sitio } = resumen
  return (
    <section className="flex flex-col gap-2 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5">
      <h3 className="text-lg">Direcciones web</h3>
      <ul>
        <Fila nombre="Tienda pública" ayuda="Lo que ve la clienta. Es la dirección para compartir." url={sitio.urlPublica} />
        <Fila nombre="Sistema del equipo" ayuda="Notas de venta y stock. Solo con usuario y contraseña." url={sitio.urlSistema} />
        <Fila nombre="Dirección del QR de la nota" ayuda="Lo que abre el QR impreso. Se cambia en Ajustes, «Catálogo y código QR»." url={sitio.urlQr} />
      </ul>
    </section>
  )
}
