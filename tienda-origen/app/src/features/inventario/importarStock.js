// Carga de stock desde Excel: la planilla dice cuántas prendas HAY de cada color (conteo real);
// el sistema registra la diferencia como un movimiento de "ajuste", así queda el historial.
import { stock } from '../../data/repos/index.js'

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const ALIAS = { codigo: ['codigo', 'cod'], color: ['color'], unidades: ['unidades', 'stock', 'cantidad', 'prendas'] }

const texto = (v) => {
  if (v == null) return ''
  if (typeof v === 'object') return String(v.result ?? v.text ?? v.richText?.map((r) => r.text).join('') ?? '')
  return String(v)
}

export async function crearPlantillaStock(productos, stockPorColor) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Stock')
  ws.columns = [
    { header: 'codigo', key: 'codigo', width: 12 },
    { header: 'producto', key: 'producto', width: 36 },
    { header: 'color', key: 'color', width: 18 },
    { header: 'unidades', key: 'unidades', width: 12 },
  ]
  ws.getRow(1).font = { bold: true }
  for (const p of productos) for (const c of p.colores) ws.addRow({ codigo: p.codigo, producto: p.nombre, color: c.nombre, unidades: stockPorColor[c.id] ?? 0 })
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export async function leerExcelStock(entrada) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(entrada)
  const ws = wb.worksheets[0]
  if (!ws) throw new Error('El archivo no tiene hojas.')
  const idx = {}
  ws.getRow(1).eachCell((celda, col) => {
    const t = norm(texto(celda.value))
    for (const [campo, alias] of Object.entries(ALIAS)) if (alias.includes(t) && !(campo in idx)) idx[campo] = col
  })
  const faltan = Object.keys(ALIAS).filter((c) => !(c in idx))
  if (faltan.length) throw new Error(`Faltan columnas en la primera fila: ${faltan.join(', ')}. Descargá la planilla con el stock actual para ver el formato.`)
  const filas = []
  ws.eachRow((row, n) => {
    if (n === 1) return
    const f = { fila: n, codigo: texto(row.getCell(idx.codigo).value).trim(), color: texto(row.getCell(idx.color).value).trim(), unidades: texto(row.getCell(idx.unidades).value).trim() }
    if (f.codigo || f.color || f.unidades) filas.push(f)
  })
  return filas
}

// productos: lista con colores; stockPorColor: { color_id: unidades }.
export function planificarStock(filas, productos, stockPorColor) {
  const porCodigo = new Map(productos.map((p) => [p.codigo.toUpperCase(), p]))
  const vistos = new Set()
  return filas.map((f) => {
    const errores = []
    const prod = porCodigo.get(f.codigo.toUpperCase())
    const color = prod?.colores.find((c) => norm(c.nombre) === norm(f.color))
    if (!f.codigo) errores.push('Falta el código.')
    else if (!prod) errores.push(`No existe el producto ${f.codigo}.`)
    else if (!color) errores.push(`${prod.codigo} no tiene el color “${f.color}”.`)
    const n = Number(f.unidades.replace(',', '.'))
    if (f.unidades === '' || !Number.isInteger(n) || n < 0) errores.push('Las unidades deben ser un número entero, 0 o más.')
    if (color && vistos.has(color.id)) errores.push('Ese producto y color están repetidos en el archivo.')
    if (errores.length) return { fila: f.fila, accion: 'error', errores, codigo: f.codigo, color: f.color }
    // Solo una fila correcta "reserva" el color: una con error no hace fallar a la siguiente.
    vistos.add(color.id)
    const actual = stockPorColor[color.id] ?? 0
    return { fila: f.fila, accion: n === actual ? 'sin_cambio' : 'ajustar', errores, codigo: prod.codigo, color: color.nombre, producto_id: prod.id, color_id: color.id, actual, nuevo: n, delta: n - actual }
  })
}

export async function ejecutarStock(plan, usuarioId) {
  let ajustados = 0
  for (const p of plan.filter((x) => x.accion === 'ajustar')) {
    await stock.registrarMovimiento({ producto_id: p.producto_id, color_id: p.color_id, tipo: 'ajuste', delta: p.delta, motivo: 'Carga de stock por Excel', usuario_id: usuarioId })
    ajustados++
  }
  return { ajustados }
}
