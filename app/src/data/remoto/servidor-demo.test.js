// Prueba el servidor de demostración local: que imite bien lo que la app necesita y que respete los permisos reales de Renzo.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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

  // Pedido «contraseña = CI» (ficha de Bermejo, 23/10/2026). Datos inventados. Esta base tiene pgcrypto y el login con crypt:
  // es la única donde se pueden ejecutar de verdad naty_crear_usuario y naty_cambiar_clave.
  describe('[CLAVE-CI] contraseña = CI', () => {
    const CI = '4829153'
    const CI_NUEVO = '9175336'
    const rpc = (token, funcion, args = {}) => fetch(`${base}/rest/v1/rpc/${funcion}`, { method: 'POST', headers: conToken(token), body: JSON.stringify(args) })
    const tokenDe = async (usuario) => (await sesion(usuario)).cuerpo.access_token
    let natali
    let ariel
    let fabiana
    let lucia

    beforeAll(async () => {
      natali = await tokenDe('natali')
      ariel = await tokenDe('ariel')
      fabiana = await tokenDe('fabiana')
    })

    it('la superadmin crea a alguien con su CI como contraseña y esa persona entra con el CI', async () => {
      const r = await rpc(natali, 'naty_crear_usuario', { p_usuario: 'lucia', p_nombre: 'Lucía Prueba', p_rol: 'vendedor', p_clave: CI })
      expect(r.status).toBe(200)
      lucia = await r.json()
      expect((await sesion('lucia', CI)).estado).toBe(200)
      expect((await sesion('lucia', CI_NUEVO)).estado).toBe(400)
      expect((await sesion('lucia', `${CI}0`)).estado).toBe(400)
    })

    it('sin CI cargado, naty_ver_ci devuelve nada; después de guardarlo, lo devuelve', async () => {
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBeNull()
      expect((await rpc(natali, 'naty_guardar_ci', { p_id: lucia, p_ci: CI })).status).toBe(200)
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI)
    })

    it('guardar de nuevo corrige el CI (no duplica la fila)', async () => {
      await rpc(natali, 'naty_guardar_ci', { p_id: lucia, p_ci: CI_NUEVO })
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI_NUEVO)
      const filas = await (await get('/rest/v1/naty_perfiles_ci?select=perfil_id,ci', conToken(natali))).json()
      expect(filas.filter((x) => x.perfil_id === lucia)).toHaveLength(1)
      await rpc(natali, 'naty_guardar_ci', { p_id: lucia, p_ci: CI })
    })

    it('restablecer cambia la contraseña: la vieja deja de servir y la nueva sirve', async () => {
      expect((await rpc(natali, 'naty_cambiar_clave', { p_id: lucia, p_clave: CI_NUEVO })).status).toBe(200)
      expect((await sesion('lucia', CI)).estado).toBe(400)
      expect((await sesion('lucia', CI_NUEVO)).estado).toBe(200)
      // Volver al CI guardado.
      const guardado = await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()
      expect((await rpc(natali, 'naty_cambiar_clave', { p_id: lucia, p_clave: guardado })).status).toBe(200)
      expect((await sesion('lucia', CI)).estado).toBe(200)
    })

    it('una contraseña de menos de 6 caracteres se rechaza, al crear y al restablecer', async () => {
      const crear = await rpc(natali, 'naty_crear_usuario', { p_usuario: 'corta', p_nombre: 'Clave Corta', p_rol: 'vendedor', p_clave: '12345' })
      expect(crear.status).toBe(400)
      expect((await crear.json()).message).toMatch(/al menos 6/)
      const cambiar = await rpc(natali, 'naty_cambiar_clave', { p_id: lucia, p_clave: '12345' })
      expect(cambiar.status).toBe(400)
      expect((await cambiar.json()).message).toMatch(/al menos 6/)
      expect((await sesion('lucia', CI)).estado).toBe(200)
    })

    it('el servidor rechaza un CI que no sea de 6 a 12 números, o de una persona que no existe', async () => {
      for (const malo of ['12345', '1234567890123', '12.345.678', '1234567-1A', 'abcdefg', '']) {
        const r = await rpc(natali, 'naty_guardar_ci', { p_id: lucia, p_ci: malo })
        expect(r.status, `CI «${malo}»`).toBe(400)
      }
      const fantasma = await rpc(natali, 'naty_guardar_ci', { p_id: '00000000-0000-4000-8000-00000000dead', p_ci: CI })
      expect(fantasma.status).toBe(400)
      expect((await fantasma.json()).message).toMatch(/ya no existe/)
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI)
    })

    it('un vendedor y una administradora no pueden crear usuarios, cambiar claves ni guardar o ver CI', async () => {
      const llamadas = [
        ['naty_crear_usuario', { p_usuario: 'intruso', p_nombre: 'Intruso', p_rol: 'vendedor', p_clave: CI }],
        ['naty_cambiar_clave', { p_id: lucia, p_clave: CI_NUEVO }],
        ['naty_guardar_ci', { p_id: lucia, p_ci: CI_NUEVO }],
        ['naty_ver_ci', { p_id: lucia }],
      ]
      for (const [quien, token] of [['vendedor', ariel], ['administradora', fabiana]]) {
        for (const [funcion, args] of llamadas) {
          const r = await rpc(token, funcion, args)
          expect(r.status, `${quien} → ${funcion}`).toBe(403)
          expect((await r.json()).message).toMatch(/Solo el superadmin/)
        }
      }
      expect((await sesion('intruso')).estado).toBe(400)
      expect((await sesion('lucia', CI)).estado).toBe(200)
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI)
    })

    it('un anónimo no puede llamar a ninguna de las dos funciones del CI', async () => {
      for (const [funcion, args] of [['naty_guardar_ci', { p_id: lucia, p_ci: CI }], ['naty_ver_ci', { p_id: lucia }]]) {
        const r = await fetch(`${base}/rest/v1/rpc/${funcion}`, { method: 'POST', headers: ANON, body: JSON.stringify(args) })
        expect([401, 403], funcion).toContain(r.status)
      }
    })

    it('la tabla del CI solo la lee la superadmin: el resto no ve ni una fila y nadie la escribe de a poco', async () => {
      const suyas = await (await get('/rest/v1/naty_perfiles_ci?select=perfil_id,ci', conToken(natali))).json()
      expect(suyas.find((x) => x.perfil_id === lucia)?.ci).toBe(CI)
      for (const token of [ariel, fabiana]) {
        const r = await get('/rest/v1/naty_perfiles_ci?select=*', conToken(token))
        expect(r.status).toBe(200)
        expect(await r.json()).toEqual([])
      }
      expect([401, 403]).toContain((await get('/rest/v1/naty_perfiles_ci?select=*')).status)
      // Ni siquiera la superadmin escribe directo: solo por las funciones.
      for (const token of [natali, ariel]) {
        const r = await fetch(`${base}/rest/v1/naty_perfiles_ci`, { method: 'POST', headers: conToken(token), body: JSON.stringify({ perfil_id: lucia, ci: CI_NUEVO }) })
        expect(r.status).toBe(403)
      }
      const patch = await fetch(`${base}/rest/v1/naty_perfiles_ci?perfil_id=eq.${lucia}`, { method: 'PATCH', headers: conToken(natali), body: JSON.stringify({ ci: CI_NUEVO }) })
      expect(patch.status).toBe(403)
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI)
    })

    it('el CI no aparece en los perfiles que se descargan a los celulares', async () => {
      for (const token of [ariel, fabiana, natali]) {
        const filas = await (await get('/rest/v1/naty_perfiles?select=*', conToken(token))).json()
        expect(filas.length).toBeGreaterThan(5)
        for (const fila of filas) expect(Object.keys(fila)).not.toContain('ci')
        const texto = JSON.stringify(filas)
        expect(texto).not.toContain(CI)
        expect(texto).not.toContain(CI_NUEVO)
      }
    })

    it('si se borra el perfil, su CI se borra con él', async () => {
      const { rows } = await srv.db.query(`select naty_crear_usuario_interno('temporal', 'Temporal Prueba', 'vendedor'::naty_rol_usuario, $1) as id`, [CI_NUEVO])
      await rpc(natali, 'naty_guardar_ci', { p_id: rows[0].id, p_ci: CI_NUEVO })
      expect((await srv.db.query('select count(*)::int as c from naty_perfiles_ci where perfil_id = $1', [rows[0].id])).rows[0].c).toBe(1)
      await srv.db.query('delete from naty_perfiles where id = $1', [rows[0].id])
      expect((await srv.db.query('select count(*)::int as c from naty_perfiles_ci where perfil_id = $1', [rows[0].id])).rows[0].c).toBe(0)
    })

    it('volver a aplicar el esquema completo no pierde el CI ni abre la tabla, y la registra una sola vez', async () => {
      const esquema = readFileSync(fileURLToPath(new URL('../../../supabase/naty_schema.sql', import.meta.url)), 'utf8')
      await srv.db.exec(esquema)
      expect(await (await rpc(natali, 'naty_ver_ci', { p_id: lucia })).json()).toBe(CI)
      expect((await rpc(ariel, 'naty_ver_ci', { p_id: lucia })).status).toBe(403)
      expect(await (await get('/rest/v1/naty_perfiles_ci?select=*', conToken(ariel))).json()).toEqual([])
      expect((await sesion('lucia', CI)).estado).toBe(200)
      const { rows } = await srv.db.query(`select (select count(*)::int from jsonb_array_elements_text(tablas) t where t = 'naty_perfiles_ci') as veces from proyectos where identificador = 'naty'`)
      expect(rows[0].veces).toBe(1)
    })
  })
})
