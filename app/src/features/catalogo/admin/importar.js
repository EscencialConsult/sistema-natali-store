// Lógica de la carga masiva (sin pantallas, para poder probarla): leer Excel → planificar → ejecutar.
import { categorias, productos } from '../../../data/repos/index.js'
import { partirCodigo, puntajeCodigo } from '../../../lib/codigo.js'
import { hexDeNombre } from '../../../lib/colores.js'
import { aCentavos } from '../../../lib/moneda.js'

export const COLUMNAS = ['codigo', 'nombre', 'categoria', 'precio_docena_usd', 'color']

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const ALIAS = {
  codigo: ['codigo', 'cod', 'code'],
  nombre: ['nombre', 'producto', 'descripcion corta'],
  categoria: ['categoria', 'rubro'],
  precio: ['precio_docena_usd', 'precio docena usd', 'precio docena', 'precio', 'usd'],
  color: ['color', 'colores'],
}

function textoCelda(v) {
  if (v == null) return ''
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((r) => r.text).join('')
    if (v.result !== undefined) return String(v.result)
    if (v.text) return String(v.text)
  }
  return String(v)
}

// Filas de ejemplo de la plantilla (genéricas: se reemplazan por los productos reales).
export const EJEMPLOS = [
  { codigo: 'MN-001', nombre: 'Blusa de lino manga corta', categoria: 'BLUSAS Y CAMISAS', precio: 120, color: 'Negro' },
  { codigo: 'MN-002', nombre: 'Pantalón palazzo', categoria: 'PANTALONES', precio: 150.5, color: 'Beige' },
  { codigo: 'MN-003', nombre: 'Vestido largo estampado', categoria: 'VESTIDOS', precio: 210, color: '' },
]

// Qué va en cada columna (hoja "Cómo llenarla" y modal de carga).
export const AYUDA_COLUMNAS = [
  ['codigo', 'Obligatorio. Único por producto (ej. MN-001). Si ya existe, el producto se actualiza.'],
  ['nombre', 'Obligatorio.'],
  ['categoria', 'Si no existe, se crea.'],
  ['precio_docena_usd', 'Obligatorio. Precio por docena en dólares (ej. 120 o 150,50).'],
  ['color', 'Opcional. Un solo color por producto (ej. Negro). El stock es del producto, no del color.'],
]

// filas: por defecto, los ejemplos genéricos.
export async function crearPlantilla(filas = EJEMPLOS) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Productos')
  ws.columns = [
    { header: 'codigo', key: 'codigo', width: 12 },
    { header: 'nombre', key: 'nombre', width: 38 },
    { header: 'categoria', key: 'categoria', width: 20 },
    { header: 'precio_docena_usd', key: 'precio', width: 20 },
    { header: 'color', key: 'color', width: 20 },
  ]
  ws.getRow(1).font = { bold: true }
  filas.forEach((f) => ws.addRow(f))
  const ayuda = wb.addWorksheet('Cómo llenarla')
  ayuda.columns = [{ header: 'Columna', width: 20 }, { header: 'Qué va', width: 80 }]
  ayuda.getRow(1).font = { bold: true }
  AYUDA_COLUMNAS.forEach((f) => ayuda.addRow(f))
  ayuda.addRow([])
  ayuda.addRow(['', 'Reemplazá las filas de ejemplo de la hoja "Productos" por tus productos (una fila por producto) y subí el archivo.'])
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// Devuelve filas crudas [{ fila, codigo, nombre, categoria, precio, color }]. entrada: ArrayBuffer/Uint8Array.
export async function leerExcel(entrada) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(entrada)
  const ws = wb.worksheets[0]
  if (!ws) throw new Error('El archivo no tiene hojas.')
  const indice = {}
  ws.getRow(1).eachCell((celda, col) => {
    const t = norm(textoCelda(celda.value))
    for (const [campo, alias] of Object.entries(ALIAS)) if (alias.includes(t) && !(campo in indice)) indice[campo] = col
  })
  const faltan = ['codigo', 'nombre', 'precio'].filter((c) => !(c in indice))
  if (faltan.length) throw new Error(`Faltan columnas en la primera fila: ${faltan.join(', ')}. Descargá la plantilla para ver el formato.`)
  const filas = []
  ws.eachRow((row, n) => {
    if (n === 1) return
    const leer = (c) => (indice[c] ? textoCelda(row.getCell(indice[c]).value).trim() : '')
    const f = { fila: n, codigo: leer('codigo'), nombre: leer('nombre'), categoria: leer('categoria'), precio: leer('precio'), color: leer('color') }
    if (Object.values(f).slice(1).some(Boolean)) filas.push(f)
  })
  return filas
}

