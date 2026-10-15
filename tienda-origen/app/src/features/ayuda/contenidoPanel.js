// Manual del panel de administración, dentro de la propia app. Sale del relevamiento de las pantallas reales
// (src/features/panel, catalogo/admin e inventario). Si cambia una pantalla, se actualiza acá y en
// docs/entrega (manual de administración).
export function seccionesPanel() {
  return [
    {
      id: 'entrar',
      titulo: 'Entrar y moverse por el panel',
      bloques: [
        { p: 'Se entra desde la dirección /administracion con tu correo y tu contraseña. Si no recordás la contraseña, pedísela a la administración.' },
        { lista: ['El menú está a la izquierda en la computadora y abajo en el celular (el botón Más abre el resto).', 'El botón de arriba a la izquierda contrae el menú a íconos para tener más lugar; queda recordado.', 'Arriba a la derecha ves si estás Conectada, con Conexión lenta o Sin conexión, y cuántos cambios están por enviarse.', 'Antes de salir, el sistema espera a que se envíen los cambios pendientes.'] },
        {
          tabla: {
            cabecera: ['Rol', 'Qué puede hacer'],
            filas: [
              ['Administradora', 'Todo: pedidos, productos, precios, stock, gastos, reportes, cobros, usuarios y configuración.'],
              ['Encargada de tienda / de ventas', 'Ver y avanzar pedidos, confirmar pagos en efectivo, cargar gastos y consultar el catálogo.'],
              ['Encargada de depósito', 'Editar productos y categorías, ver stock y registrar movimientos.'],
            ],
          },
        },
        { nota: 'Si una pantalla dice “No tenés acceso a esta pantalla”, tu rol no la incluye. Pedí el acceso a la administración.' },
      ],
    },
    {
      id: 'inicio',
      titulo: 'Inicio',
      bloques: [
        { p: 'Es el resumen del día. La administración ve las cifras (Vendido hoy, Vendido en el mes y Margen del mes); las encargadas ven lo que tienen para hacer.' },
        { lista: ['Pagos por confirmar: pedidos con pago en efectivo que esperan que los confirmes.', 'Para hacer: pedidos pagados o en curso, del más viejo al más nuevo, con la próxima acción sugerida.', 'Por reponer: modelos publicados con algún color con poco stock.'] },
        { p: 'Abajo hay atajos: Nuevo producto, Cargar un gasto y Ver la tienda.' },
      ],
    },
    {
      id: 'pedidos',
      titulo: 'Pedidos',
      bloques: [
        { p: 'Lista todas las compras. Podés buscar por código, nombre o teléfono; filtrar por estado (Activos, Pendientes de pago, Por preparar, Por entregar, Entregados, Cancelados y reembolsados, Todos), por origen y por período; y bajar todo a Excel.' },
        { h: 'Abrir un pedido' },
        { p: 'Tocá una fila para ver lo que compró, el comprador, la entrega, el historial y, si pagó con Mercado Pago, el bloque Cobro con Mercado Pago.' },
        { h: 'Avanzar un pedido' },
        {
          pasos: [
            'Pendiente de pago: si es efectivo, tocá Confirmar pago cuando cobres. Con Mercado Pago no se confirma a mano: lo hace el sistema.',
            'Pagado: tocá Marcar en preparación.',
            'En preparación: tocá Listo para retirar (retiro) o Marcar como enviado (envío).',
            'Listo para retirar o Enviado: tocá Marcar como entregado cuando se entregue.',
          ],
        },
        { p: 'El botón WhatsApp abre la conversación con un mensaje armado según el estado. Imprimir ticket abre el ticket de 80 mm.' },
        { ojo: 'Cancelar pedido y Reembolsar piden un motivo obligatorio y solo los puede hacer la administración. Reembolsar marca el pedido y devuelve el stock; el dinero se devuelve desde tu cuenta de Mercado Pago.' },
      ],
    },
    {
      id: 'productos',
      titulo: 'Productos',
      bloques: [
        { p: 'El catálogo. Arriba hay tres pestañas: Catálogo, Stock y Buscar por código; y filtros: Activos, En la tienda, Sin publicar, Publicados sin precio y Dados de baja.' },
        { h: 'Crear un producto' },
        {
          pasos: [
            'Tocá Nuevo producto. El Código ya viene puesto con el siguiente libre; podés cambiarlo.',
            'Completá Precio por docena (US$), Nombre y Categoría (si no existe, creala debajo).',
            'En Tienda online poné el Precio por unidad (Bs): es el que ve la clienta.',
            'Agregá Fotos (la primera es la principal) y los Colores con su stock inicial.',
            'Marcá Publicado en la tienda y tocá Crear producto.',
          ],
        },
        { nota: 'Para publicar hace falta el precio en bolivianos. En menos de un minuto el producto aparece en la tienda.' },
        { h: 'Dar de baja' },
        { p: 'Dar de baja saca el producto de la tienda pero conserva los pedidos y el historial. Se puede reactivar cuando quieras.' },
        { h: 'Categorías y carga masiva' },
        { lista: ['Categorías: crear, renombrar y ordenar (el orden es el de la tienda). No se pueden eliminar.', 'Carga masiva: subí un Excel con códigos, nombres y precios (descargá la plantilla), revisá la vista previa y confirmá; también podés subir fotos en lote nombradas con el código (MN-005_1.jpg).'] },
      ],
    },
    {
      id: 'stock',
      titulo: 'Stock',
      bloques: [
        { p: 'Muestra cuántas prendas hay, cuántos colores están con stock bajo y cuáles agotados. “Disponible” ya descuenta lo reservado por pedidos pendientes.' },
        {
          pasos: [
            'Tocá un producto para abrir su inventario.',
            'Elegí el color y el tipo de movimiento: Entrada (llegó mercadería), Salida (merma o pérdida) o Ajuste (conteo real).',
            'Escribí la cantidad y el motivo (obligatorio en Salida y Ajuste) y tocá Registrar.',
          ],
        },
        { p: 'Para ajustar muchos productos juntos, usá Cargar desde Excel: bajás la planilla con el stock actual, corregís la columna unidades con el conteo real y la subís.' },
      ],
    },
    {
      id: 'gastos',
      titulo: 'Gastos',
      bloques: [
        { p: 'Se cargan en bolivianos. Elegí fecha, monto, categoría, una descripción opcional y, si querés, una foto del comprobante; tocá Cargar gasto.' },
        { lista: ['Abajo ves el Total del mes y la lista de gastos; el selector Mes cambia el período.', 'La administración puede editar o eliminar un gasto y crear categorías de gasto.'] },
        { nota: 'Después de cargar un gasto el formulario queda con los datos escritos: revisá antes de volver a tocar el botón para no duplicarlo.' },
      ],
    },
    {
      id: 'reportes',
      titulo: 'Reportes (administración)',
      bloques: [
        { p: 'Elegí el período (Hoy, 7 días, Este mes o fechas a medida). Ves ventas cobradas, gastos, margen y pedidos, y tablas por día, medio de pago, origen, productos más vendidos y categorías. Se exporta a Excel.' },
        { nota: 'Las ventas en bolivianos y en pesos argentinos nunca se mezclan: cada moneda se muestra aparte.' },
      ],
    },
    {
      id: 'cobros',
      titulo: 'Cobros y Mercado Pago (administración)',
      bloques: [
        { p: 'La pantalla Cobros muestra cada pago de Mercado Pago con lo que pagó la clienta, lo que descontó Mercado Pago (comisión y retenciones) y lo que llegó a tu cuenta. Arriba te dice si el recargo está bien ajustado.' },
        { p: 'La Guía de Mercado Pago explica con palabras simples qué es cada descuento y cómo ajustar el recargo.' },
        { lista: ['Cómo se conecta: una sola vez con las claves de la cuenta; después cada pago se detecta solo.', 'Si un pedido con Mercado Pago sigue Pendiente después de pagar, la clienta puede tocar “Ya pagué, verificar ahora”.'] },
      ],
    },
    {
      id: 'usuarios',
      titulo: 'Usuarios (administración)',
      bloques: [
        { p: 'Lista a las personas que entran al panel. Podés cambiar el rol de cada una y activarla o desactivarla.' },
        { nota: 'No podés quitarte el acceso a vos misma. El alta de una persona nueva y el cambio de contraseña los hace el equipo técnico.' },
      ],
    },
    {
      id: 'configuracion',
      titulo: 'Configuración (administración)',
      bloques: [
        {
          tabla: {
            cabecera: ['Pestaña', 'Qué se cambia'],
            filas: [
              ['Tienda', 'Nombre, logo, WhatsApp y el aviso de stock bajo.'],
              ['Moneda', 'La conversión de bolivianos a pesos. Se actualiza solo en el sitio. Pide confirmar si el cambio es grande.'],
              ['Sitio', 'Textos de la portada, quiénes somos, cómo comprar, datos del local, horarios, redes y páginas legales.'],
              ['Envíos', 'Retiro en tienda, ciudades con costo y plazo, compra mínima.'],
              ['Pagos', 'El recargo por pago con Mercado Pago o QR y los datos bancarios.'],
              ['Kiosco', 'Tiempo de inactividad, texto del ticket, PIN y agente de impresión.'],
            ],
          },
        },
        { ojo: 'Cada pestaña tiene su propio botón Guardar. Los cambios de moneda y de recargo valen para los pedidos nuevos; los ya creados conservan el valor con el que se hicieron.' },
      ],
    },
    {
      id: 'dudas',
      titulo: 'Preguntas frecuentes',
      bloques: [
        {
          faq: [
            { p: 'Un producto no aparece en la tienda', r: 'Revisá que esté activo, publicado en la tienda, con precio por unidad en Bs, con al menos un color y con stock.' },
            { p: 'Un pedido de Mercado Pago sigue Pendiente', r: 'Abrilo: la pantalla consulta sola. Si la clienta ya pagó, que toque “Ya pagué, verificar ahora”, o buscá la operación en Cobros.' },
            { p: 'El total cobrado es mayor que el precio', r: 'Es el recargo por pago en línea. Ves el detalle en el bloque Cobro con Mercado Pago del pedido.' },
            { p: 'Cambié la conversión y la clienta ve el valor viejo', r: 'El sitio se actualiza en unos 20 segundos. Si insiste, que recargue la página.' },
            { p: 'No veo la sección Reportes o Cobros', r: 'Son solo para la administración.' },
            { p: 'El panel muestra datos viejos', r: 'Cerrá y volvé a abrir la pestaña. Aparece un aviso de “versión nueva” cuando hay una actualización.' },
            { p: 'No puedo salir del panel', r: 'Hay cambios sin enviar. Conectate a internet y esperá a que se envíen.' },
          ],
        },
      ],
    },
  ]
}
