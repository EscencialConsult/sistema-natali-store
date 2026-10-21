import { describe, expect, it } from 'vitest'
import { clasificar } from './errores.js'

describe('clasificar el error de un envío', () => {
  it('token vencido o sin sesión = sesion (la venta está bien)', () => {
    expect(clasificar(new Error('registrar_venta: JWT expired'))).toBe('sesion')
    expect(clasificar(Object.assign(new Error('x'), { code: 'PGRST303' }))).toBe('sesion')
    expect(clasificar(Object.assign(new Error('No autenticado'), { code: '28000' }))).toBe('sesion')
    expect(clasificar(new Error('Invalid Refresh Token: Already Used'))).toBe('sesion')
  })
  it('sin comunicación = red', () => {
    expect(clasificar(new Error('registrar_venta: TypeError: Failed to fetch'))).toBe('red')
    expect(clasificar(new Error('descargar ventas: NetworkError when attempting to fetch resource'))).toBe('red')
    expect(clasificar({ name: 'AuthRetryableFetchError', message: 'x' })).toBe('red')
    expect(clasificar(new Error('registrar_venta: 503 Service Unavailable'))).toBe('red')
  })
  it('lo que el servidor miró y rechazó = rechazo (hay que revisar la nota)', () => {
    expect(clasificar(new Error('registrar_venta: El total (100) no coincide con la suma de los productos (90)'))).toBe('rechazo')
    expect(clasificar(Object.assign(new Error('Tu rol no puede registrar ventas'), { code: '42501' }))).toBe('rechazo')
    expect(clasificar(new Error('sin servidor'))).toBe('rechazo')
    expect(clasificar(null)).toBe('rechazo')
  })
})
