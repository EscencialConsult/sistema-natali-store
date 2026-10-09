// Generador común de Excel: todos los archivos salen con el mismo formato legible.
//   Arriba: título, fecha de generación y filtros aplicados. Encabezado ciruela con letra blanca, filas alternadas,
//   bordes finos, encabezado fijo y autofiltro. Importes y cantidades van como números (se pueden sumar en Excel).
//
// crearLibro({ titulo, filtros: [[etiqueta, valor]], hojas: [{ nombre, columnas, filas }] }) → Blob
//   columna: { titulo, clave, ancho?, tipo?: 'texto'|'entero'|'decimal'|'dinero'|'fecha', tono?: (fila) => 'exito'|'alerta'|'error'|null }

const COLOR = {
  tinta: 'FF8A3A63',
  blanco: 'FFFFFFFF',
  texto: 'FF2A2230',
  suave: 'FF5C5663',
  cebra: 'FFFBF7F3',
  borde: 'FFE5DDD6',
}
const TONO = {
  exito: { fondo: 'FFE7F4EA', letra: 'FF166534' },
  alerta: { fondo: 'FFFDF1DC', letra: 'FF92400E' },
  error: { fondo: 'FFFDECEB', letra: 'FFB42318' },
}
const FORMATO = { entero: '#,##0', decimal: '#,##0.0', dinero: '#,##0.00', fecha: 'dd/mm/yyyy hh:mm' }
const FILA_ENCABEZADO = 5

const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const bordeFino = () => {
  const b = { style: 'thin', color: { argb: COLOR.borde } }
  return { top: b, left: b, bottom: b, right: b }
}
const ahoraTexto = () => new Intl.DateTimeFormat('es-BO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())

function armarHoja(wb, { titulo, filtros = [] }, { nombre, columnas, filas }) {
  const hoja = wb.addWorksheet(nombre.slice(0, 31), { views: [{ state: 'frozen', ySplit: FILA_ENCABEZADO }] })
  hoja.columns = columnas.map((c) => ({ key: c.clave, width: c.ancho ?? Math.max(12, c.titulo.length + 4) }))
  const n = columnas.length
  const ultima = hoja.getColumn(n).letter

  hoja.mergeCells(`A1:${ultima}1`)
  Object.assign(hoja.getCell('A1'), { value: `${titulo} · ${nombre}`, font: { bold: true, size: 15, color: { argb: COLOR.tinta } } })
  hoja.getRow(1).height = 24
  hoja.mergeCells(`A2:${ultima}2`)
  Object.assign(hoja.getCell('A2'), { value: `Generado el ${ahoraTexto()} · ${filas.length} ${filas.length === 1 ? 'fila' : 'filas'}`, font: { italic: true, color: { argb: COLOR.suave } } })
  hoja.mergeCells(`A3:${ultima}3`)
  const textoFiltros = filtros.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')
  Object.assign(hoja.getCell('A3'), { value: `Filtros: ${textoFiltros || 'ninguno (todo)'}`, font: { color: { argb: COLOR.suave } } })

  const enc = hoja.getRow(FILA_ENCABEZADO)
  columnas.forEach((c, i) => {
    Object.assign(enc.getCell(i + 1), {
      value: c.titulo,
      font: { bold: true, color: { argb: COLOR.blanco } },
      fill: relleno(COLOR.tinta),
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border: bordeFino(),
    })
  })
  enc.height = 22

  filas.forEach((f, k) => {
    const fila = hoja.getRow(FILA_ENCABEZADO + 1 + k)
    columnas.forEach((c, i) => {
      const celda = fila.getCell(i + 1)
      const v = f[c.clave]
      celda.value = c.tipo === 'fecha' && v ? new Date(v) : (v ?? '')
      if (FORMATO[c.tipo]) celda.numFmt = FORMATO[c.tipo]
      celda.border = bordeFino()
      celda.alignment = { vertical: 'middle', horizontal: ['entero', 'decimal', 'dinero'].includes(c.tipo) ? 'right' : 'left' }
      const tono = c.tono?.(f)
      if (tono && TONO[tono]) {
        celda.fill = relleno(TONO[tono].fondo)
        celda.font = { bold: true, color: { argb: TONO[tono].letra } }
      } else if (k % 2 === 1) celda.fill = relleno(COLOR.cebra)
    })
  })

  if (filas.length) hoja.autoFilter = { from: { row: FILA_ENCABEZADO, column: 1 }, to: { row: FILA_ENCABEZADO + filas.length, column: n } }
  return hoja
}

export async function crearLibro({ titulo, filtros, hojas }) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Modas Naty'
  wb.created = new Date()
  for (const h of hojas) armarHoja(wb, { titulo, filtros }, h)
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// Primera fila de datos (para leer el archivo en tests).
export const PRIMERA_FILA_DATOS = FILA_ENCABEZADO + 1

export function descargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const nombreArchivo = (base) => `${base}-${new Date().toISOString().slice(0, 10)}.xlsx`

// Texto de un filtro elegido en un select: la etiqueta de la opción (vacío = sin filtro).
export const etiquetaDe = (opciones, valor) => (valor ? (opciones.find((o) => o.valor === valor)?.etiqueta ?? valor) : '')
const sinAcentos = (s = '') => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
// ¿Algún campo contiene el texto buscado? (sin importar acentos ni mayúsculas)
export const contiene = (texto, ...campos) => !texto?.trim() || campos.some((c) => sinAcentos(c).includes(sinAcentos(texto.trim())))

// Monedas elegidas en el modal como texto del filtro ('' si están todas).
export const textoMonedas = (lista, todas) => (lista.length === todas.length ? '' : lista.map((m) => m.toUpperCase()).join(', '))
