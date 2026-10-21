import { describe, expect, it, vi } from 'vitest'
import { fetchConRenovacion } from './sesion.js'

const venc = () => new Response(JSON.stringify({ code: 'PGRST303', message: 'JWT expired' }), { status: 401 })
const ok = () => new Response('"venta-ok"', { status: 200 })
const cliente = (sesion) => ({ auth: { refreshSession: vi.fn(async () => ({ data: { session: sesion }, error: null })) } })

describe('fetchConRenovacion', () => {
  it('con «JWT expired» renueva el token y repite la consulta UNA vez con el token nuevo', async () => {
    const base = vi.fn().mockResolvedValueOnce(venc()).mockResolvedValueOnce(ok())
    const sb = cliente({ access_token: 'nuevo' })
    const f = fetchConRenovacion(() => sb, base)
    const r = await f('https://x.supabase.co/rest/v1/rpc/registrar_venta', { method: 'POST', headers: { Authorization: 'Bearer viejo' }, body: '{}' })
    expect(r.status).toBe(200)
    expect(sb.auth.refreshSession).toHaveBeenCalledTimes(1)
    expect(base).toHaveBeenCalledTimes(2)
    expect(new Headers(base.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer nuevo')
    expect(base.mock.calls[1][1].body).toBe('{}')
  })

  it('si el servidor sigue rechazando con el token nuevo, no insiste: devuelve ese rechazo', async () => {
    const base = vi.fn().mockImplementation(async () => venc())
    const f = fetchConRenovacion(() => cliente({ access_token: 'nuevo' }), base)
    const r = await f('https://x.supabase.co/rest/v1/rpc/registrar_venta', {})
    expect(r.status).toBe(401)
    expect(base).toHaveBeenCalledTimes(2)
  })

  it('si no se puede renovar (sin sesión o sin red) devuelve el rechazo original', async () => {
    const base = vi.fn().mockResolvedValueOnce(venc())
    const sb = { auth: { refreshSession: vi.fn().mockRejectedValue(new Error('sin red')) } }
    const r = await fetchConRenovacion(() => sb, base)('https://x.supabase.co/rest/v1/ventas', {})
    expect(r.status).toBe(401)
    expect(base).toHaveBeenCalledTimes(1)
    const sinSesion = cliente(null)
    const r2 = await fetchConRenovacion(() => sinSesion, vi.fn().mockResolvedValueOnce(venc()))('https://x.supabase.co/rest/v1/ventas', {})
    expect(r2.status).toBe(401)
  })

  it('otros rechazos (permisos, datos) y las llamadas de auth pasan tal cual, sin renovar', async () => {
    const sb = cliente({ access_token: 'nuevo' })
    const permiso = new Response(JSON.stringify({ code: '42501', message: 'permission denied' }), { status: 403 })
    expect((await fetchConRenovacion(() => sb, async () => permiso)('https://x.supabase.co/rest/v1/ventas', {})).status).toBe(403)
    expect((await fetchConRenovacion(() => sb, async () => venc())('https://x.supabase.co/auth/v1/token?grant_type=refresh_token', {})).status).toBe(401)
    expect(sb.auth.refreshSession).not.toHaveBeenCalled()
  })

  it('también reconoce el rechazo de Storage por token vencido', async () => {
    const storage = () => new Response(JSON.stringify({ statusCode: '400', error: 'InvalidJWT', message: '"exp" claim timestamp check failed' }), { status: 400 })
    const base = vi.fn().mockResolvedValueOnce(storage()).mockResolvedValueOnce(ok())
    const r = await fetchConRenovacion(() => cliente({ access_token: 'n' }), base)('https://x.supabase.co/storage/v1/object/productos/a.jpg', { method: 'POST' })
    expect(r.status).toBe(200)
  })
})
