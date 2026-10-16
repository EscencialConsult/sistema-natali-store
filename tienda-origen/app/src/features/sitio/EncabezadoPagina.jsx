import { cn } from '../../lib/cn.js'

// Encabezado común de las pantallas del menú (Catálogo, Quiénes somos, Contacto): mismo tamaño, mismo punto de partida
// a la izquierda y mismo ancho que el resto de la página. Así cambiar de pestaña no mueve el título.
export default function EncabezadoPagina({ titulo, bajada, className }) {
  return (
    <header className={cn('flex flex-col gap-1', className)}>
      <h1 className="text-3xl md:text-4xl">{titulo}</h1>
      {bajada && <p className="text-texto-suave">{bajada}</p>}
    </header>
  )
}
