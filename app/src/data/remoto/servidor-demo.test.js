// Prueba el servidor de demostración local: que imite bien lo que la app necesita y que respete los permisos reales de Renzo.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { iniciarServidor } from '../../../scripts/servidor-demo.mjs'

const CLAVE = 'Demo-Naty-2026'
const ANON = { apikey: 'clave-publica-de-demostracion', authorization: 'Bearer clave-publica-de-demostracion', 'content-type': 'application/json' }

describe('servidor de demostración', { timeout: 60_000 }, () => {
  let srv
  let base

  beforeAll(async () => {
    srv = await iniciarServidor({ puerto: 0 })
    base = `http://127.0.0.1:${srv.servidor.address().port}`
  }, 120_000)
  afterAll(async () => {
    await new Promise((ok) => srv?.servidor.close(ok))
    await srv?.db.close()
  })

  const get = (ruta, headers = ANON) => fetch(`${base}${ruta}`, { headers })
  const sesion = async (usuario, clave = CLAVE) => {
    const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: ANON,
      body: JSON.stringify({ email: `${usuario}@usuarios.modasnaty.internal`, password: clave }),
    })
    return { estado: r.status, cuerpo: await r.json() }
  }
  const conToken = (t) => ({ ...ANON, authorization: `Bearer ${t}` })

  it('arma un catálogo de ejemplo y la configuración pública de la tienda', async () => {
    const filas = await (await get('/rest/v1/tienda_catalogo_publico?select=id,codigo,fotos&limit=5')).json()
    expect(filas).toHaveLength(5)
    expect(filas[0].fotos[0]).toMatch(/^F\d{4}\//) // ruta relativa al bucket, como en producción
    const [aj] = await (await get('/rest/v1/tienda_ajustes_publicos?select=*')).json()
    expect(Number(aj.tipo_cambio_ars)).toBe(1590)
    expect(aj.mostrar_precios).toBe(true)
  })

  it('un anónimo no ve ninguna tabla interna', async () => {
    for (const t of ['naty_productos', 'naty_perfiles', 'naty_ventas', 'naty_movimientos_stock', 'tienda_oculto']) {
      const r = await get(`/rest/v1/${t}?select=*`)
      expect([401, 403], t).toContain(r.status)
    }
  })

  it('el login valida la contraseña de verdad', async () => {
    expect((await sesion('natali', 'incorrecta')).estado).toBe(400)
    expect((await sesion('inexistente')).estado).toBe(400)
    const ok = await sesion('natali')
    expect(ok.estado).toBe(200)
    expect(ok.cuerpo.user.email).toBe('natali@usuarios.modasnaty.internal')
    expect(ok.cuerpo.access_token.split('.')).toHaveLength(3)
    const yo = await get('/auth/v1/user', conToken(ok.cuerpo.access_token))
    expect((await yo.json()).email).toBe('natali@usuarios.modasnaty.internal')
  })

  it('un token manipulado se rechaza', async () => {
    const { cuerpo } = await sesion('natali')
    const falso = `${cuerpo.access_token.slice(0, -4)}AAAA`
    expect((await get('/rest/v1/naty_perfiles?select=id', conToken(falso))).status).toBe(401)
  })

  it('el sistema de Renzo funciona con sus permisos: filtros, orden, funciones y escritura', async () => {
    const { cuerpo } = await sesion('natali')
    const h = conToken(cuerpo.access_token)
    const perfiles = await (await get('/rest/v1/naty_perfiles?select=usuario,rol&order=usuario.asc', h)).json()
    expect(perfiles.map((p) => p.usuario)).toEqual(['ariel', 'carla', 'fabiana', 'natali', 'pamela'])
    const dos = await (await get('/rest/v1/naty_productos?select=codigo&order=codigo.asc&limit=2&offset=1', h)).json()
    expect(dos.map((p) => p.codigo)).toEqual(['F0031', 'F0032'])
    const uso = await (await fetch(`${base}/rest/v1/rpc/naty_uso_almacenamiento`, { method: 'POST', headers: h, body: '{}' })).json()
    expect(uso.datos_bytes).toBeGreaterThan(0)
  })

  it('el vendedor no puede cambiar la configuración de la tienda; el superadmin sí, y se refleja en lo público', async () => {
    const v = conToken((await sesion('ariel')).cuerpo.access_token)
    const noPuede = await fetch(`${base}/rest/v1/tienda_oculto?on_conflict=producto_id`, {
      method: 'POST',
      headers: { ...v, prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ producto_id: '00000000-0000-4000-8000-000000000000', oculto: true }),
    })
    expect(noPuede.status).toBe(403)

    const antes = (await (await get('/rest/v1/tienda_catalogo_publico?select=id')).json()).length
    const admin = conToken((await sesion('natali')).cuerpo.access_token)
    const [primero] = await (await get('/rest/v1/naty_productos?select=id&order=codigo.asc&limit=1', admin)).json()
    const puede = await fetch(`${base}/rest/v1/tienda_oculto?on_conflict=producto_id`, {
      method: 'POST',
      headers: { ...admin, prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ producto_id: primero.id, oculto: true }),
    })
    expect(puede.status).toBe(201)
    const despues = (await (await get('/rest/v1/tienda_catalogo_publico?select=id')).json()).length
    expect(despues).toBe(antes - 1)
  })

  it('DELETE sin filtros se rechaza y un filtro inválido no llega a la base', async () => {
    const admin = conToken((await sesion('natali')).cuerpo.access_token)
    expect((await fetch(`${base}/rest/v1/tienda_oculto`, { method: 'DELETE', headers: admin })).status).toBe(400)
    expect((await get('/rest/v1/naty_productos?select=*&codigo=eq.x;drop table naty_productos', admin)).status).toBe(200)
    expect((await get('/rest/v1/naty_productos?select=*&"codigo"=eq.x', admin)).status).toBe(400)
    const aun = await (await get('/rest/v1/naty_productos?select=id&limit=1', admin)).json()
    expect(aun).toHaveLength(1)
  })

  it('sirve las fotos de ejemplo y no se sale de su carpeta', async () => {
    const [f] = await (await get('/rest/v1/tienda_catalogo_publico?select=fotos&limit=1')).json()
    const foto = await get(`/storage/v1/object/public/naty_productos/${f.fotos[0]}`)
    expect(foto.status).toBe(200)
    expect(foto.headers.get('content-type')).toBe('image/jpeg')
    const fuera = await get('/storage/v1/object/public/naty_productos/..%2F..%2F..%2Fpackage.json')
    expect(fuera.status).toBe(404)
  })
})
