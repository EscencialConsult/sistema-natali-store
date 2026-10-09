// Lógica de la carga masiva (sin pantallas, para poder probarla): leer Excel → planificar → ejecutar.
import { categorias, productos } from '../../../data/repos/index.js'
import { partirCodigo, puntajeCodigo } from '../../../lib/codigo.js'
import { hexDeNombre } from '../../../lib/colores.js'
import { aCentavos } from '../../../lib/moneda.js'

export const COLUMNAS = ['codigo', 'nombre', 'categoria', 'precio_docena_usd', 'colores']

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const ALIAS = {
  codigo: ['codigo', 'cod', 'code'],
  nombre: ['nombre', 'producto', 'descripcion corta'],
  categoria: ['categoria', 'rubro'],
  precio: ['precio_docena_usd', 'precio docena usd', 'precio docena', 'precio', 'usd'],
  colores: ['colores', 'color'],
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

export async function crearPlantilla(ejemplos = []) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Productos')
  ws.columns = [
    { header: 'codigo', key: 'codigo', width: 12 },
    { header: 'nombre', key: 'nombre', width: 38 },
    { header: 'categoria', key: 'categoria', width: 20 },
    { header: 'precio_docena_usd', key: 'precio', width: 20 },
    { header: 'colores', key: 'colores', width: 50 },
  ]
  ws.getRow(1).font = { bold: true }
  const filas = ejemplos.length
    ? ejemplos
    : [{ codigo: 'MN-001', nombre: 'Blusa de ejemplo', categoria: 'BLUSAS Y CAMISAS', precio: 120, colores: 'Negro, Blanco, Rojo' }]
  filas.forEach((f) => ws.addRow(f))
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// Devuelve filas crudas [{ fila, codigo, nombre, categoria, precio, colores }]. entrada: ArrayBuffer/Uint8Array.
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
    const f = { fila: n, codigo: leer('codigo'), nombre: leer('nombre'), categoria: leer('categoria'), precio: leer('precio'), colores: leer('colores') }
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

const listaColores = (texto) => {
  const vistos = new Set()
  return String(texto)
    .split(/[,;]/)
    .map((c) => c.trim())
    .filter((c) => c && !vistos.has(norm(c)) && vistos.add(norm(c)))
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
    const datos = { codigo, nombre: f.nombre.trim(), categoria: f.categoria.trim().toUpperCase() || 'VARIOS', precio_docena_usd_cent: precio.cent, colores: listaColores(f.colores) }
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
          colores: d.colores.map((nombre) => ({ nombre, hex: hexDeNombre(nombre) })),
        })
        out.creados++
      } else {
        const actual = await productos.obtenerPorCodigo(d.codigo)
        const conocidos = new Set(actual.colores.map((c) => norm(c.nombre)))
        // Los colores existentes se conservan (el stock y las ventas apuntan a ellos); solo se agregan los nuevos.
        const colores = [
          ...actual.colores.map((c) => ({ id: c.id, nombre: c.nombre, hex: c.hex })),
          ...d.colores.filter((n) => !conocidos.has(norm(n))).map((nombre) => ({ nombre, hex: hexDeNombre(nombre) })),
        ]
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
