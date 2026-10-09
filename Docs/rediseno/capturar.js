// Captura TODAS las pantallas de la app (modo local, datos de demostración) en celular y escritorio.
// Se corre con la herramienta de Playwright del agente: browser_run_code_unsafe con filename = este archivo.
// Cambiar CARPETA entre "antes" y "despues" para comparar.
async (page) => {
  const CARPETA = 'antes'
  const RAIZ = 'C:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS PERSONALIZADO/MODAS NATALI/Docs/rediseno/' + CARPETA + '/'
  const BASE = 'http://localhost:5300'
  const log = []

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(BASE + '/')
  await page.evaluate(() => localStorage.setItem('naty.sesion', 'p-admin'))
  // Datos de demostración (solo si todavía no hay ventas)
  await page.goto(BASE + '/ajustes', { waitUntil: 'load' })
  await page.waitForTimeout(1200)
  const boton = page.locator('button:has-text("Cargar ventas de demostración")')
  if (await boton.count()) {
    await page.goto(BASE + '/ventas', { waitUntil: 'load' })
    await page.click('button:has-text("Todo")')
    await page.waitForTimeout(800)
    const hay = await page.locator('main li a').count()
    if (!hay) {
      await page.goto(BASE + '/ajustes', { waitUntil: 'load' })
      await page.click('button:has-text("Cargar ventas de demostración")')
      await page.waitForSelector('text=Demo cargada', { timeout: 90000 })
    }
  }

  const tomar = async (nombre, ancho) => {
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${RAIZ}${nombre}-${ancho}.png` })
    log.push(`${nombre}-${ancho}`)
  }
  const ir = async (ruta, esperar) => {
    await page.goto(BASE + ruta, { waitUntil: 'load' })
    if (esperar) await page.waitForSelector(esperar, { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(900)
  }

  for (const [ancho, alto] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width: ancho, height: alto })
    const w = String(ancho)

    // login (sin sesión)
    await page.evaluate(() => localStorage.removeItem('naty.sesion'))
    await ir('/', 'text=¿Quién sos?')
    await tomar('01-login', w)
    await page.click('button:has-text("Ariel Maydana")')
    await page.waitForTimeout(400)
    await tomar('02-login-pin', w)
    await page.evaluate(() => localStorage.setItem('naty.sesion', 'p-admin'))

    await ir('/inicio', 'text=Hola')
    await tomar('03-inicio', w)

    await ir('/catalogo', '#codigo')
    await page.waitForSelector('ul img', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await tomar('04-buscar-grilla', w)
    await page.fill('#codigo', 'mn5')
    await page.waitForSelector('section[aria-label="Mejor coincidencia"]', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(1000)
    await tomar('05-buscar-resultado', w)
    await page.fill('#codigo', '')
    await page.waitForTimeout(500)
    await page.locator('ul li button').first().click()
    await tomar('06-ficha-hoja', w)
    await page.keyboard.press('Escape')

    await ir('/venta', '#buscar-venta')
    await tomar('07-venta-vacia', w)
    for (const cod of ['mn5', '7']) {
      await page.fill('#buscar-venta', cod)
      await page.locator(`ul li button:has-text("MN-00${cod.slice(-1)}")`).first().click()
      await page.locator('dialog li button[aria-pressed]').first().click()
      await page.locator('dialog button:has-text("Agregar ·")').click()
      await page.waitForTimeout(400)
    }
    await page.fill('input[autocomplete="off"][inputmode="tel"]', '59170000000').catch(() => {})
    await tomar('08-venta-carrito', w)
    await page.locator('button:has-text("Confirmar venta")').click()
    await page.waitForURL(/\/ventas\//, { timeout: 15000 })
    await page.waitForSelector('text=Venta guardada')
    await tomar('09-nota', w)

    await ir('/ventas', 'text=Total en')
    await page.click('button:has-text("7 días")')
    await tomar('10-ventas', w)
    await ir('/stock', 'text=Prendas')
    await tomar('11-inventario', w)
    await page.locator('main li button').first().click()
    await tomar('12-inventario-hoja', w)
    await page.keyboard.press('Escape')
    await ir('/comisiones', 'text=Comisiones')
    await tomar('13-comisiones', w)
    await ir('/ajustes', 'text=Ajustes')
    await tomar('14-ajustes', w)
    await ir('/catalogo/admin', 'text=Administrar productos')
    await tomar('15-admin-listado', w)
    await ir('/catalogo/admin/nuevo', 'text=Nuevo producto')
    await tomar('16-admin-form', w)
    await ir('/c', 'text=Catálogo')
    await page.waitForTimeout(1200)
    await tomar('17-publico', w)
  }
  return log
}
