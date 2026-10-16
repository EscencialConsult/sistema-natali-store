// Script único: arma src/data/seed/productos.json desde Docs/biblioteca-provisional.
// Colores y stock son de EJEMPLO (provisional: true) y determinísticos por código.
// Uso: node scripts/generar-seed.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(aqui, '..')
const origen = path.resolve(app, '../Docs/biblioteca-provisional')
const destSeed = path.join(app, 'src/data/seed')
const destImg = path.join(app, 'public/seed/imagenes')

// Tipo de cambio de EJEMPLO (se reemplaza en Ajustes). Bs por 1 USD / ARS por 1 USD.
const TC_EJEMPLO = { bs: 6.96, ars: 1400 }

const COLORES = [
  ['Negro', '#1a1a1a'], ['Blanco', '#f7f7f5'], ['Beige', '#d9c3a5'], ['Camel', '#b98a52'],
  ['Rojo', '#c0262d'], ['Rosa', '#e58ea8'], ['Fucsia', '#c2185b'], ['Celeste', '#8cc4e8'],
  ['Azul marino', '#1f2f5a'], ['Verde oliva', '#6b7140'], ['Lila', '#b79bd1'], ['Mostaza', '#d6a62a'],
]
const CORRECCION_CATEGORIA = {
  'Halter con Cuello': 'CORSETS Y TOPS',
  'Strapless Largo con Cierre Invisible': 'VESTIDOS',
  'Wide Leg Metalizado': 'PANTALONES',
}

// PRNG determinístico (mulberry32) sembrado con el número de código.
const prng = (semilla) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const productos = JSON.parse(fs.readFileSync(path.join(origen, 'productos.json'), 'utf8'))
fs.mkdirSync(destImg, { recursive: true })
fs.mkdirSync(destSeed, { recursive: true })

const categorias = [...new Set(productos.map((p) => CORRECCION_CATEGORIA[p.nombre] ?? p.categoria))].sort((a, b) => a.localeCompare(b, 'es'))

const salida = productos.map((p, i) => {
  const rnd = prng(i + 1)
  const cantidad = 3 + Math.floor(rnd() * 6)
  const elegidos = [...COLORES].sort(() => rnd() - 0.5).slice(0, cantidad)
  const archivo = path.basename(p.imagen)
  fs.copyFileSync(path.join(origen, p.imagen), path.join(destImg, archivo))
  return {
    codigo: p.codigo,
    slug: p.slug,
    nombre: p.nombre,
    categoria: CORRECCION_CATEGORIA[p.nombre] ?? p.categoria,
    descripcion: p.descripcion,
    precio_docena_usd_cent: Math.round((p.precio_bs_docena / TC_EJEMPLO.bs) * 100),
    fotos: [`/seed/imagenes/${archivo}`],
    colores: elegidos.map(([nombre, hex]) => ({
      nombre,
      hex,
      stock_unidades: rnd() < 0.12 ? 0 : 12 * (1 + Math.floor(rnd() * 8)),
    })),
    nuevo: rnd() < 0.18,
    provisional: true,
  }
})

fs.writeFileSync(path.join(destSeed, 'productos.json'), JSON.stringify({ tc_ejemplo: TC_EJEMPLO, categorias, productos: salida }, null, 1))
console.log(`${salida.length} productos, ${categorias.length} categorías`)
