// Textos de la tienda pública, editables desde el Gestor web (pestaña «Textos»). Están agrupados por página y por sección
// con los mismos nombres que ve la clienta, así se entiende qué se está cambiando. Lo que no se cargó usa el texto por defecto.
//
// Se guardan en la clave `textos` de tienda_config (un objeto {clave: valor}), salvo las claves «propias» (quienes_somos,
// como_comprar, horarios), que ya existían como claves separadas y siguen así.
import {
  COMO_TRABAJAMOS,
  DIFERENCIALES,
  PASOS_POR_DEFECTO,
  PREGUNTAS_FRECUENTES,
  QUIENES_SOMOS_POR_DEFECTO,
  TEMAS_AYUDA,
  validarComoComprar,
  validarHorarios,
  validarQuienesSomos,
} from './configTienda.js'

const cortar = (v, max) => (typeof v === 'string' ? v.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '')
// En los párrafos se conservan los saltos de línea.
const cortarParrafo = (v, max) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '')
const aLineas = (v, max, largo) => (Array.isArray(v) ? v : String(v ?? '').split(/\r?\n/)).map((l) => cortar(l, largo)).filter(Boolean).slice(0, max)

export const QUE_CONTARNOS = [
  'Qué modelos te interesan (el código o el nombre alcanza).',
  'Cuántas docenas o medias docenas pensás llevar.',
  'Si retirás en uno de los locales o necesitás coordinar la entrega.',
  'Si querés que te pasemos los datos para transferir.',
]

// Claves que se guardan aparte (ya existían): cómo se validan y qué devuelven si están vacías.
export const VALIDADORES_PROPIOS = { quienes_somos: validarQuienesSomos, como_comprar: validarComoComprar, horarios: validarHorarios }

