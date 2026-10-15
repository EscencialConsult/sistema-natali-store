// Repositorio del contenido del sitio (textos, datos del local, envíos, legales). Vive en config bajo la clave 'sitio'.
//   obtener() → sitio completo con valores por defecto · guardar(parcial) · esquemaSitio
// Los valores por defecto son el "seed" del sitio: textos PROVISORIOS (bloqueos B-S1, B-S2, B-L1) marcados con `provisorio: true`
// hasta que Natali cargue los reales desde el panel (etapa 7.8).
import { z } from 'zod'
import { db } from '../../db.js'
import { encolar } from '../../sync/cola.js'

// Objetos anidados con .prefault({}) (zod 4): así un sitio vacío sale con todos los valores por defecto.
const bloque = z.object({ tipo: z.enum(['parrafo', 'imagen', 'titulo']), texto: z.string().default(''), ruta: z.string().default('') })
const paso = z.object({ titulo: z.string(), texto: z.string() })

const QUIENES_SOMOS_BASE = [
  { tipo: 'parrafo', texto: 'Modas Naty es una tienda de ropa femenina de Bermejo. Elegimos cada modelo pensando en que se use, se combine y dure. (Texto provisorio: Natali lo reemplaza desde el panel.)' },
  { tipo: 'parrafo', texto: 'Vendemos en el local y en línea: elegís tu modelo, pagás y lo retirás en la tienda o te lo enviamos.' },
]

const COMO_COMPRAR_BASE = [
  { titulo: 'Elegí', texto: 'Mirá el catálogo, abrí el modelo que te gusta y elegí color y cantidad.' },
  { titulo: 'Pagá', texto: 'Dejá tu nombre y teléfono y pagá en línea o coordiná el pago con nosotras.' },
  { titulo: 'Retirá o recibí', texto: 'Pasá por el local con tu código de pedido, o esperá el envío en tu casa.' },
]

const LEGAL_BASE = {
  terminos: 'BORRADOR (revisar con Natali). Al comprar en esta tienda aceptás estas condiciones. Los precios se muestran en bolivianos e incluyen los impuestos que correspondan. Un pedido queda confirmado cuando el pago está acreditado. Nos reservamos el derecho de cancelar un pedido si el producto ya no está disponible; en ese caso devolvemos el importe pagado.',
  envios_y_cambios: 'BORRADOR (revisar con Natali). Retiro en tienda sin costo. Los envíos tienen el costo y el plazo que se muestran al finalizar la compra. Se aceptan cambios por talle o color dentro de los 7 días, con el producto sin uso y con etiqueta, presentando el código del pedido.',
  privacidad: 'BORRADOR (revisar con Natali). Usamos tu nombre, teléfono y correo solo para procesar y entregar tu pedido y avisarte sobre él. No compartimos tus datos con terceros, salvo con el proveedor de pagos para procesar el cobro.',
}

export const esquemaSitio = z.object({
  lema: z.string().trim().max(80).default('Moda femenina desde Bermejo'),
  portada: z.object({ titulo: z.string().default('Nueva temporada'), bajada: z.string().default('Elegí tu modelo, pagá en línea y retiralo en la tienda o recibilo en tu casa.'), imagen: z.string().default('') }).prefault({}),
  quienes_somos: z.array(bloque).default(QUIENES_SOMOS_BASE),
  como_comprar: z.array(paso).default(COMO_COMPRAR_BASE),
  local: z
    .object({
      direccion: z.string().default('Dirección del local (provisorio)'),
      ciudad: z.string().default('Bermejo, Tarija'),
      horarios: z.array(z.object({ dias: z.string(), horas: z.string() })).default([
        { dias: 'Lunes a viernes', horas: '09:00 a 13:00 y 15:00 a 19:00' },
        { dias: 'Sábados', horas: '09:00 a 13:00' },
      ]),
      mapa_url: z.string().default(''),
      telefono: z.string().default(''),
      instagram: z.string().default(''),
      facebook: z.string().default(''),
      tiktok: z.string().default(''),
    })
    .prefault({}),
  // Ciudad de envío PROVISORIA (bloqueo B-E1): Natali define ciudades, costos y plazos desde el panel.
  envios: z.object({ retiro: z.boolean().default(true), ciudades: z.array(z.object({ nombre: z.string(), costo_cent: z.number().int().min(0), plazo: z.string().default('') })).default([{ nombre: 'Bermejo (provisorio)', costo_cent: 1500, plazo: 'Entrega en el día o al siguiente' }]) }).prefault({}),
  compra_minima_cent: z.number().int().min(0).default(0),
  mostrar_usd: z.boolean().default(false),
  legales: z.object({ terminos: z.string().default(LEGAL_BASE.terminos), envios_y_cambios: z.string().default(LEGAL_BASE.envios_y_cambios), privacidad: z.string().default(LEGAL_BASE.privacidad) }).prefault({}),
  provisorio: z.boolean().default(true),
})

export const sitio = {
  async obtener() {
    const fila = await db.config.get('sitio')
    return esquemaSitio.parse(fila?.valor ?? {})
  },
  async guardar(parcial) {
    const actual = await this.obtener()
    const nuevo = esquemaSitio.parse({ ...actual, ...parcial })
    await db.transaction('rw', db.config, db.cola_sync, async () => {
      await db.config.put({ clave: 'sitio', valor: nuevo })
      await encolar({ operacion: 'guardar', entidad: 'config', entidad_id: 'sitio' })
    })
    return nuevo
  },
}
