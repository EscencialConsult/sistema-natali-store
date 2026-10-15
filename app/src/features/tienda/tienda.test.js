import { beforeEach, describe, expect, it, vi } from 'vitest'

// El cliente público se reemplaza por uno falso que registra las llamadas del constructor de consultas.
const llamadas = []
let filasDevueltas = []
vi.mock('./data/clientePublico.js', () => ({
  supabaseUrl: 'https://proyecto.supabase.co',
  hayBackendPublico: true,
  clientePublico: async () => ({
    from: (tabla) => {
      const q = {
        select: (c) => {
          llamadas.push(['from', tabla], ['select', c])
          return q
        },
        order: (c) => {
          llamadas.push(['order', c])
          return q
        },
        limit: (n) => {
          llamadas.push(['limit', n])
          return q
        },
        or: (f) => {
          llamadas.push(['or', f])
          return q
        },
        eq: (c, v) => {
          llamadas.push(['eq', c, v])
          return q
        },
        then: (res) => res({ data: filasDevueltas, error: null }),
      }
      return q
    },
  }),
}))

const { esRutaTienda, rutaProducto } = await import('./rutas.js')
const { precioPublico } = await import('./lib/precioPublico.js')
const { urlDeFoto, fotosDe } = await import('./lib/fotos.js')
const { limpiarTexto, filtroKeyset, filtroTexto, TAMANO_PAGINA } = await import('./lib/consulta.js')
const { guardarCache, leerCache } = await import('./lib/cache.js')
const { enlaceWhatsApp } = await import('./contexto.js')
const { pedirPagina } = await import('./data/catalogo.js')

describe('rutas', () => {
  it('solo /tienda y sus subrutas son de la tienda', () => {
    expect(esRutaTienda('/tienda')).toBe(true)
    expect(esRutaTienda('/tienda/p/abc')).toBe(true)
    for (const r of ['/', '/c', '/tiendas', '/tienda-vieja', '/ventas', '/catalogo/admin']) expect(esRutaTienda(r), r).toBe(false)
    expect(rutaProducto('x')).toBe('/tienda/p/x')
  })
})

describe('precioPublico', () => {
  const aj = { tipo_cambio_bs: 12, tipo_cambio_ars: 1590, tipo_cambio_es_ejemplo: false }
  const por = (r, m) => r.monedas.find((x) => x.moneda === m)

  it('convierte docena y media docena en USD, ARS y Bs', () => {
    const r = precioPublico({ precioUsdCent: 12000, ajustes: aj })
    expect(r.oculto).toBe(false)
    expect(r.monedas.map((m) => m.moneda)).toEqual(['usd', 'ars', 'bs'])
    expect(por(r, 'usd')).toMatchObject({ docena: 12000, media: 6000 })
    expect(por(r, 'bs')).toMatchObject({ docena: 144000, media: 72000 })
    expect(por(r, 'ars')).toMatchObject({ docena: 19080000, media: 9540000 })
  })

  it('respeta el orden de redondeo del sistema de nota: primero la docena, después la media', () => {
    const r = precioPublico({ precioUsdCent: 101, ajustes: { tipo_cambio_bs: 1.5, tipo_cambio_ars: 1, tipo_cambio_es_ejemplo: false } })
    // 101 × 1,5 = 151,5 → 152 la docena; la media es 76 (convertir primero la media daría 77).
    expect(por(r, 'bs')).toMatchObject({ docena: 152, media: 76 })
  })

  it('precio oculto, nulo o inválido es "a consultar", nunca cero', () => {
    for (const p of [null, undefined, -5, 12.5, '120']) {
      const r = precioPublico({ precioUsdCent: p, ajustes: aj })
      expect(r.oculto, String(p)).toBe(true)
      expect(r.monedas).toEqual([])
    }
  })

  it('tasa inválida deja afuera esa moneda en vez de multiplicar por cero', () => {
    const r = precioPublico({ precioUsdCent: 12000, ajustes: { tipo_cambio_bs: 0, tipo_cambio_ars: null, tipo_cambio_es_ejemplo: false } })
    expect(r.monedas.map((m) => m.moneda)).toEqual(['usd'])
    expect(precioPublico({ precioUsdCent: 12000, ajustes: { tipo_cambio_bs: 'mucho', tipo_cambio_ars: NaN } }).monedas).toHaveLength(1)
  })

  it('con tasa de ejemplo muestra solo USD', () => {
    const r = precioPublico({ precioUsdCent: 12000, ajustes: { ...aj, tipo_cambio_es_ejemplo: true } })
    expect(r.monedas.map((m) => m.moneda)).toEqual(['usd'])
  })

  it('sin ajustes cargados muestra solo USD', () => {
    expect(precioPublico({ precioUsdCent: 12000 }).monedas.map((m) => m.moneda)).toEqual(['usd'])
  })

  it('una tasa que llega como texto numérico se acepta', () => {
    expect(precioPublico({ precioUsdCent: 1000, ajustes: { tipo_cambio_bs: '6.96', tipo_cambio_ars: '1400' } }).monedas).toHaveLength(3)
  })
})