/** Páginas → secciones → campos. tipo: linea | parrafo | lineas (una por línea) | items ({titulo, texto}) | preguntas ({tema, p, r}). */
export const PAGINAS_TEXTOS = [
  {
    id: 'inicio',
    titulo: 'Inicio',
    secciones: [
      {
        titulo: 'Portada',
        campos: [
          { clave: 'inicio.titulo', etiqueta: 'Título grande', defecto: 'Nueva temporada' },
          { clave: 'inicio.bajada', etiqueta: 'Texto bajo el título', tipo: 'parrafo', defecto: 'Elegí tu modelo, armá tu pedido y coordiná el pago y la entrega con tu vendedor.' },
          { clave: 'inicio.boton', etiqueta: 'Botón', defecto: 'Ver catálogo' },
        ],
      },
      { titulo: 'Categorías', campos: [{ clave: 'inicio.categorias', etiqueta: 'Título de la sección', defecto: 'Categorías' }] },
    ],
  },
  {
    id: 'catalogo',
    titulo: 'Catálogo',
    secciones: [
      {
        titulo: 'Encabezado',
        campos: [
          { clave: 'catalogo.titulo', etiqueta: 'Título', defecto: 'Catálogo' },
          { clave: 'catalogo.bajada', etiqueta: 'Texto bajo el título', tipo: 'parrafo', defecto: 'Elegí un modelo para ver sus fotos y precios por docena.' },
        ],
      },
    ],
  },
  {
    id: 'quienes',
    titulo: 'Quiénes somos',
    secciones: [
      { titulo: 'Encabezado', campos: [{ clave: 'quienes.titulo', etiqueta: 'Título', defecto: 'Indumentaria femenina por mayor, con atención de cerca.' }] },
      {
        titulo: 'Presentación',
        campos: [{ clave: 'quienes_somos', propia: true, tipo: 'lineas', etiqueta: 'Párrafos (uno por línea; el primero sale destacado)', max: 6, largo: 400, defecto: QUIENES_SOMOS_POR_DEFECTO }],
      },
      {
        titulo: 'Qué ofrecemos',
        campos: [
          { clave: 'quienes.ofrecemos_titulo', etiqueta: 'Título de la sección', defecto: 'Qué ofrecemos' },
          {
            clave: 'quienes.ofrecemos',
            etiqueta: 'Tarjetas (título y texto)',
            tipo: 'items',
            max: 4,
            defecto: [
              { titulo: 'Venta por docena y media docena', texto: 'Cada modelo se compra por docena o por media docena, surtida en talles y colores, para que armes tu stock sin comprar de más.' },
              { titulo: 'Atención directa', texto: 'Un vendedor te atiende por WhatsApp: confirma disponibilidad, precio final y los datos para pagar.' },
              { titulo: 'Locales para retirar', texto: 'Podés pasar a ver las prendas y retirar tu pedido, o coordinar la entrega con tu vendedor.' },
            ],
          },
        ],
      },
      {
        titulo: 'Cómo trabajamos',
        campos: [
          { clave: 'quienes.trabajamos_titulo', etiqueta: 'Título de la sección', defecto: 'Cómo trabajamos' },
          { clave: 'quienes.trabajamos_bajada', etiqueta: 'Texto bajo el título', defecto: 'De elegir un modelo a retirar el pedido, en cuatro pasos.' },
          { clave: 'quienes.trabajamos', etiqueta: 'Pasos (título y texto)', tipo: 'items', max: 6, defecto: COMO_TRABAJAMOS },
        ],
      },
      {
        titulo: 'Lo que nos distingue',
        campos: [
          { clave: 'quienes.distingue_titulo', etiqueta: 'Título de la sección', defecto: 'Lo que nos distingue' },
          { clave: 'quienes.distingue', etiqueta: 'Puntos (título y texto)', tipo: 'items', max: 6, defecto: DIFERENCIALES },
        ],
      },
      {
        titulo: 'Dónde estamos',
        campos: [
          { clave: 'quienes.donde_titulo', etiqueta: 'Título de la sección', defecto: 'Dónde estamos' },
          { clave: 'quienes.donde_bajada', etiqueta: 'Texto bajo el título', defecto: 'Pasá a ver las prendas y a retirar tu pedido.' },
        ],
      },
      {
        titulo: 'Banda final',
        campos: [
          { clave: 'quienes.final_titulo', etiqueta: 'Título', defecto: 'Armá tu pedido cuando quieras' },
          { clave: 'quienes.final_texto', etiqueta: 'Texto', tipo: 'parrafo', defecto: 'Mirá los modelos con sus precios por docena y, cuando estés lista, tu vendedor te acompaña con el resto.' },
        ],
      },
    ],
  },
  {
    id: 'contacto',
    titulo: 'Contacto',
    secciones: [
      {
        titulo: 'Encabezado',
        campos: [
          { clave: 'contacto.titulo', etiqueta: 'Título', defecto: 'Escribinos o pasá por el local.' },
          { clave: 'contacto.bajada', etiqueta: 'Texto bajo el título', tipo: 'parrafo', defecto: 'Atendemos por WhatsApp y en nuestros locales. Elegí la forma que te quede mejor.' },
        ],
      },
      {
        titulo: 'Hablá con nosotros',
        campos: [
          { clave: 'contacto.hablar_titulo', etiqueta: 'Título de la sección', defecto: 'Hablá con nosotros' },
          { clave: 'contacto.hablar_bajada', etiqueta: 'Texto bajo el título', defecto: 'La forma más rápida de pedir o consultar.' },
        ],
      },
      {
        titulo: 'Nuestros locales',
        campos: [
          { clave: 'contacto.locales_titulo', etiqueta: 'Título de la sección', defecto: 'Nuestros locales' },
          { clave: 'contacto.locales_bajada', etiqueta: 'Texto bajo el título', defecto: 'Direcciones, horarios y cómo llegar.' },
        ],
      },
      {
        titulo: 'Horarios de atención',
        campos: [
          { clave: 'contacto.horarios_titulo', etiqueta: 'Título de la sección', defecto: 'Horarios de atención' },
          { clave: 'horarios', propia: true, tipo: 'lineas', etiqueta: 'Horarios generales (uno por línea; vacío = la sección no se muestra)', max: 8, largo: 80, defecto: [] },
        ],
      },
      {
        titulo: 'Qué contarnos para atenderte',
        campos: [
          { clave: 'contacto.contarnos_titulo', etiqueta: 'Título de la sección', defecto: 'Qué contarnos para atenderte' },
          { clave: 'contacto.contarnos_bajada', etiqueta: 'Texto bajo el título', defecto: 'Así te respondemos más rápido.' },
          { clave: 'contacto.contarnos', etiqueta: 'Lista (un punto por línea)', tipo: 'lineas', max: 8, largo: 160, defecto: QUE_CONTARNOS },
        ],
      },
    ],
  },
  {
    id: 'ayuda',
    titulo: 'Ayuda',
    secciones: [
      {
        titulo: 'Encabezado',
        campos: [
          { clave: 'ayuda.titulo', etiqueta: 'Título', defecto: 'Cómo comprar y respuestas a lo que más nos preguntan.' },
          { clave: 'ayuda.bajada', etiqueta: 'Texto bajo el título', defecto: 'Si algo no está acá, tu vendedor te lo confirma por WhatsApp.' },
        ],
      },
      {
        titulo: 'Cómo comprar',
        campos: [
          { clave: 'ayuda.comprar_titulo', etiqueta: 'Título de la sección', defecto: 'Cómo comprar' },
          { clave: 'como_comprar', propia: true, tipo: 'lineas', etiqueta: 'Pasos (uno por línea)', max: 10, largo: 200, defecto: PASOS_POR_DEFECTO },
        ],
      },
      {
        titulo: 'Preguntas frecuentes',
        campos: [
          { clave: 'ayuda.preguntas_titulo', etiqueta: 'Título de la sección', defecto: 'Preguntas frecuentes' },
          { clave: 'ayuda.preguntas', etiqueta: 'Preguntas (tema, pregunta y respuesta)', tipo: 'preguntas', max: 30, defecto: PREGUNTAS_FRECUENTES },
        ],
      },
      {
        titulo: 'Banda final',
        campos: [
          { clave: 'ayuda.final_titulo', etiqueta: 'Título', defecto: '¿No encontraste lo que buscabas?' },
          { clave: 'ayuda.final_texto', etiqueta: 'Texto', tipo: 'parrafo', defecto: 'Escribinos por WhatsApp y una persona del equipo te responde.' },
        ],
      },
    ],
  },
  {
    id: 'pedido',
    titulo: 'Tu pedido',
    secciones: [
      {
        titulo: 'Encabezado',
        campos: [
          { clave: 'pedido.titulo', etiqueta: 'Título', defecto: 'Revisá y enviá tu pedido' },
          { clave: 'pedido.pasos', etiqueta: 'Los tres pasos (uno por línea)', tipo: 'lineas', max: 3, largo: 80, defecto: ['Revisá los modelos y las cantidades', 'Elegí cómo pagás y cómo retirás', 'Envialo por WhatsApp a tu vendedor'] },
        ],
      },
      {
        titulo: 'Qué pasa después de enviar',
        campos: [
          { clave: 'pedido.despues_titulo', etiqueta: 'Título de la sección', defecto: 'Qué pasa después de enviar' },
          {
            clave: 'pedido.despues',
            etiqueta: 'Los tres pasos (uno por línea)',
            tipo: 'lineas',
            max: 3,
            largo: 160,
            defecto: ['Tu vendedor te confirma disponibilidad y precio final.', 'Transferís o pagás en el local, y le mandás el comprobante.', 'Retirás por el local o coordinan la entrega.'],
          },
        ],
      },
      {
        titulo: 'Pedido vacío',
        campos: [
          { clave: 'pedido.vacio_titulo', etiqueta: 'Título', defecto: 'Todavía no elegiste ningún modelo' },
          { clave: 'pedido.vacio_texto', etiqueta: 'Texto', tipo: 'parrafo', defecto: 'Recorré el catálogo, abrí los modelos que te gusten y agregalos. Acá los vas a ver juntos para mandárselos a tu vendedor.' },
        ],
      },
    ],
  },
  {
    id: 'pie',
    titulo: 'Pie de página',
    secciones: [
      {
        titulo: 'Pie',
        campos: [
          { clave: 'pie.frase', etiqueta: 'Frase del negocio', tipo: 'parrafo', defecto: 'Venta mayorista por docena y media docena. Elegís el modelo, pedís por WhatsApp y retirás en el local.' },
          { clave: 'pie.locales_titulo', etiqueta: 'Título de los locales', defecto: 'Nuestros locales' },
        ],
      },
    ],
  },
]

