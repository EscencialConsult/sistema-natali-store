import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { db } from './db.js'
import { cargarSeedSiVacio } from './seed/cargar.js'
import { CLAVE_INICIAL } from './seed/perfiles.js'
import { perfiles } from './repos/index.js'
import { puede, puedeAlguna } from '../lib/permisos.js'
import { PANTALLAS } from '../app/navegacion.js'

beforeAll(async () => {
  await db.delete()
  await db.open()
  await cargarSeedSiVacio()
})

describe('usuarios locales', () => {
  it('el seed trae un superadmin y todos tienen contraseña (sin exponer el hash)', async () => {
    const lista = await perfiles.listar({ soloActivos: false })
    expect(lista.some((p) => p.rol === 'superadmin')).toBe(true)
    expect(lista.every((p) => !('clave_hash' in p) && !('clave_sal' in p))).toBe(true)
    expect((await db.perfiles.toArray()).every((p) => p.clave_hash && p.clave_sal)).toBe(true)
  })

  it('ingresa con CI y contraseña; rechaza la incorrecta con un mensaje genérico', async () => {
    const p = await perfiles.verificarCredenciales(' 1000000 ', CLAVE_INICIAL)
    expect(p.rol).toBe('superadmin')
    await expect(perfiles.verificarCredenciales('1000000', 'otra-cosa')).rejects.toThrow('CI o contraseña incorrectos.')
    await expect(perfiles.verificarCredenciales('9999999', CLAVE_INICIAL)).rejects.toThrow('CI o contraseña incorrectos.')
  })

  it('solo el superadmin crea usuarios', async () => {
    const datos = { nombre: 'Lucía Pérez', ci: ' 7654321 lp ', rol: 'vendedor', clave: 'secreta1' }
    await expect(perfiles.crear(datos, { por: 'p-admin' })).rejects.toThrow('No tenés permiso')
    const nuevo = await perfiles.crear(datos, { por: 'p-super' })
    expect(nuevo).toMatchObject({ ci: '7654321LP', rol: 'vendedor', activo: true })
    expect((await perfiles.verificarCredenciales('7654321LP', 'secreta1')).id).toBe(nuevo.id)
    await expect(perfiles.crear({ ...datos, nombre: 'Otra' }, { por: 'p-super' })).rejects.toThrow('Ya hay un usuario con el CI')
    await expect(perfiles.crear({ ...datos, ci: 'abc' }, { por: 'p-super' })).rejects.toThrow('El CI son números')
    await expect(perfiles.crear({ ...datos, ci: '7654322', clave: '123' }, { por: 'p-super' })).rejects.toThrow('al menos')
  })

  it('restablecer contraseña y dar de baja bloquean el ingreso anterior', async () => {
    const p = (await perfiles.listar()).find((x) => x.ci === '7654321LP')
    await perfiles.cambiarClave(p.id, 'nueva-clave', { por: 'p-super' })
    await expect(perfiles.verificarCredenciales('7654321LP', 'secreta1')).rejects.toThrow()
    await perfiles.editar(p.id, { ...p, activo: false }, { por: 'p-super' })
    await expect(perfiles.verificarCredenciales('7654321LP', 'nueva-clave')).rejects.toThrow('dado de baja')
  })

  it('nunca queda el sistema sin superadmin activo', async () => {
    const s = await perfiles.obtener('p-super')
    await expect(perfiles.editar(s.id, { ...s, rol: 'admin' }, { por: 'p-super' })).rejects.toThrow('al menos un superadmin')
    await expect(perfiles.editar(s.id, { ...s, activo: false }, { por: 'p-super' })).rejects.toThrow()
  })
})

describe('acceso por rol', () => {
  it('Usuarios solo para superadmin; el menú de cada rol muestra solo lo suyo', () => {
    expect(puede('superadmin', 'usuarios.gestionar')).toBe(true)
    expect(puede('admin', 'usuarios.gestionar')).toBe(false)
    const menu = (rol) => PANTALLAS.filter((p) => puedeAlguna(rol, p.accion)).map((p) => p.ruta)
    expect(menu('superadmin')).toContain('/usuarios')
    expect(menu('admin')).not.toContain('/usuarios')
    expect(menu('vendedor')).toEqual(['/inicio', '/catalogo', '/venta', '/ventas', '/comisiones'])
    expect(menu('enc_deposito')).toEqual(['/catalogo', '/stock'])
  })
})
