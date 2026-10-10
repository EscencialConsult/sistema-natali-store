// Excel de inventario: stock por producto (con estado coloreado), en docenas. El color es informativo.
import { aDocenas, textoDocenas } from '../../lib/docenas.js'
import { contiene } from '../../lib/excel.js'
import { estadoStock } from '../../lib/stock.js'

const ESTADO = { agotado: 'Agotado', bajo: 'Stock bajo', ok: 'Normal' }
const TONO = { Agotado: 'error', 'Stock bajo': 'alerta', Normal: 'exito' }

// 2 decimales: un stock viejo que no es media docena exacta (ej. 5,33).
const docenas = (prendas) => Math.round(aDocenas(prendas) * 100) / 100

// stock: { producto_id: prendas } · filtros: { categoria_id, estado: ''|'agotado'|'bajo'|'ok', texto }
export function libroInventario({ productos, stock, categorias, umbral, filtros = {}, filtrosTexto = [] }) {
  const nombreCat = new Map(categorias.map((c) => [c.id, c.nombre]))
  const filas = productos
    .filter((p) => (!filtros.categoria_id || p.categoria_id === filtros.categoria_id) && contiene(filtros.texto, p.codigo, p.nombre))
    .map((p) => {
      const prendas = stock[p.id] ?? 0
      const clave = estadoStock(prendas, umbral).clave
      return { codigo: p.codigo, producto: p.nombre, categoria: nombreCat.get(p.categoria_id) ?? '', color: p.colores[0]?.nombre ?? '', docenas: docenas(prendas), estado: ESTADO[clave], clave }
    })
    .filter((f) => !filtros.estado || f.clave === filtros.estado)

  return {
    titulo: 'Modas Naty · Inventario',
    filtros: [...filtrosTexto, ['Stock bajo', `${textoDocenas(umbral, { corto: false })} o menos`]],
    hojas: [
      {
        nombre: 'Stock',
        columnas: [
          { titulo: 'Código', clave: 'codigo', ancho: 10 },
          { titulo: 'Producto', clave: 'producto', ancho: 32 },
          { titulo: 'Categoría', clave: 'categoria', ancho: 18 },
          { titulo: 'Color', clave: 'color', ancho: 16 },
          { titulo: 'Docenas', clave: 'docenas', tipo: 'docenas', ancho: 10 },
          { titulo: 'Estado', clave: 'estado', ancho: 12, tono: (f) => TONO[f.estado] },
        ],
        filas,
      },
    ],
  }
}
