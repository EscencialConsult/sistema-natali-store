// Genera las miniaturas de las fotos de la demo (public/seed/imagenes → public/seed/imagenes/mini/*.webp) y su manifiesto.
// Se corre a mano cuando cambian las fotos del seed: `node scripts/generar-miniaturas.mjs`. El resultado se commitea;
// el build NO genera nada (así cada build es igual). sharp está fijado como devDependency.
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

export const ANCHO_MINI = 640
const raiz = fileURLToPath(new URL('../public/seed/imagenes/', import.meta.url))
const destino = join(raiz, 'mini')

await mkdir(destino, { recursive: true })
const archivos = (await readdir(raiz)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
const manifiesto = {}
let antes = 0
let despues = 0
for (const f of archivos) {
  const origen = join(raiz, f)
  const meta = await sharp(origen).metadata()
  antes += (await stat(origen)).size
  if ((meta.width ?? 0) <= ANCHO_MINI) {
    manifiesto[f] = { mini: null, motivo: 'la original ya es chica' }
    continue
  }
  const nombre = `${parse(f).name}.webp`
  const info = await sharp(origen).resize({ width: ANCHO_MINI, withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(destino, nombre))
  despues += info.size
  manifiesto[f] = { mini: nombre, ancho: info.width, alto: info.height, bytes: info.size }
}
await writeFile(join(destino, 'manifiesto.json'), `${JSON.stringify(manifiesto, null, 2)}\n`)
const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(`${archivos.length} fotos · originales ${mb(antes)} MB · miniaturas ${mb(despues)} MB`)
