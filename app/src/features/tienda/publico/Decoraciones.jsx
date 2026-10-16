// Formas orgánicas de la referencia de diseño. Son puramente decorativas (aria-hidden, sin clics).
// El catálogo las dibuja en una capa por detrás del contenido (ver TiendaApp). La portada tiene su propia composición
// dentro del panel de la portada (HomePage), así lo que se recorta lo recorta un solo contenedor.

export function Hoja({ className = '', color = 'var(--t-terracota)', style }) {
  return (
    <svg viewBox="0 0 80 110" className={className} style={style} aria-hidden="true" focusable="false">
      <path d="M40 4C70 30 78 70 40 106C2 70 10 30 40 4Z" fill={color} />
      <path d="M40 16V100" stroke="rgb(255 255 255 / 0.45)" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

const Mancha = ({ className = '', color, d, viewBox = '0 0 400 400' }) => (
  <svg viewBox={viewBox} className={className} aria-hidden="true" focusable="false">
    <path d={d} fill={color} />
  </svg>
)

// Catálogo: esquina vino arriba a la derecha y hojas, discretas, sin tocar la barra de categorías ni la grilla.
export function DecorCatalogo() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Mancha className="absolute -right-20 -top-24 hidden w-[24rem] max-w-none md:block" color="var(--t-vino)" d="M400 0V300C340 280 300 220 250 170C200 120 130 110 90 60C70 36 90 10 130 0Z" />
      <Hoja className="absolute right-6 top-24 hidden w-12 rotate-[20deg] md:block" />
      <Hoja className="absolute right-20 top-28 hidden w-10 -rotate-[18deg] md:block" color="var(--t-coral)" />
    </div>
  )
}
