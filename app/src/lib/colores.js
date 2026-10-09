// Colores de uso común en moda, para sugerir y para convertir nombres del Excel en una muestra visible.
export const COLORES_CONOCIDOS = [
  ['Negro', '#1a1a1a'], ['Blanco', '#f7f7f5'], ['Beige', '#d9c3a5'], ['Camel', '#b98a52'],
  ['Rojo', '#c0262d'], ['Rosa', '#e58ea8'], ['Fucsia', '#c2185b'], ['Celeste', '#8cc4e8'],
  ['Azul marino', '#1f2f5a'], ['Azul', '#2a5db0'], ['Verde oliva', '#6b7140'], ['Verde', '#2e7d4f'],
  ['Lila', '#b79bd1'], ['Mostaza', '#d6a62a'], ['Gris', '#8d9095'], ['Marrón', '#6d4a33'],
  ['Naranja', '#e07a2d'], ['Amarillo', '#f1d04b'], ['Vino', '#6e1f33'], ['Crema', '#efe6d2'],
]

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const MAPA = new Map(COLORES_CONOCIDOS.map(([n, h]) => [sinTildes(n), h]))

export const hexDeNombre = (nombre) => MAPA.get(sinTildes(nombre)) ?? '#cccccc'