describe('fotos', () => {
  const base = 'https://proyecto.supabase.co/'
  it('acepta https absolutas y arma las relativas contra el bucket público', () => {
    expect(urlDeFoto('https://x.test/a.jpg', base)).toBe('https://x.test/a.jpg')
    expect(urlDeFoto('F0032/abc.jpg', base)).toBe('https://proyecto.supabase.co/storage/v1/object/public/naty_productos/F0032/abc.jpg')
    expect(urlDeFoto('/F 1/ñ.jpg', base)).toBe('https://proyecto.supabase.co/storage/v1/object/public/naty_productos/F%201/%C3%B1.jpg')
  })
  it('rechaza otros protocolos, vacíos y relativas sin base', () => {
    for (const r of ['javascript:alert(1)', 'data:image/png;base64,AAA', 'http://x.test/a.jpg', '//x.test/a.jpg', '', '   ', null]) {
      expect(urlDeFoto(r, base), String(r)).toBeNull()
    }
    expect(urlDeFoto('a.jpg', '')).toBeNull()
  })
  it('fotosDe tolera fotos nulas o mal formadas', () => {
    expect(fotosDe({ fotos: null }, base)).toEqual([])
    expect(fotosDe({ fotos: ['a.jpg', 'javascript:x', ''] }, base)).toHaveLength(1)
  })
})

describe('consulta', () => {
  it('limpia el texto de lo que rompería un filtro', () => {
    expect(limpiarTexto('  blusa,(rib)*%"x\\_y  ')).toBe('blusa rib x y')
    expect(limpiarTexto('a'.repeat(200))).toHaveLength(60)
    expect(limpiarTexto(null)).toBe('')
  })
  it('arma el filtro por clave y el de texto', () => {
    expect(filtroKeyset(null)).toBeNull()
    expect(filtroKeyset({ codigo: 'F0032', id: 'u1' })).toBe('codigo.gt."F0032",and(codigo.eq."F0032",id.gt.u1)')
    expect(filtroKeyset({ codigo: 'a",b', id: 'u1' })).not.toMatch(/a",b/)
    expect(filtroTexto('')).toBeNull()
    expect(filtroTexto('rib')).toBe('codigo.ilike.*rib*,nombre.ilike.*rib*')
  })
})

describe('pedirPagina', () => {
  beforeEach(() => {
    llamadas.length = 0
  })
  it('pide una fila de más para saber si hay otra página y la descarta', async () => {
    filasDevueltas = Array.from({ length: TAMANO_PAGINA + 1 }, (_, i) => ({ id: `i${i}`, codigo: `C${i}` }))
    const r = await pedirPagina({})
    expect(r.items).toHaveLength(TAMANO_PAGINA)
    expect(r.hayMas).toBe(true)
    expect(llamadas).toContainEqual(['limit', TAMANO_PAGINA + 1])
    expect(llamadas).toContainEqual(['order', 'codigo'])
    expect(llamadas).toContainEqual(['from', 'tienda_catalogo_publico'])
  })
  it('última página: hayMas en falso, y aplica clave, texto y categoría', async () => {
    filasDevueltas = [{ id: 'z', codigo: 'Z1' }]
    const r = await pedirPagina({ despues: { codigo: 'F1', id: 'u1' }, texto: 'rib', categoriaId: 'cat1' })
    expect(r.hayMas).toBe(false)
    expect(llamadas).toContainEqual(['or', 'codigo.gt."F1",and(codigo.eq."F1",id.gt.u1)'])
    expect(llamadas).toContainEqual(['or', 'codigo.ilike.*rib*,nombre.ilike.*rib*'])
    expect(llamadas).toContainEqual(['eq', 'categoria_id', 'cat1'])
  })
})

describe('caché propia', () => {
  beforeEach(() => {
    const almacen = new Map()
    globalThis.localStorage = {
      getItem: (k) => almacen.get(k) ?? null,
      setItem: (k, v) => almacen.set(k, v),
    }
  })
  it('guarda y lee con versión y origen', () => {
    guardarCache('ajustes', { a: 1 }, 'https://p.supabase.co')
    expect(leerCache('ajustes', 'https://p.supabase.co').datos).toEqual({ a: 1 })
    expect(leerCache('ajustes', 'https://otro.supabase.co')).toBeNull()
  })
  it('tolera almacenamiento roto o bloqueado', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('lleno') } }
    expect(() => guardarCache('x', 1)).not.toThrow()
    expect(leerCache('x')).toBeNull()
    globalThis.localStorage = { getItem: () => '{no json', setItem: () => {} }
    expect(leerCache('x')).toBeNull()
  })
})

describe('enlaceWhatsApp', () => {
  it('fija el host, deja solo dígitos y codifica el mensaje', () => {
    expect(enlaceWhatsApp('+591 7000-0000', 'Hola & chau')).toBe('https://wa.me/59170000000?text=Hola%20%26%20chau')
    expect(enlaceWhatsApp('591700')).toBeNull()
    expect(enlaceWhatsApp('')).toBeNull()
    expect(enlaceWhatsApp(null)).toBeNull()
  })
})
