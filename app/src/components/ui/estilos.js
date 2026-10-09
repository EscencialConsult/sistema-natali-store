// Recetas de clases compartidas: un solo lugar para el aspecto de campos y tarjetas.

// Campo de texto: blanco, borde con contraste 3:1 y anillo ciruela al enfocar.
export const CAMPO =
  'min-h-11 w-full rounded-control border bg-campo px-3.5 text-base text-texto placeholder:text-texto-tenue transition-[border-color,box-shadow] duration-150 hover:border-texto-tenue focus:border-tinta focus:outline-none focus:ring-4 focus:ring-tinta/12 disabled:opacity-50'

// Campo de búsqueda grande (lupa a la izquierda, botón borrar a la derecha).
export const BUSCADOR = `${CAMPO} border-borde-campo pl-12 pr-12 shadow-tarjeta [&::-webkit-search-cancel-button]:hidden`

export const TARJETA = 'rounded-tarjeta border border-borde/70 bg-superficie shadow-tarjeta'

// Fila clicable dentro de una lista (producto, venta, etc.).
export const FILA =
  'flex w-full items-center gap-3 rounded-tarjeta border border-borde/70 bg-superficie p-2.5 text-left shadow-tarjeta transition-[box-shadow,border-color] duration-150 hover:border-borde-fuerte hover:shadow-elevada'