export const CAMPOS_TEXTOS = PAGINAS_TEXTOS.flatMap((p) => p.secciones.flatMap((s) => s.campos.map((c) => ({ tipo: 'linea', ...c, pagina: p.titulo, seccion: s.titulo }))))
const POR_CLAVE = Object.fromEntries(CAMPOS_TEXTOS.map((c) => [c.clave, c]))
export const campoTexto = (clave) => POR_CLAVE[clave]

const TEMAS = new Set(TEMAS_AYUDA.map((t) => t.id))

/** Valida la clave `textos`. Solo claves conocidas; lo vacío se descarta (vuelve el texto por defecto). Nunca da error. */
export function validarTextos(obj) {
  const o = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}
  const valor = {}
  for (const c of CAMPOS_TEXTOS) {
    if (c.propia || !(c.clave in o)) continue
    const v = o[c.clave]
    if (c.tipo === 'linea') {
      const t = cortar(v, 120)
      if (t) valor[c.clave] = t
    } else if (c.tipo === 'parrafo') {
      const t = cortarParrafo(v, 600)
      if (t) valor[c.clave] = t
    } else if (c.tipo === 'lineas') {
      const l = aLineas(v, c.max ?? 10, c.largo ?? 200)
      if (l.length) valor[c.clave] = l
    } else if (c.tipo === 'items') {
      const l = (Array.isArray(v) ? v : [])
        .map((i) => ({ titulo: cortar(i?.titulo, 80), texto: cortarParrafo(i?.texto, 400) }))
        .filter((i) => i.titulo || i.texto)
        .slice(0, c.max ?? 6)
      if (l.length) valor[c.clave] = l
    } else if (c.tipo === 'preguntas') {
      const l = (Array.isArray(v) ? v : [])
        .map((i) => ({ tema: TEMAS.has(i?.tema) ? i.tema : TEMAS_AYUDA[0].id, p: cortar(i?.p, 160), r: cortarParrafo(i?.r, 600) }))
        .filter((i) => i.p && i.r)
        .slice(0, c.max ?? 30)
      if (l.length) valor[c.clave] = l
    }
  }
  return { valor, errores: [] }
}

/**
 * Acceso a los textos efectivos: lo guardado o, si no hay, el texto por defecto.
 * @returns {(clave: string) => any}
 */
export function textosDe(config) {
  const guardados = validarTextos(config?.textos).valor
  return (clave) => {
    const c = POR_CLAVE[clave]
    if (!c) return ''
    if (c.propia) {
      const v = VALIDADORES_PROPIOS[clave](config?.[clave]).valor
      return v.length ? v : c.defecto
    }
    return guardados[clave] ?? c.defecto
  }
}
