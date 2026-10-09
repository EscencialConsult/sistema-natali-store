// Excel de inventario: stock por color (con estado coloreado) y resumen por producto.
import { contiene } from '../../lib/excel.js'
import { estadoStock } from '../../lib/stock.js'

const ESTADO = { agotado: 'Agotado', bajo: 'Stock bajo', ok: 'Normal' }
const TONO = { Agotado: 'error', 'Stock bajo': 'alerta', Normal: 'exito' }

// filtros: { categoria_id, estado: ''|'agotado'|'bajo'|'ok', texto }
export function libroInventario({ productos, stock, categorias, umbral, filtros = {}, filtrosTexto = [] }) {
  const nombreCat = new Map(categorias.map((c) => [c.id, c.nombre]))
  const elegidos = productos.filter((p) => (!filtros.categoria_id || p.categoria_id === filtros.categoria_id) && contiene(filtros.texto, p.codigo, p.nombre))

  const porColor = elegidos.flatMap((p) =>
    p.colores.map((c) => {
      const prendas = stock[c.id] ?? 0
      const clave = estadoStock(prendas, umbral).clave
      return { codigo: p.codigo, producto: p.nombre, categoria: nombreCat.get(p.categoria_id) ?? '', color: c.nombre, prendas, docenas: Math.round((prendas / 12) * 10) / 10, estado: ESTADO[clave], clave }
    }),
  ).filter((f) => !filtros.estado || f.clave === filtros.estado)

  const porProducto = elegidos
    .map((p) => {
      const filas = porColor.filter((f) => f.codigo === p.codigo)
      return {
        codigo: p.codigo,
        producto: p.nombre,
        categoria: nombreCat.get(p.categoria_id) ?? '',
        colores: filas.length,
        prendas: filas.reduce((t, f) => t + f.prendas, 0),
        agotados: filas.filter((f) => f.clave === 'agotado').length,
        bajos: filas.filter((f) => f.clave === 'bajo').length,
      }
    })
    .filter((f) => f.colores > 0)

  return {
    titulo: 'Modas Naty · Inventario',
    filtros: [...filtrosTexto, ['Stock bajo', `${umbral} prendas o menos`]],
    hojas: [
      {
        nombre: 'Stock por color',
        columnas: [
          { titulo: 'Código', clave: 'codigo', ancho: 10 },
          { titulo: 'Producto', clave: 'producto', ancho: 32 },
          { titulo: 'Categoría', clave: 'categoria', ancho: 18 },
          { titulo: 'Color', clave: 'color', ancho: 16 },
          { titulo: 'Prendas', clave: 'prendas', tipo: 'entero', ancho: 10 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'decimal', ancho: 10 },
          { titulo: 'Estado', clave: 'estado', ancho: 12, tono: (f) => TONO[f.estado] },
        ],
        filas: porColor,
      },
      {
        nombre: 'Por producto',
        columnas: [
          { titulo: 'Código', clave: 'codigo', ancho: 10 },
          { titulo: 'Producto', clave: 'producto', ancho: 32 },
          { titulo: 'Categoría', clave: 'categoria', ancho: 18 },
          { titulo: 'Colores', clave: 'colores', tipo: 'entero', ancho: 10 },
          { titulo: 'Prendas', clave: 'prendas', tipo: 'entero', ancho: 10 },
          { titulo: 'Colores agotados', clave: 'agotados', tipo: 'entero', ancho: 16, tono: (f) => (f.agotados ? 'error' : null) },
          { titulo: 'Colores con stock bajo', clave: 'bajos', tipo: 'entero', ancho: 20, tono: (f) => (f.bajos ? 'alerta' : null) },
        ],
        filas: porProducto,
      },
    ],
  }
}
