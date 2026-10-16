// Guía de la clienta: cómo comprar en la tienda. Todo sale del comportamiento real del sitio (pantallas Catálogo, Producto,
// Carrito, Finalizar compra, Pedido y Seguir mi pedido). Los datos que cambian (recargo, WhatsApp, horarios) los completa la página.
export function seccionesCliente({ recargo = 0, whatsapp = '', direccion = '', horarios = [] } = {}) {
  const pct = recargo > 0 ? `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(recargo)} %` : null
  return [
    {
      id: 'como-comprar',
      titulo: 'Cómo comprar, paso a paso',
      bloques: [
        { p: 'Comprar lleva pocos minutos y no necesitás crear una cuenta.' },
        {
          pasos: [
            'Entrá al Catálogo y buscá lo que te gusta: podés filtrar por categoría, buscar por nombre y ordenar por novedades o por precio.',
            'Tocá un modelo para ver sus fotos, sus colores y su precio.',
            'Elegí el color y la cantidad. Si un color no tiene stock, aparece como agotado.',
            'Tocá “Agregar al carrito”. Se abre un resumen con la opción de seguir comprando o ir al carrito.',
            'En el carrito revisá lo elegido y tocá “Finalizar compra”.',
            'Completá tus datos (nombre, teléfono y correo), elegí cómo recibir tu pedido y cómo pagar.',
            'Tocá “Confirmar pedido” y después “Pagar ahora”. Pagás en la pantalla de Mercado Pago.',
            'Al terminar, vuelve la tienda con el mensaje “¡Gracias por tu compra!” y el detalle de lo que compraste.',
          ],
        },
        { nota: 'Para que te llegue el comprobante, poné un correo que uses. Es lo único que necesitamos además de tu nombre y teléfono.' },
      ],
    },
    {
      id: 'precios',
      titulo: 'Precios y monedas',
      bloques: [
        { p: 'Cada prenda muestra su precio en bolivianos (Bs) y, al lado, su equivalente en pesos argentinos. La conversión la define la tienda y se actualiza sola.' },
        { lista: ['Con Mercado Pago pagás en pesos argentinos.', 'Con efectivo en el local elegís si pagás en bolivianos o en pesos.'] },
        { ojo: 'Si la tienda cambia la conversión mientras tenés productos en el carrito, el sitio te avisa y recalcula los pesos. Revisá el total antes de pagar.' },
      ],
    },
    {
      id: 'formas-de-pago',
      titulo: 'Formas de pago',
      bloques: [
        {
          tabla: {
            cabecera: ['Forma', 'Cómo es', 'Cuándo se confirma'],
            filas: [
              ['Mercado Pago', 'Tarjeta de crédito o débito, o dinero en tu cuenta de Mercado Pago. También podés pagar con código QR desde la computadora.', 'En segundos, de forma automática'],
              ['Efectivo en el local', 'Pagás en el mostrador cuando retirás tu pedido, en bolivianos o en pesos.', 'Cuando la encargada registra tu pago'],
            ],
          },
        },
        pct
          ? { p: `Al pagar con Mercado Pago o QR se suma un recargo de ${pct}: es la comisión que cobra Mercado Pago por procesar el pago en línea. Lo ves en el resumen antes de pagar. Con efectivo en el local no se suma.` }
          : { p: 'Al pagar con Mercado Pago o QR puede sumarse un recargo: es la comisión que cobra Mercado Pago. Lo ves en el resumen antes de pagar.' },
        { nota: 'Para pagar con QR: en la computadora tocá “Pagar con código QR desde el celular” y escaneá el código desde la app de Mercado Pago o la de tu banco (no con la cámara del celular).' },
        { ojo: 'Tenés 30 minutos para pagar. Si no se completa el pago en ese plazo, el pedido se cancela solo y se libera el stock.' },
      ],
    },
    {
      id: 'entrega',
      titulo: 'Cómo recibís tu pedido',
      bloques: [
        {
          lista: [
            'Retiro en la tienda: sin costo. Te avisamos por WhatsApp cuando esté listo.',
            'Envío a domicilio: elegís tu ciudad y dejás tu dirección. El costo y el plazo se ven antes de confirmar.',
          ],
        },
        ...(direccion ? [{ p: `Dirección del local: ${direccion}.` }] : []),
        ...(horarios.length ? [{ p: `Horarios: ${horarios.map((h) => `${h.dias}, ${h.horas}`).join(' · ')}.` }] : []),
      ],
    },
    {
      id: 'despues',
      titulo: 'Después de pagar',
      bloques: [
        {
          pasos: [
            'Aparece “¡Gracias por tu compra!” con tu pedido, lo que compraste y la forma de entrega.',
            'En menos de un minuto te llega un correo con el comprobante y un PDF adjunto.',
            'Cuando tu pedido esté listo o salga el envío, te avisamos por WhatsApp.',
          ],
        },
        { p: 'El correo tiene un botón “Seguir mi pedido” que abre otra vez esa misma página desde cualquier dispositivo, sin pedirte datos.' },
        { nota: 'Si no ves el correo, revisá las carpetas Spam o Promociones.' },
      ],
    },
    {
      id: 'seguimiento',
      titulo: 'Seguir mi pedido',
      bloques: [
        { p: 'Si no tenés el enlace del correo, entrá a “Seguir mi pedido” e ingresá el código de tu pedido (por ejemplo TN-000123) y el teléfono con el que compraste.' },
        {
          tabla: {
            cabecera: ['Estado', 'Qué significa'],
            filas: [
              ['Pendiente de pago', 'Todavía falta el pago.'],
              ['Pagado', 'Recibimos tu pago y vamos a preparar tu pedido.'],
              ['En preparación', 'Estamos armando tu pedido.'],
              ['Listo para retirar', 'Podés pasar a buscarlo con tu código.'],
              ['Enviado', 'Tu pedido ya salió.'],
              ['Entregado', 'Pedido entregado.'],
              ['Cancelado', 'El pedido se canceló (por ejemplo, por no pagarse a tiempo).'],
            ],
          },
        },
      ],
    },
    {
      id: 'problemas',
      titulo: 'Si algo no sale como esperabas',
      bloques: [
        {
          faq: [
            { p: 'Pagué y mi pedido sigue “Pendiente”', r: 'Tocá el botón “Ya pagué, verificar ahora” que está debajo del pedido. Consulta a Mercado Pago en ese momento. Si en unos minutos no cambia, escribinos por WhatsApp con tu código de pedido.' },
            { p: 'No me llegó el correo', r: 'Revisá Spam y Promociones. Si no está, escribinos con tu código de pedido y te lo reenviamos.' },
            { p: 'Mercado Pago me rechazó el pago', r: 'No se te cobró nada. Podés intentar de nuevo con otra tarjeta u otro medio mientras tu pedido siga reservado (30 minutos).' },
            { p: 'El total no coincide con el precio de las prendas', r: 'Con Mercado Pago o QR se suma un recargo que es la comisión de Mercado Pago. Lo ves detallado en el resumen y en el comprobante.' },
            { p: '¿Puedo cambiar o cancelar mi pedido?', r: 'Escribinos por WhatsApp con tu código de pedido lo antes posible. Si ya está en preparación, podemos no llegar a modificarlo.' },
            { p: 'Me aparece un aviso de que se actualizó el tipo de cambio', r: 'Es normal: la tienda actualizó la conversión mientras comprabas. Revisá el nuevo total y confirmá de nuevo.' },
          ],
        },
      ],
    },
    {
      id: 'contacto',
      titulo: 'Contacto',
      bloques: [
        { p: whatsapp ? 'Escribinos por WhatsApp y te ayudamos con tu pedido. Tené a mano el código (por ejemplo TN-000123).' : 'Escribinos desde la página de Contacto y te ayudamos con tu pedido. Tené a mano el código (por ejemplo TN-000123).' },
      ],
    },
  ]
}
