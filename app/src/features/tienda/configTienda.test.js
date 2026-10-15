import { describe, expect, it } from 'vitest'
import { datosAConfirmar, DIAS_ALIAS_VIGENTE, diasDesde, formatearCuit, MAX_CONTACTOS, PASOS_POR_DEFECTO, urlMapaSegura, validarComoComprar, validarContactos, validarHorarios, validarLocales, validarTransferencia } from './lib/configTienda.js'

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

describe('transferencia con CBU y CUIT', () => {
  const COMPLETA = { titular: 'Titular de Prueba', cuit: '20-12345678-6', cbu: '0140000000000000000001', alias: 'alias.prueba', cuenta: '0000000000001' }

  it('acepta los datos completos y normaliza CUIT y CBU a dígitos', () => {
    const r = validarTransferencia({ ...COMPLETA, cbu: '0140000 0000000 0000 0001', actualizado_en: '2026-10-15T12:00:00Z' })
    expect(r.errores).toEqual([])
    expect(r.valor).toMatchObject({ titular: 'Titular de Prueba', cuit: '20123456786', cbu: '0140000000000000000001', alias: 'alias.prueba', cuenta: '0000000000001' })
    expect(r.valor.actualizado_en).toBe('2026-10-15T12:00:00.000Z')
    expect(formatearCuit(r.valor.cuit)).toBe('20-12345678-6')
  })

  it('un CBU o CUIT con la cantidad de números equivocada es un error y no se conserva', () => {
    const r = validarTransferencia({ ...COMPLETA, cbu: '12345', cuit: '2028' })
    expect(r.errores).toEqual(['El CBU tiene 22 números.', 'El CUIT o CUIL tiene 11 números.'])
    expect(r.valor.cbu).toBe('')
    expect(r.valor.cuit).toBe('')
  })

  it('alcanza con CBU, cuenta o alias', () => {
    expect(validarTransferencia({ titular: 'X', cbu: '0140000000000000000001' }).errores).toEqual([])
    expect(validarTransferencia({ titular: 'X' }).errores).toHaveLength(1)
  })

  it('una fecha inválida se descarta y una fecha sola no cuenta como dato', () => {
    expect(validarTransferencia({ alias: 'a.b', actualizado_en: 'mañana' }).valor.actualizado_en).toBe('')
    expect(validarTransferencia({ actualizado_en: '2026-10-15T00:00:00Z' }).valor).toBeNull()
  })
})

describe('cuenta que se cambia cada 2 meses', () => {
  const hoy = Date.parse('2026-10-15T12:00:00Z')
  const hace = (d) => new Date(hoy - d * 86400000).toISOString()

  it('vigente hasta 60 días; después, o sin fecha, queda "a confirmar"', () => {
    expect(DIAS_ALIAS_VIGENTE).toBe(60)
    expect(datosAConfirmar(hace(0), hoy)).toBe(false)
    expect(datosAConfirmar(hace(60), hoy)).toBe(false)
    expect(datosAConfirmar(hace(61), hoy)).toBe(true)
    expect(datosAConfirmar('', hoy)).toBe(true)
    expect(datosAConfirmar(undefined, hoy)).toBe(true)
    expect(datosAConfirmar('no es fecha', hoy)).toBe(true)
  })

  it('diasDesde tolera entradas raras y nunca da negativo', () => {
    expect(diasDesde(hace(10), hoy)).toBe(10)
    expect(diasDesde(new Date(hoy + 5 * 86400000).toISOString(), hoy)).toBe(0)
    expect(diasDesde(null, hoy)).toBeNull()
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
  it('conserva el horario propio de cada local', () => {
    const r = validarLocales([
      { nombre: 'Local 27 de Mayo', direccion: 'Esquina Colorados', horario: '6:00 a 12:00 y 14:00 a 16:00' },
      { nombre: 'Local Chalanitas', direccion: 'Calle 23 de Marzo', horario: 'x'.repeat(500) },
    ])
    expect(r.errores).toEqual([])
    expect(r.valor[0].horario).toBe('6:00 a 12:00 y 14:00 a 16:00')
    expect(r.valor[1].horario).toHaveLength(160)
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