function parsearPrecio(texto) {
  const t = String(texto).replace(/[^\d.,-]/g, '')
  if (!t) return { error: 'Falta el precio.' }
  // "1.234,50" y "1,234.50": el último separador es el decimal.
  const ultimo = Math.max(t.lastIndexOf(','), t.lastIndexOf('.'))
  const limpio = ultimo === -1 ? t : t.slice(0, ultimo).replace(/[.,]/g, '') + '.' + t.slice(ultimo + 1)
  const n = Number(limpio)
  if (!Number.isFinite(n) || n < 0) return { error: `Precio inválido: “${texto}”.` }
  return { cent: aCentavos(n) }
}


// existentes: Map codigo → producto. Devuelve un plan por fila: crear | actualizar | error.
export function planificar(filas, existentes) {
  const vistos = new Map()
  return filas.map((f) => {
    const errores = []
    const codigo = f.codigo.trim().toUpperCase()
    if (!codigo) errores.push('Falta el código.')
    else if (!partirCodigo(codigo).letras && !partirCodigo(codigo).digitos) errores.push('El código no es válido.')
    if (!f.nombre.trim()) errores.push('Falta el nombre.')
    const precio = parsearPrecio(f.precio)
    if (precio.error) errores.push(precio.error)
    if (codigo) {
      if (vistos.has(codigo)) errores.push(`Código repetido en el archivo (también en la fila ${vistos.get(codigo)}).`)
      else vistos.set(codigo, f.fila)
    }
    const color = String(f.color ?? '').trim()
    if (/[,;]/.test(color)) errores.push('Un solo color por producto (sin comas).')
    const datos = { codigo, nombre: f.nombre.trim(), categoria: f.categoria.trim().toUpperCase() || 'VARIOS', precio_docena_usd_cent: precio.cent, color }
    const existe = existentes.get(codigo)
    return { fila: f.fila, accion: errores.length ? 'error' : existe ? 'actualizar' : 'crear', errores, datos }
  })
}

// Ejecuta el plan fila por fila: un error en una fila no frena a las demás.
export async function ejecutar(plan) {
  const out = { creados: 0, actualizados: 0, errores: [] }
  for (const item of plan.filter((p) => p.accion !== 'error')) {
    const d = item.datos
    try {
      const cat = await categorias.crear(d.categoria)
      if (item.accion === 'crear') {
        await productos.crear({
          codigo: d.codigo,
          nombre: d.nombre,
          categoria_id: cat.id,
          precio_docena_usd_cent: d.precio_docena_usd_cent,
          colores: d.color ? [{ nombre: d.color, hex: hexDeNombre(d.color) }] : [],
        })
        out.creados++
      } else {
        const actual = await productos.obtenerPorCodigo(d.codigo)
        // Color vacío = se deja el que tenía. Si cambia, se conserva su id (las notas viejas guardan su propia copia).
        const previo = actual.colores[0]
        const colores = !d.color
          ? actual.colores.slice(0, 1).map((c) => ({ id: c.id, nombre: c.nombre, hex: c.hex }))
          : [{ id: previo?.id, nombre: d.color, hex: previo && norm(previo.nombre) === norm(d.color) ? previo.hex : hexDeNombre(d.color) }]
        await productos.actualizar(actual.id, {
          ...actual,
          nombre: d.nombre,
          categoria_id: cat.id,
          precio_docena_usd_cent: d.precio_docena_usd_cent,
          fotos: actual.fotos.map((f) => ({ ruta: f.ruta, blob: f.blob })),
          colores,
        })
        out.actualizados++
      }
    } catch (e) {
      out.errores.push({ fila: item.fila, mensaje: e.message })
    }
  }
  return out
}

// Fotos sueltas: "MN-005_1.jpg", "MN-005_2.jpg" o "mn5.png" se asocian por el código del nombre de archivo.
export function agruparFotos(archivos, listaProductos) {
  const grupos = new Map()
  const sinMatch = []
  for (const a of archivos) {
    const base = a.name.replace(/\.[^.]+$/, '')
    const [prefijo, orden = '0'] = base.split(/_(?=\d+$)/)
    const prod = listaProductos.find((p) => puntajeCodigo(prefijo, p.codigo) === 0)
    if (!prod) {
      sinMatch.push(a.name)
      continue
    }
    if (!grupos.has(prod.id)) grupos.set(prod.id, { producto: prod, archivos: [] })
    grupos.get(prod.id).archivos.push({ archivo: a, orden: Number(orden) || 0 })
  }
  for (const g of grupos.values()) g.archivos.sort((x, y) => x.orden - y.orden || x.archivo.name.localeCompare(y.archivo.name))
  return { grupos: [...grupos.values()], sinMatch }
}
