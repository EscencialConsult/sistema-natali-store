// Carga de stock desde Excel: la planilla dice cuántas DOCENAS hay de cada producto (conteo real, de 0,5 en 0,5);
// el sistema registra la diferencia como un movimiento de "ajuste", así queda el historial. Por dentro se guarda en prendas.
// El stock es del producto: la columna "color" de la planilla es solo informativa.
import { stock } from '../../data/repos/index.js'
import { aDocenas, aPrendas, leerDocenas } from '../../lib/docenas.js'

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
// Sin "unidades" ni "prendas": una planilla vieja (en prendas) no se toma como docenas por error.
const ALIAS = { codigo: ['codigo', 'cod'], docenas: ['docenas', 'docena', 'stock', 'cantidad'] }

// Docenas con 2 decimales, como se ven en la planilla (un stock viejo que no es media docena exacta queda, ej., 5,33).
const redondear = (prendas) => Math.round(aDocenas(prendas) * 100) / 100

const texto = (v) => {
  if (v == null) return ''
  if (typeof v === 'object') return String(v.result ?? v.text ?? v.richText?.map((r) => r.text).join('') ?? '')
  return String(v)
}

// stockPorProducto: { producto_id: prendas }
export async function crearPlantillaStock(productos, stockPorProducto) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Stock')
  ws.columns = [
    { header: 'codigo', key: 'codigo', width: 12 },
    { header: 'producto', key: 'producto', width: 36 },
    { header: 'color', key: 'color', width: 18 },
    { header: 'docenas', key: 'docenas', width: 12 },
  ]
  ws.getRow(1).font = { bold: true }
  for (const p of productos) ws.addRow({ codigo: p.codigo, producto: p.nombre, color: p.colores[0]?.nombre ?? '', docenas: redondear(stockPorProducto[p.id] ?? 0) })
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
  if (faltan.length) throw new Error(`Faltan columnas en la primera fila: ${faltan.join(', ')}. Descargá la planilla con el stock actual para ver el formato (el stock va en docenas).`)
  const filas = []
  ws.eachRow((row, n) => {
    if (n === 1) return
    const f = { fila: n, codigo: texto(row.getCell(idx.codigo).value).trim(), docenas: texto(row.getCell(idx.docenas).value).trim() }
    if (f.codigo || f.docenas) filas.push(f)
  })
  return filas
}

// productos: lista; stockPorProducto: { producto_id: prendas }. En el plan, actual / nuevo / delta van en prendas.
export function planificarStock(filas, productos, stockPorProducto) {
  const porCodigo = new Map(productos.map((p) => [p.codigo.toUpperCase(), p]))
  const vistos = new Set()
  return filas.map((f) => {
    const errores = []
    const prod = porCodigo.get(f.codigo.toUpperCase())
    if (!f.codigo) errores.push('Falta el código.')
    else if (!prod) errores.push(`No existe el producto ${f.codigo}.`)
    const actual = prod ? (stockPorProducto[prod.id] ?? 0) : 0
    // El mismo número que bajó en la planilla = sin cambio (aunque no sea media docena exacta).
    const igual = !!prod && f.docenas !== '' && Number(f.docenas.replace(',', '.')) === redondear(actual)
    const leida = igual ? null : leerDocenas(f.docenas, { permitirCero: true })
    if (leida?.error) errores.push(leida.error)
    if (prod && vistos.has(prod.id)) errores.push('Ese producto está repetido en el archivo.')
    if (errores.length) return { fila: f.fila, accion: 'error', errores, codigo: f.codigo }
    // Solo una fila correcta "reserva" el producto: una con error no hace fallar a la siguiente.
    vistos.add(prod.id)
    const n = igual ? actual : aPrendas(leida.docenas)
    return { fila: f.fila, accion: n === actual ? 'sin_cambio' : 'ajustar', errores, codigo: prod.codigo, nombre: prod.nombre, producto_id: prod.id, color_id: prod.colores[0]?.id ?? null, actual, nuevo: n, delta: n - actual }
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
