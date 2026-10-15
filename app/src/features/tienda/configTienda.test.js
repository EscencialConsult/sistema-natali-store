import { describe, expect, it } from 'vitest'
import { MAX_CONTACTOS, PASOS_POR_DEFECTO, urlMapaSegura, validarComoComprar, validarContactos, validarHorarios, validarLocales, validarTransferencia } from './lib/configTienda.js'

describe('urlMapaSegura', () => {
  it('acepta enlaces https de Google Maps', () => {
    for (const u of [
      'https://maps.app.goo.gl/AbC123',
      'https://maps.google.com/?q=-22.7,-64.3',
      'https://www.google.com/maps/place/Modas+Naty/@-22.7,-64.3,17z',
      'https://google.com/maps?q=bermejo',
      'https://goo.gl/maps/xyz',
      'https://www.google.com.bo/maps/place/x',
    ]) {
      expect(urlMapaSegura(u), u).toBeTruthy()
    }
  })

  it('rechaza protocolos, credenciales, puertos, hosts y rutas que no son de mapas', () => {
    for (const u of [
      'javascript:alert(1)',
      'data:text/html,<script>1</script>',
      'http://maps.app.goo.gl/AbC',
      'https://user:pass@maps.google.com/x',
      'https://maps.google.com:8443/x',
      'https://maps.app.goo.gl.malo.com/x',
      'https://evil.com/maps/x',
      'https://www.google.com/search?q=maps',
      'https://www.google.com/mapsx',
      'https://goo.gl/otra-cosa',
      '//maps.google.com/x',
      'maps.google.com/x',
      '',
      '   ',
      null,
      'https://maps.google.com/' + 'a'.repeat(600),
    ]) {
      expect(urlMapaSegura(u), String(u).slice(0, 50)).toBeNull()
    }
  })
})

describe('validarContactos', () => {
  it('normaliza el teléfono a dígitos y descarta filas vacías', () => {
    const r = validarContactos([{ nombre: ' Ariel  Maydana ', telefono: '+591 7000-0000' }, { nombre: '', telefono: '' }])
    expect(r.errores).toEqual([])
    expect(r.valor).toEqual([{ nombre: 'Ariel Maydana', telefono: '59170000000' }])
  })

  it('informa lo que falta o está mal, sin dejar pasar la fila', () => {
    const r = validarContactos([{ nombre: '', telefono: '59170000000' }, { nombre: 'Pamela', telefono: '123' }, { nombre: 'Norma', telefono: 'x'.repeat(5) }])
    expect(r.valor).toEqual([])
    expect(r.errores).toHaveLength(3)
  })

  it('acota la cantidad y tolera basura', () => {
    const muchos = Array.from({ length: 30 }, (_, i) => ({ nombre: `V${i}`, telefono: '59170000000' }))
    const r = validarContactos(muchos)
    expect(r.valor).toHaveLength(MAX_CONTACTOS)
    expect(r.errores.length).toBeGreaterThan(0)
    for (const malo of [null, undefined, 'x', 5, {}, [null, 3, 'a']]) expect(() => validarContactos(malo)).not.toThrow()
  })

  it('el texto con etiquetas se conserva como texto, nunca se interpreta', () => {
    const r = validarContactos([{ nombre: '<img src=x onerror=alert(1)>', telefono: '59170000000' }])
    expect(r.valor[0].nombre).toBe('<img src=x onerror=alert(1)>')
  })
})

describe('validarTransferencia', () => {
  it('pide cuenta o alias si hay algún dato', () => {
    expect(validarTransferencia({ banco: 'BNB', titular: 'Natali' }).errores).toHaveLength(1)
    expect(validarTransferencia({ banco: 'BNB', alias: 'modas.naty' }).errores).toEqual([])
  })
  it('vacío o inválido da null, no un objeto de espacios', () => {
    for (const v of [null, undefined, {}, { banco: '  ' }, 'x', 3]) expect(validarTransferencia(v).valor, String(v)).toBeNull()
  })
  it('recorta largos', () => {
    const r = validarTransferencia({ cuenta: '1'.repeat(200), nota: 'n'.repeat(1000) })
    expect(r.valor.cuenta).toHaveLength(60)
    expect(r.valor.nota).toHaveLength(300)
  })
})

describe('validarLocales', () => {
  it('conserva solo mapas seguros y avisa del resto', () => {
    const ok = validarLocales([{ nombre: 'Centro', direccion: 'Calle 1', indicaciones: 'Pasando la chalana', mapa: 'https://maps.app.goo.gl/x' }])
    expect(ok.errores).toEqual([])
    expect(ok.valor[0].mapa).toBe('https://maps.app.goo.gl/x')

    const mal = validarLocales([{ nombre: 'Centro', mapa: 'javascript:alert(1)' }])
    expect(mal.errores).toHaveLength(1)
    expect(mal.valor[0].mapa).toBe('') // el enlace peligroso nunca se conserva
  })
  it('al LEER tampoco deja pasar un enlace peligroso guardado a mano en la base', () => {
    expect(validarLocales([{ nombre: 'X', mapa: 'https://evil.com/maps/x' }]).valor[0].mapa).toBe('')
  })
  it('un local sin nombre no se acepta', () => {
    const r = validarLocales([{ direccion: 'Calle 2' }])
    expect(r.valor).toEqual([])
    expect(r.errores).toHaveLength(1)
  })
})

describe('textos en líneas', () => {
  it('horarios: una línea por renglón, sin vacías y acotadas', () => {
    expect(validarHorarios('Lunes a sábado: 8 a 18\n\n  Domingo: cerrado  ').valor).toEqual(['Lunes a sábado: 8 a 18', 'Domingo: cerrado'])
    expect(validarHorarios(Array.from({ length: 20 }, (_, i) => `d${i}`).join('\n')).valor).toHaveLength(8)
    expect(validarHorarios(null).valor).toEqual([])
  })
  it('cómo comprar: acepta lista o texto, y si no hay nada se usan los pasos por defecto', () => {
    expect(validarComoComprar(['Uno', 'Dos']).valor).toEqual(['Uno', 'Dos'])
    expect(validarComoComprar('Uno\nDos').valor).toEqual(['Uno', 'Dos'])
    expect(validarComoComprar(undefined).valor).toEqual([])
    expect(PASOS_POR_DEFECTO.length).toBeGreaterThanOrEqual(4)
    expect(PASOS_POR_DEFECTO.join(' ')).toMatch(/media docena/i)
  })
})
