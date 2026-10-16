import { describe, expect, it } from 'vitest'
import { CAMPOS_TEXTOS, PAGINAS_TEXTOS, textosDe, validarTextos } from '../lib/textos.js'
import { PASOS_POR_DEFECTO, QUIENES_SOMOS_POR_DEFECTO } from '../lib/configTienda.js'

describe('catálogo de textos', () => {
  it('cada campo tiene clave única, etiqueta y texto por defecto', () => {
    const claves = CAMPOS_TEXTOS.map((c) => c.clave)
    expect(new Set(claves).size).toBe(claves.length)
    for (const c of CAMPOS_TEXTOS) {
      expect(c.etiqueta, c.clave).toBeTruthy()
      expect(c.defecto, c.clave).toBeDefined()
    }
    expect(PAGINAS_TEXTOS.map((p) => p.titulo)).toEqual(['Inicio', 'Catálogo', 'Quiénes somos', 'Contacto', 'Ayuda', 'Tu pedido', 'Pie de página'])
  })
})

describe('validarTextos', () => {
  it('descarta claves desconocidas y vacíos; recorta y limpia lo demás', () => {
    const r = validarTextos({ 'inicio.titulo': '  Temporada   nueva ', 'inicio.bajada': '', otra: 'x', 'pedido.pasos': 'uno\n\n dos ' })
    expect(r.valor).toEqual({ 'inicio.titulo': 'Temporada nueva', 'pedido.pasos': ['uno', 'dos'] })
    expect(r.errores).toEqual([])
  })
  it('items y preguntas: solo con contenido, tema válido', () => {
    const r = validarTextos({
      'quienes.ofrecemos': [{ titulo: 'A', texto: 'a' }, { titulo: '', texto: '' }],
      'ayuda.preguntas': [{ tema: 'inventado', p: '¿?', r: 'Sí.' }, { tema: 'pagos', p: '', r: 'x' }],
    })
    expect(r.valor['quienes.ofrecemos']).toEqual([{ titulo: 'A', texto: 'a' }])
    expect(r.valor['ayuda.preguntas']).toEqual([{ tema: 'comprar', p: '¿?', r: 'Sí.' }])
  })
  it('no revienta con basura', () => {
    expect(validarTextos(null).valor).toEqual({})
    expect(validarTextos([1, 2]).valor).toEqual({})
    expect(validarTextos({ 'quienes.trabajamos': 'texto suelto' }).valor).toEqual({})
  })
})

describe('textosDe', () => {
  it('sin configuración devuelve los textos por defecto, también los de las claves propias', () => {
    const t = textosDe(undefined)
    expect(t('inicio.titulo')).toBe('Nueva temporada')
    expect(t('como_comprar')).toEqual(PASOS_POR_DEFECTO)
    expect(t('quienes_somos')).toEqual(QUIENES_SOMOS_POR_DEFECTO)
    expect(t('quienes.trabajamos')).toHaveLength(4)
    expect(t('clave.inexistente')).toBe('')
  })
  it('lo guardado pisa el texto por defecto, campo por campo', () => {
    const t = textosDe({ textos: { 'inicio.titulo': 'Liquidación' }, como_comprar: ['Paso único'] })
    expect(t('inicio.titulo')).toBe('Liquidación')
    expect(t('inicio.boton')).toBe('Ver catálogo')
    expect(t('como_comprar')).toEqual(['Paso único'])
  })
})
