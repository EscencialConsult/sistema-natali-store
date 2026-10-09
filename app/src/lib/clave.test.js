import { describe, expect, it } from 'vitest'
import { emailDeUsuario, normalizarUsuario, validarClave, validarUsuario } from './clave.js'

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
