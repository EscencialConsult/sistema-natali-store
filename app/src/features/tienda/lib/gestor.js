// Resumen de la configuración global de la tienda para el Gestor web: qué cuenta está conectada, qué conversión se usa,
// por dónde se contacta y qué cosas necesitan atención. Es lectura pura: no escribe nada ni toca datos de Renzo.
import { fechaDia } from '../../../lib/fechas.js'
import { diasDesde, estadoCuenta, NOMBRE_MONEDA, validarEstadoTienda, validarLocales, validarTransferencia, vendedoresDe } from './configTienda.js'

const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '')
const tasaValida = (n) => Number.isFinite(n) && n > 0

/** CBU y similares se muestran tapados salvo los últimos 4 dígitos. */
export const enmascarar = (digitos) => {
  const d = String(digitos ?? '')
  return d.length > 4 ? `${'•'.repeat(d.length - 4)}${d.slice(-4)}` : d
}

// Si la cotización lleva más días que esto sin tocarse, se avisa (la clienta la maneja día a día).
export const DIAS_COTIZACION_VIEJA = 3

/**
 * @param {{ config?: Record<string, any>, naty?: Record<string, any>, origen?: string, ahora?: number, vendedores?: any[] }} p
 *   vendedores: perfiles con rol vendedor/a, activos y con teléfono (de Usuarios). Sin ellos, la lista manual `contactos`.
 *   config: claves de tienda_config. naty: claves de naty_config (solo lectura, son de Renzo). origen: https://sitio
 */
export function resumenGlobal({ config = {}, naty = {}, origen = '', ahora = Date.now(), vendedores } = {}) {
  const transferencia = validarTransferencia(config.transferencia).valor
  const cuenta = estadoCuenta(transferencia, ahora)
  const contactos = vendedoresDe(vendedores, config)
  const locales = validarLocales(config.locales).valor
  const tienda = validarEstadoTienda(config.tienda).valor

  const tc = naty.tipo_cambio ?? {}
  const ars = Number(tc.ars)
  const bs = Number(tc.bs)
  const diasCotizacion = diasDesde(tc.actualizado_en, ahora)
  const preciosVisibles = naty.mostrar_precios_publico === true

  const wsTienda = soloDigitos(naty.whatsapp_tienda)
  const principal = wsTienda.length >= 8
    ? { telefono: wsTienda, origen: 'tienda', nombre: 'WhatsApp de la tienda' }
    : contactos[0]
      ? { telefono: contactos[0].telefono, origen: 'contactos', nombre: contactos[0].nombre }
      : null

  const urlQr = typeof naty.url_catalogo === 'string' ? naty.url_catalogo.trim() : ''
  const urlPublica = origen ? `${origen}/` : ''

  const alertas = []
  const alerta = (id, nivel, texto, pestana) => alertas.push({ id, nivel, texto, pestana })

  if (tienda.cerrada) alerta('tienda-cerrada', 'media', 'La tienda está cerrada al público (clave «tienda» de la configuración): las clientas ven el aviso de mantenimiento.', null)

  if (cuenta.estado === 'sin_datos') {
    alerta('cuenta-sin-datos', 'alta', 'Todavía no cargaste la cuenta de transferencia. La clienta no sabe a dónde pagar.', 'cuenta')
  } else {
    if (cuenta.estado === 'vencida') {
      const hace = cuenta.motivo === 'fecha_de_cambio' ? `La fecha de cambio de la cuenta pasó hace ${Math.abs(cuenta.dias)} días.` : 'La cuenta lleva más de 60 días sin revisarse.'
      alerta('cuenta-vencida', 'alta', `${hace} Cambiala ya: la tienda le está pidiendo a la clienta que confirme los datos con su vendedor.`, 'cuenta')
    } else if (cuenta.estado === 'por_vencer') {
      alerta('cuenta-por-vencer', 'media', cuenta.motivo === 'fecha_de_cambio' ? `La cuenta se cambia ${cuenta.dias <= 0 ? 'hoy' : `en ${cuenta.dias} días`}.` : 'Hace casi 2 meses que no se revisa la cuenta.', 'cuenta')
    }
    if (!transferencia?.cambiar_el) alerta('cuenta-sin-fecha', 'info', 'No cargaste la fecha en la que hay que cambiar la cuenta. Poné una para recibir el aviso.', 'cuenta')
  }

  if (!tasaValida(ars) || !tasaValida(bs)) alerta('cotizacion-invalida', 'alta', 'Falta o es inválida la cotización de pesos o bolivianos: la tienda muestra solo dólares.', null)
  else if (tc.ejemplo === true) alerta('cotizacion-ejemplo', 'alta', 'La cotización es de ejemplo: la tienda no muestra importes en pesos ni bolivianos.', null)
  else if (diasCotizacion !== null && diasCotizacion > DIAS_COTIZACION_VIEJA) alerta('cotizacion-vieja', 'media', `La cotización se actualizó hace ${diasCotizacion} días (${fechaDia(tc.actualizado_en)}).`, null)

  if (!preciosVisibles) alerta('precios-ocultos', 'media', 'Los precios no se muestran en la tienda: dicen "a consultar". Se activan en Ajustes, tarjeta "Catálogo y código QR".', null)
  if (!principal) alerta('sin-contacto', 'alta', 'No hay ningún WhatsApp cargado: la clienta no puede escribirles.', 'contacto')
  if (!contactos.length) alerta('sin-vendedores', 'media', 'No hay vendedores con teléfono: en Usuarios, cargá el teléfono de cada vendedor/a. Hasta entonces el pedido sale sin elegir vendedor.', 'contacto')
  if (!locales.length) alerta('sin-locales', 'media', 'No hay locales cargados en "Contacto".', 'contacto')
  if (!urlQr) alerta('sin-qr', 'info', 'La nota de venta no imprime el QR porque no hay dirección del catálogo (Ajustes, "Catálogo y código QR").', null)
  else if (urlPublica && urlQr.replace(/\/+$/, '') !== urlPublica.replace(/\/+$/, '')) {
    alerta('qr-distinto', 'info', `El QR de la nota apunta a ${urlQr}, que no es la dirección de esta tienda (${urlPublica}).`, 'direcciones')
  }

  const orden = { alta: 0, media: 1, info: 2 }
  alertas.sort((a, b) => orden[a.nivel] - orden[b.nivel])

  return {
    cuenta: {
      ...cuenta,
      titular: transferencia?.titular ?? '',
      banco: transferencia?.banco ?? '',
      cbu: transferencia?.cbu ?? '',
      cbuEnmascarado: enmascarar(transferencia?.cbu),
      cuit: transferencia?.cuit ?? '',
      alias: transferencia?.alias ?? '',
      moneda: transferencia?.moneda ?? 'ars',
      monedaTexto: NOMBRE_MONEDA[transferencia?.moneda ?? 'ars'],
      cambiarEl: transferencia?.cambiar_el ?? '',
      actualizadoEn: transferencia?.actualizado_en ?? '',
    },
    conversion: {
      ars: tasaValida(ars) ? ars : null,
      bs: tasaValida(bs) ? bs : null,
      actualizadoEn: tc.actualizado_en ?? '',
      diasSinActualizar: diasCotizacion,
      esEjemplo: tc.ejemplo === true,
      preciosVisibles,
    },
    contacto: { principal, contactos: contactos.length, locales: locales.length },
    sitio: { urlPublica, urlQr, urlSistema: origen ? `${origen}/admin/` : '' },
    tienda,
    alertas,
    hayAlertasAltas: alertas.some((a) => a.nivel === 'alta'),
  }
}
