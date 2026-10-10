import { describe, expect, it } from 'vitest'
import { PERMISOS, puedeAlguna } from '../lib/permisos.js'
import { PANTALLAS, repartirBarra } from './navegacion.js'

describe('barra del celular', () => {
  it.each(Object.keys(PERMISOS))('%s: entra en la barra, no pierde pantallas y siempre puede cerrar sesión ("Más")', (rol) => {
    const visibles = PANTALLAS.filter((p) => puedeAlguna(rol, p.accion))
    const { enBarra, enMas } = repartirBarra(visibles)
    // 4 pantallas como máximo + el botón "Más" (que siempre se muestra: tiene "Cerrar sesión").
    expect(enBarra.length).toBeLessThanOrEqual(4)
    expect([...enBarra, ...enMas]).toEqual(visibles)
  })
})
