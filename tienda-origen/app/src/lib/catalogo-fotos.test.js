// Catálogo con una sola lectura (categorías estables) y miniaturas por convención de ruta.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { categoriasConProductos, filtrarCatalogo } from './catalogo.js'
import { ANCHO_MINI, urlMiniatura, urlsFoto } from './fotos.js'

const prod = (codigo, categoria_id, extra = {}) => ({ id: codigo, codigo, nombre: `Modelo ${codigo}`, categoria_id, activo: true, publicado_tienda: true, precio_unidad_bs_cent: 1000, nuevo: false, ...extra })

describe('catálogo: una lectura, categorías estables', () => {
  const base = [prod('A', 'blusas'), prod('B', 'faldas'), prod('C', 'blusas', { publicado_tienda: false })]
  const cats = [{ id: 'blusas' }, { id: 'faldas' }, { id: 'vacia' }]
  it('filtrar por categoría o buscar sin coincidencias no hace desaparecer las otras categorías', () => {
    expect(filtrarCatalogo(base, { categoria_id: 'blusas', texto: 'nada-que-coincida' })).toEqual([])
    expect(categoriasConProductos(cats, base).map((c) => c.id)).toEqual(['blusas', 'faldas'])
  })
  it('solo muestra lo publicado con precio y ordena', () => {
    expect(filtrarCatalogo(base).map((p) => p.codigo)).toEqual(['A', 'B'])
    expect(filtrarCatalogo([prod('X', 'b', { precio_unidad_bs_cent: 50 }), prod('Y', 'b', { precio_unidad_bs_cent: 10 })], { orden: 'precio_asc' }).map((p) => p.codigo)).toEqual(['Y', 'X'])
  })
})

describe('miniaturas por convención', () => {
  const SB = 'https://abc.supabase.co'
  it('deriva la miniatura de cada tipo de ruta', () => {
    expect(urlMiniatura('MN-001/1.jpg', SB)).toBe('MN-001/1.jpg.mini.webp')
    expect(urlMiniatura(`${SB}/storage/v1/object/public/naty_productos/MN-001/1.jpg`, SB)).toBe(`${SB}/storage/v1/object/public/naty_productos/MN-001/1.jpg.mini.webp`)
    expect(urlMiniatura(`${SB}/storage/v1/object/public/naty_productos/MN-001/1.jpg?v=2#x`, SB)).toBe(`${SB}/storage/v1/object/public/naty_productos/MN-001/1.jpg.mini.webp?v=2#x`)
    expect(urlMiniatura('/seed/imagenes/blazer-cropped.jpg', SB)).toBe('/seed/imagenes/mini/blazer-cropped.webp')
  })
  it('no inventa miniaturas para otros orígenes, otros buckets, blobs ni data URL', () => {
    expect(urlMiniatura('https://cdn.otro.com/a.jpg', SB)).toBeNull()
    expect(urlMiniatura(`${SB}/storage/v1/object/public/otro_bucket/a.jpg`, SB)).toBeNull()
    expect(urlMiniatura('blob:http://x/1', SB)).toBeNull()
    expect(urlMiniatura('data:image/png;base64,AA', SB)).toBeNull()
    expect(urlsFoto({ ruta: '', blob: new Blob(['x']) }).srcSet).toBeNull()
  })
  it('cada foto de la demo tiene su miniatura en el manifiesto, el archivo existe y el ancho coincide con el srcSet', () => {
    const dir = fileURLToPath(new URL('../../public/seed/imagenes/', import.meta.url))
    const manifiesto = JSON.parse(readFileSync(`${dir}mini/manifiesto.json`, 'utf8'))
    const fotos = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    expect(fotos.length).toBeGreaterThan(0)
    for (const f of fotos) {
      const e = manifiesto[f]
      expect(e, f).toBeDefined()
      if (!e.mini) continue
      expect(existsSync(`${dir}mini/${e.mini}`), e.mini).toBe(true)
      expect(e.ancho, e.mini).toBe(ANCHO_MINI)
    }
  })
})
