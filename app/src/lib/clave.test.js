import { describe, expect, it } from 'vitest'
import { emailDeUsuario, normalizarCi, normalizarUsuario, resolverClave, resolverRestablecer, validarCi, validarClave, validarUsuario } from './clave.js'

describe('usuario para ingresar', () => {
  it('ignora mayúsculas, espacios y acentos', () => {
    expect(normalizarUsuario(' NatyAdmin ')).toBe('natyadmin')
    expect(normalizarUsuario('María')).toBe('maria')
  })
  it('arma el mismo correo interno que el servidor', () => {
    expect(emailDeUsuario('NatyAdmin')).toBe('natyadmin@usuarios.modasnaty.internal')
  })
  it('valida usuario y contraseña', () => {
    expect(validarUsuario('ariel')).toBeNull()
    expect(validarUsuario('a b')).toMatch(/entre 3 y 30/)
    expect(validarClave('12345')).toMatch(/al menos 6/)
    expect(validarClave('Moda$2026Naty')).toBeNull()
  })
})

describe('[CLAVE-CI] la contraseña de cada persona es su CI', () => {
  it('queda solo el número: sin puntos, espacios, letras ni complemento', () => {
    expect(normalizarCi('1234567')).toBe('1234567')
    expect(normalizarCi('1.234.567')).toBe('1234567')
    expect(normalizarCi(' 1234567 ')).toBe('1234567')
    expect(normalizarCi('1234567-1A')).toBe('1234567')
    expect(normalizarCi('1234567 1a')).toBe('1234567')
    expect(normalizarCi('CI: 1.234.567 LP')).toBe('1234567')
  })
  it('no pierde los ceros del principio y es idempotente', () => {
    expect(normalizarCi('0012345')).toBe('0012345')
    expect(normalizarCi(normalizarCi('1.234.567-1A'))).toBe('1234567')
  })
  it('sin números queda vacío', () => {
    expect(normalizarCi('')).toBe('')
    expect(normalizarCi(undefined)).toBe('')
    expect(normalizarCi('sin dato')).toBe('')
  })
  it('valida el largo: entre 6 y 12 números', () => {
    expect(validarCi('1234567')).toBeNull()
    expect(validarCi('1.234.567-1A')).toBeNull()
    expect(validarCi('123456')).toBeNull()
    expect(validarCi('123456789012')).toBeNull()
    expect(validarCi('')).toMatch(/entre 6 y 12 números/)
    expect(validarCi('12')).toMatch(/entre 6 y 12 números/)
    expect(validarCi('12345')).toMatch(/entre 6 y 12 números/)
    expect(validarCi('1234567890123')).toMatch(/entre 6 y 12 números/)
  })
  it('con CI, la contraseña es el número y el CI se guarda', () => {
    expect(resolverClave({ modo: 'ci', ci: '1.234.567' })).toEqual({ clave: '1234567', ci: '1234567' })
    expect(resolverClave({ modo: 'ci', ci: '12' })).toEqual({ error: expect.stringMatching(/entre 6 y 12/) })
  })
  it('con otra contraseña no hay CI que guardar y se exigen las dos iguales', () => {
    expect(resolverClave({ modo: 'otra', clave: 'Moda$2026Naty', repetir: 'Moda$2026Naty' })).toEqual({ clave: 'Moda$2026Naty', ci: null })
    expect(resolverClave({ modo: 'otra', clave: 'Moda$2026Naty', repetir: 'otra' })).toEqual({ error: 'Las contraseñas no coinciden.' })
    expect(resolverClave({ modo: 'otra', clave: '12345', repetir: '12345' })).toEqual({ error: expect.stringMatching(/al menos 6/) })
  })
  it('restablecer con el CI ya guardado cambia la contraseña y no vuelve a guardar nada', () => {
    expect(resolverRestablecer({ modo: 'ci', usarGuardado: true, ciGuardado: '7654321' })).toEqual({ clave: '7654321', ci: null })
  })
  it('restablecer con un CI escrito, o sin CI guardado, usa lo escrito y lo guarda', () => {
    expect(resolverRestablecer({ modo: 'ci', usarGuardado: false, ciGuardado: '7654321', ci: '1.234.567' })).toEqual({ clave: '1234567', ci: '1234567' })
    expect(resolverRestablecer({ modo: 'ci', usarGuardado: true, ciGuardado: null, ci: '1234567' })).toEqual({ clave: '1234567', ci: '1234567' })
    expect(resolverRestablecer({ modo: 'ci', ci: '' })).toEqual({ error: expect.stringMatching(/entre 6 y 12/) })
  })
  it('restablecer con otra contraseña ignora el CI guardado', () => {
    expect(resolverRestablecer({ modo: 'otra', usarGuardado: true, ciGuardado: '7654321', clave: 'Moda$2026Naty', repetir: 'Moda$2026Naty' }))
      .toEqual({ clave: 'Moda$2026Naty', ci: null })
  })
})
