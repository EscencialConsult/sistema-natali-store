// Formas orgánicas de la referencia de diseño: manchas vino, beige y rosa, hojas y líneas punteadas.
// Son puramente decorativas (aria-hidden, sin clics). Se dibujan en una capa a todo el ancho de la pantalla (ver TiendaApp),
// pegadas a los bordes, y quedan por detrás del contenido: nunca deben tapar un texto.

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

const Punteada = ({ className = '', d }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
    <path d={d} fill="none" stroke="var(--t-vino)" strokeWidth="2" strokeDasharray="7 9" strokeLinecap="round" />
  </svg>
)

const BEIGE = 'M60 30C130 -10 250 10 300 90C350 170 310 290 220 330C130 370 30 320 10 220C-10 140 20 60 60 30Z'
const ROSA = 'M80 40C150 -10 290 0 340 80C395 170 360 290 270 340C170 395 40 350 15 250C-5 170 20 80 80 40Z'

// Portada: mancha vino en la esquina de arriba a la izquierda (sin llegar a los textos), rosa y beige detrás del destacado.
export function DecorInicio() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Mancha className="absolute -left-28 top-16 hidden w-[24rem] max-w-none md:block" color="var(--t-vino)" d="M0 0H400C392 96 338 124 280 160C206 206 160 272 70 326C34 348 10 344 0 334Z" />
      <Mancha className="absolute left-[30%] top-2 hidden w-32 md:block" color="var(--t-beige)" d={BEIGE} />
      <Mancha className="absolute right-[2%] top-28 w-[20rem] max-w-none md:right-[5%] md:top-20 md:w-[30rem]" color="var(--t-rosa)" d={ROSA} />
      <Mancha className="absolute -right-24 top-[22rem] hidden w-[20rem] max-w-none opacity-80 md:block" color="var(--t-beige)" d={BEIGE} />
      <Hoja className="absolute left-[25%] top-20 hidden w-12 rotate-[28deg] md:block" />
      <Hoja className="absolute right-[3%] top-20 hidden w-12 -rotate-[24deg] md:block" color="var(--t-coral)" />
      <Hoja className="absolute right-[10%] top-[26rem] hidden w-14 rotate-[18deg] md:block" />
      <Punteada className="absolute -left-6 top-80 hidden w-40 md:block" d="M10 190C40 90 120 40 190 10" />
    </div>
  )
}

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
