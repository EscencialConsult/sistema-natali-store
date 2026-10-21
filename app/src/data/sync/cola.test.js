import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db.js'
import { encolar, liberarEspera, procesar, rescatarTransitorios } from './cola.js'

const T0 = Date.parse('2026-10-21T10:00:00Z')
const poner = async (id) => {
  await db.ventas.put({ id, numero: id, sync_status: 'pending' })
  await encolar({ operacion: 'crear', entidad: 'venta', entidad_id: id, payload: {} })
}

beforeEach(async () => {
  await db.cola_sync.clear()
  await db.ventas.clear()
})

describe('cola: fallos de sesión y de red no marcan la venta como rechazada', () => {
  it('«JWT expired»: la venta queda por enviar (no «con problema»), con espera corta, y corta el ciclo', async () => {
    await poner('a')
    await poner('b')
    const enviados = []
    const r = await procesar({
      ahora: T0,
      enviar: async (i) => {
        enviados.push(i.entidad_id)
        throw new Error('registrar_venta: JWT expired')
      },
    })
    expect(enviados).toHaveLength(1) // el resto fallaría igual: no se insiste con cada uno
    expect(r).toMatchObject({ enviadas: 0, errores: 0, transitorios: 1 })
    expect(r.ultimoFallo.message).toMatch(/JWT expired/)
    const [primero] = await db.cola_sync.orderBy('creado_en').toArray()
    expect(primero).toMatchObject({ estado: 'pendiente', intentos: 1 })
    expect(primero.proximo_intento - T0).toBeLessThanOrEqual(60_000)
    expect((await db.ventas.get(primero.entidad_id)).sync_status).toBe('pending')
  })

  it('al renovarse la sesión, el envío siguiente pasa y todo queda sincronizado', async () => {
    await poner('a')
    await procesar({ ahora: T0, enviar: async () => { throw new Error('JWT expired') } })
    const r = await procesar({ ahora: T0 + 61_000, enviar: async () => {} })
    expect(r.enviadas).toBe(1)
    expect((await db.ventas.get('a')).sync_status).toBe('synced')
    expect(await db.cola_sync.count()).toBe(0)
  })

  it('un rechazo real del servidor sí marca la venta «con problema»', async () => {
    await poner('a')
    const r = await procesar({ ahora: T0, enviar: async () => { throw new Error('registrar_venta: El total (1) no coincide con la suma (2)') } })
    expect(r.errores).toBe(1)
    expect((await db.ventas.get('a')).sync_status).toBe('error')
    expect((await db.cola_sync.toArray())[0].estado).toBe('error')
  })

  it('liberarEspera({ soloTransitorios }) no hace reintentar enseguida a las rechazadas', async () => {
    await poner('a')
    await poner('b')
    await procesar({ ahora: T0, enviar: async (i) => { throw new Error(i.entidad_id === 'a' ? 'El total no coincide' : 'Failed to fetch') } })
    await liberarEspera({ soloTransitorios: true })
    const por = Object.fromEntries((await db.cola_sync.toArray()).map((i) => [i.entidad_id, i]))
    expect(por.a.proximo_intento).toBeGreaterThan(T0)
    expect(por.b.proximo_intento).toBe(0)
    await liberarEspera()
    expect((await db.cola_sync.toArray()).every((i) => i.proximo_intento === 0)).toBe(true)
  })

  it('rescatarTransitorios: lo que una versión anterior marcó «con problema» por JWT expired vuelve a la cola', async () => {
    await poner('a')
    await poner('b')
    const [a, b] = await db.cola_sync.orderBy('creado_en').toArray()
    await db.cola_sync.update(a.id, { estado: 'error', ultimo_error: 'registrar_venta: JWT expired', proximo_intento: T0 + 300_000 })
    await db.ventas.update('a', { sync_status: 'error' })
    await db.cola_sync.update(b.id, { estado: 'error', ultimo_error: 'registrar_venta: El total no coincide', proximo_intento: T0 + 300_000 })
    await db.ventas.update('b', { sync_status: 'error' })
    expect(await rescatarTransitorios()).toBe(1)
    expect(await db.cola_sync.get(a.id)).toMatchObject({ estado: 'pendiente', proximo_intento: 0 })
    expect((await db.ventas.get('a')).sync_status).toBe('pending')
    expect((await db.ventas.get('b')).sync_status).toBe('error')
  })
})
