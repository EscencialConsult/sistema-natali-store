# Manual de Usuario: Tienda Online Modas Naty

Guía completa de uso de la tienda online de Modas Naty, en un único documento con dos partes diferenciadas: la compra para la clienta y el panel de administración.

## Índice


1. Introducción y Propuesta de Valor
2. Acceso y Requisitos
3. Recorrido Visual de la Interfaz
4. Operación Paso a Paso
5. Lógica del Sistema
6. Gestión de Resultados
7. Copias de Seguridad y Datos Técnicos Básicos
8. Guía de Solución de Dudas
9. Consejos de Eficiencia

Cómo leer este manual: cada capítulo tiene dos partes marcadas con claridad. Las secciones que empiezan con Clienta describen lo que ve y hace quien compra en la tienda. Las que empiezan con Administración describen el panel de gestión, al que acceden las personas del negocio según su rol.

## 1. Introducción y Propuesta de Valor

La tienda online de Modas Naty permite ver todo el catálogo de la marca, elegir color y cantidad, pagar en línea y recibir un comprobante, sin ir al local ni coordinar cada paso por mensajes. Del lado del negocio, un panel de administración concentra los pedidos, los productos, el stock, los gastos y los cobros, y reemplaza el trabajo manual en planillas y conversaciones sueltas.

Beneficios para la clienta:

- Compra a cualquier hora, desde el celular o la computadora, sin crear una cuenta.
- Ve cada precio en bolivianos y en pesos argentinos, con la conversión vigente de la tienda.
- Paga con Mercado Pago (tarjeta, dinero en cuenta o QR) y el pedido se confirma en segundos.
- Recibe un comprobante por correo con un PDF adjunto y puede seguir su pedido desde cualquier dispositivo.
- Si prefiere, reserva su pedido y paga en efectivo en el local.

Beneficios para la administración:

- Estandarización: cada pedido pasa por los mismos estados, con historial de fecha y motivo.
- Ahorro de tiempo: los pagos con Mercado Pago se detectan y confirman solos, el stock se descuenta al acreditarse el pago y el comprobante sale sin intervención.
- Menos errores: el sistema reserva stock, impide vender lo que no hay y muestra lo cobrado frente a lo que realmente llega a la cuenta.
- Visibilidad: el Inicio y los Reportes muestran qué se vendió, qué hay para hacer y qué conviene reponer.
- Control de acceso: cada persona ve solo lo que corresponde a su rol.

## 2. Acceso y Requisitos

### Clienta: acceso y requisitos

La tienda funciona desde el navegador, sin instalar nada, en celulares, tablets y computadoras (versiones recientes de Chrome, Safari, Edge o Firefox). No requiere cuenta ni contraseña.

Para comprar hacen falta tu nombre y apellido y un teléfono con WhatsApp con código de país (por ejemplo 59171234567). El correo figura como opcional, pero es el que se usa para enviarte el comprobante con el PDF. Para pagar con Mercado Pago necesitás una tarjeta de crédito o débito, o una cuenta de Mercado Pago con dinero disponible.

La tienda guarda en tu navegador el contenido de tu carrito y los pedidos que hiciste desde ese dispositivo, y no pide permisos especiales del dispositivo.

### Administración: acceso y requisitos

El panel se abre desde el navegador con la dirección de la tienda seguida de /administracion. Cada persona entra con su correo electrónico y su contraseña. No hay recuperación automática de contraseña: si se olvida, se la pide a quien administra los accesos. El alta de personas nuevas y los cambios de contraseña los hace el equipo técnico.

El panel necesita internet para entrar por primera vez en un dispositivo. Después guarda una copia de los datos en el dispositivo y envía los cambios al servidor cuando hay conexión. Un indicador en la cabecera muestra Conectada, Conexión lenta o Sin conexión.

Los roles definen qué pantallas y acciones tiene cada persona:

```text
Rol,Pantallas que ve,Acciones principales
Administradora,Todas,Todo: editar precios; cancelar y reembolsar pedidos; ver reportes y cobros; gestionar usuarios; configurar la tienda
Encargada de tienda,Inicio; Pedidos; Productos (consulta); Gastos,Cambiar estados; confirmar pagos en efectivo; cargar gastos; activar el kiosco
Encargada de ventas,Inicio; Pedidos; Productos (consulta); Gastos,Las mismas que la Encargada de tienda
Encargada de depósito,Productos; Stock,Crear y editar productos y categorías; registrar movimientos de stock; cargar stock desde Excel
Vendedor/a,Ninguna del panel,Sin acceso al panel
```

Si una persona abre una pantalla que no le corresponde, el sistema muestra el aviso No tenés acceso a esta pantalla.

## 3. Recorrido Visual de la Interfaz

Las pantallas de la clienta se describen primero y las del panel de administración después, con el mismo orden en el capítulo siguiente.

### Clienta: estructura común de las pantallas

En todas las pantallas hay una barra superior con el menú de la tienda y el acceso al carrito, y un pie con los datos del local, los horarios, los enlaces legales y el acceso a Seguir mi pedido.

### Administración: estructura común de las pantallas

En la computadora hay una barra lateral izquierda con el logo, las secciones del menú, el nombre y rol de la persona y el botón Salir. En la parte de arriba hay un botón para contraer o expandir el menú, el enlace Ayuda y el indicador de conexión. En el celular, el menú pasa a una barra inferior con las secciones principales y un botón Más que abre el resto y el botón Salir.

### Clienta: Inicio

Es la portada de la tienda. De arriba hacia abajo se ven:

- La portada, con el título de la temporada, una frase breve y el botón Ver catálogo.
- Las Categorías de prendas, para entrar directo a un tipo de producto.
- Una fila de Nuevos ingresos, con un enlace Ver todo.
- Una fila de Destacados.
- Cómo comprar, con tres pasos resumidos.
- Nuestra tienda, con la dirección y los horarios del local.

### Clienta: Catálogo

Muestra todos los modelos disponibles. A la izquierda (o arriba, en el celular) hay una lista de categorías con la cantidad de modelos de cada una. Hay un buscador con el texto Buscar modelo y un botón para borrar la búsqueda. Arriba a la derecha hay un selector Ordenar modelos con cuatro opciones: Novedades, Menor precio, Mayor precio y Por nombre. Cada tarjeta muestra la foto, el nombre y el precio en bolivianos y en pesos. Un cartel indica cuántos modelos se están mostrando.

### Clienta: Ficha del producto

Es la página de cada modelo, con su propia dirección que podés compartir. Muestra:

- El nombre del modelo y, si se agotó, la etiqueta Sin stock.
- Las fotos del producto.
- El precio en bolivianos y en pesos argentinos.
- La sección Color, con una muestra por cada color disponible. Hasta que elijas uno, dice elegí uno.
- El selector de cantidad, con botones para sumar y restar una unidad. Cuando quedan pocas unidades, aparece el aviso Quedan y la cantidad.
- El botón principal, que dice Elegí un color mientras no hayas elegido, Sin stock en este color si el color está agotado, o Agregar al carrito cuando todo está listo.
- Un botón para consultar por ese producto por WhatsApp.
- La Descripción del producto, con la opción de ver más.

### Clienta: Resumen de agregado al carrito

Es una ventana que aparece al tocar Agregar al carrito, con el título Agregado al carrito. Muestra lo que sumaste y te deja seguir comprando o ir al carrito.

### Clienta: Carrito

Se llama Tu carrito. Arriba muestra la cantidad de unidades. Hay un aviso fijo que explica que los precios en pesos siguen el tipo de cambio del día y conviene finalizar la compra pronto. Cada línea muestra la foto, el nombre, el color, la cantidad editable y el botón para quitar. A la derecha (o abajo, en el celular) está el resumen con Subtotal, Envío (que dice se calcula al finalizar) y Total, el botón Finalizar compra y el enlace Seguir comprando.

### Clienta: Finalizar compra

Es un formulario en una sola página con cuatro bloques:

- Tus datos: Nombre y apellido, Teléfono (WhatsApp), Correo (opcional) y la opción Recordar mis datos en este dispositivo.
- Entrega: Retiro en la tienda (sin costo, con la dirección del local) o Envío a domicilio (con la lista de ciudades, su costo y plazo, y el campo Dirección y referencia).
- Forma de pago: Mercado Pago o Efectivo en el local. Si elegís efectivo, aparece la pregunta ¿En qué moneda vas a pagar? con las opciones Bolivianos y Pesos argentinos.
- Nota (opcional): un campo para aclarar algo del pedido.

Abajo (o a la derecha en la computadora) está el resumen con los artículos, el Subtotal, el Envío, el Recargo por pago en línea si corresponde, el Total y el botón Confirmar pedido.

### Clienta: Pedido

Es la pantalla de tu pedido. Cuando el pedido ya está pagado, el título es ¡Gracias por tu compra!. Muestra:

- El número de pedido, con un formato como TN-000123.
- El estado del pedido y una frase que explica qué sigue.
- La fecha y hora del pedido.
- Lo que compraste (en la sección Lo que compraste), con cantidad, color y subtotal de cada artículo, más el envío y el total.
- La Entrega, con la forma de entrega, la dirección si es un envío y el nombre a quien va dirigido.
- El botón Consultar por este pedido, que abre WhatsApp con el código ya escrito.

Si el pedido todavía no se pagó, además aparecen los botones Pagar ahora y Pagar con código QR desde el celular, y un recuadro que dice ¿Ya hiciste el pago y esta pantalla no lo muestra? con el botón Ya pagué, verificar ahora.

### Clienta: Seguir mi pedido

Es una pantalla para encontrar un pedido con su código. Tiene dos campos, Código del pedido y Teléfono, y el botón Buscar. Si los datos coinciden, muestra la misma pantalla de Pedido. Si no, avisa que no se encontró un pedido con esos datos.

### Clienta: Quiénes somos, Contacto y páginas legales

Quiénes somos cuenta la historia de la marca. Contacto muestra el WhatsApp, el teléfono, la dirección, los horarios y las redes de la tienda. Las páginas legales son Términos de compra, Envíos y cambios y Privacidad, y se abren desde el pie de página.

### Clienta: Ayuda

Es esta misma guía, resumida, dentro de la tienda: cómo comprar, formas de pago, entrega, seguimiento y preguntas frecuentes, con un índice para ir directo a cada tema.

### Administración: Inicio de sesión

Pantalla en la raíz del panel, con el logo y el título Ingresar. Tiene los campos Correo electrónico y Contraseña y el botón Entrar, que se habilita cuando ambos campos tienen contenido. Debajo dice que si olvidaste la contraseña se la pidas a la administración.

### Administración: Inicio

Título Hola seguido de tu nombre y la fecha. Muestra, si el rol lo permite, tres cifras (Vendido hoy, Vendido en el mes y Margen del mes), el bloque Pagos por confirmar, la lista Para hacer, la lista Por reponer y los botones Nuevo producto, Cargar un gasto y Ver la tienda.

### Administración: Pedidos

Título Pedidos con el botón Exportar a Excel. Debajo, el bloque Pagos por confirmar, un buscador (Código, nombre o teléfono), los filtros de estado (Activos, Pendientes de pago, Por preparar, Por entregar, Entregados, Cancelados y reembolsados y Todos), los selectores de Origen y de Período, y la tabla con las columnas Pedido, Fecha, Comprador, Origen, Pago, Estado y Total. En el celular la tabla pasa a tarjetas.

### Administración: Detalle de pedido

Título con el código del pedido (por ejemplo TN-000123), el estado, el origen, el medio de pago y la fecha. Arriba están los botones WhatsApp, Imprimir ticket y los botones de cambio de estado. Debajo, los bloques Artículos (con Subtotal, Envío y Total), Cobro con Mercado Pago (si el pedido se pagó por ese medio), Comprador y entrega e Historial.

### Administración: Productos

Título Productos con los botones Categorías, Carga masiva y Nuevo producto. Debajo, las pestañas Catálogo, Stock y Buscar por código; el campo Buscar por código o nombre; los filtros Activos, En la tienda, Sin publicar, Publicados sin precio y Dados de baja; y la lista de productos con foto, código, nombre, categoría, cantidad de colores y fotos, precio en bolivianos, precio por docena en dólares y estado.

### Administración: Nuevo o Editar producto

Formulario con los campos Código, Precio por docena (US$), Nombre, Categoría (con la opción de crear una nueva), Descripción, las casillas Marcar como Nuevo y Activo, la sección Tienda online (Precio por unidad en Bs, Dirección en la tienda, Publicado en la tienda y Destacado en el inicio), la sección Fotos y la sección Colores disponibles. Abajo están los botones Crear producto o Guardar cambios, Cancelar y, al editar, Dar de baja o Reactivar.

### Administración: Categorías

Título Categorías. Un campo Nueva categoría con el botón Crear y la lista de categorías con su cantidad de productos y los botones para subir, bajar y renombrar.

### Administración: Carga masiva

Título Carga masiva con dos secciones: Productos desde Excel (con los botones Descargar plantilla y Elegir archivo Excel, la vista previa y el botón Importar) y Fotos en lote (con el botón Elegir fotos).

### Administración: Buscar por código

Título Buscar modelo, con un campo de búsqueda por código (acepta formas como mn5, 5 o MN 05), los últimos modelos vistos y una ficha lateral con foto, precio, colores con stock y descripción.

### Administración: Stock

Título Stock, con el botón Cargar desde Excel, tres tarjetas (Prendas, Stock bajo y Agotados), un buscador, los filtros Todos, Con stock bajo y Con colores agotados, y la lista de productos con su total disponible. Al tocar un producto se abre el panel de inventario con el formulario Registrar movimiento y los últimos movimientos.

### Administración: Cargar stock desde Excel

Título Cargar stock desde Excel, con las instrucciones, los botones Descargar planilla con el stock actual y Elegir archivo Excel, el resumen (a ajustar, sin cambio, con error), la tabla de vista previa y el botón Aplicar ajustes.

### Administración: Gastos

Título Gastos. Un selector de Mes, el formulario Cargar un gasto (Fecha, Monto en Bs, Categoría, Descripción y foto del comprobante), el resumen del mes con el total y las categorías principales, la lista de gastos y, para la administración, las acciones de editar, eliminar y gestionar categorías de gasto.

### Administración: Reportes

Título Reportes con el botón Exportar a Excel, el selector de Período, cuatro tarjetas (Ventas cobradas, Gastos, Margen y Pedidos en el período) y las tablas de ventas por día, por medio de pago, por origen, más vendidos, por categoría y gastos por categoría.

### Administración: Cobros

Título Cobros de Mercado Pago, con el enlace a la guía, el botón Exportar a Excel, los filtros de período, cuatro tarjetas (Precio de los pedidos, Cobrado a las clientas, Descontó Mercado Pago y Neto que llegó), una nota sobre el recargo configurado y la tabla con una fila por cobro.

### Administración: Guía de Mercado Pago

Pantalla de texto con bloques que explican qué descuenta Mercado Pago, los números reales de la tienda, cómo se calcula el recargo, cuándo ajustarlo y un glosario.

### Administración: Usuarios

Título Usuarios internos. Una lista con cada persona, su rol, un selector para cambiarlo y el botón Desactivar o Activar.

### Administración: Configuración

Título Configuración con seis pestañas: Tienda, Moneda, Sitio, Envíos, Pagos y Kiosco. Cada sección tiene su propio botón Guardar.

### Administración: Ayuda

Esta guía resumida dentro del panel, con un índice de temas y las preguntas frecuentes.

## 4. Operación Paso a Paso

Cada sección usa el mismo nombre que en el capítulo anterior.

### Clienta: Inicio

1. Abrí la dirección de la tienda.
2. Tocá Ver catálogo para ir directo a todos los modelos, o tocá una categoría para ver solo ese tipo de prenda.
3. Si buscás algo nuevo, recorré la fila Nuevos ingresos o tocá Ver todo.

### Clienta: Catálogo

1. Para buscar por nombre, escribí en el campo Buscar modelo. La lista se acota a medida que escribís. Para volver a ver todo, tocá el botón de borrar la búsqueda.
2. Para filtrar, tocá una categoría de la lista. Para ver todas, elegí Todos.
3. Para ordenar, abrí el selector Ordenar modelos y elegí Novedades, Menor precio, Mayor precio o Por nombre.
4. Tocá la tarjeta del modelo que te interesa.

### Clienta: Ficha del producto

1. Mirá las fotos y leé la descripción.
2. Elegí un color tocando su muestra. Los colores agotados aparecen marcados y no se pueden elegir. Si el modelo tiene un único color, ya viene elegido.
3. Elegí la cantidad con los botones para sumar o restar. La cantidad nunca puede superar lo disponible de ese color.
4. Tocá Agregar al carrito. Aparece el resumen Agregado al carrito.
5. En esa ventana elegí seguir comprando, para volver al catálogo, o ir al carrito.
6. Si tenés una duda sobre el producto, tocá el botón de consultar por WhatsApp.

### Clienta: Resumen de agregado al carrito

1. Revisá el modelo, el color y la cantidad que aparecen.
2. Tocá la opción de ir al carrito para continuar, o cerrá la ventana para seguir mirando el catálogo. Lo que agregaste queda guardado.

### Clienta: Carrito

1. Revisá cada línea. Para cambiar la cantidad usá los botones de sumar y restar; para sacar una prenda usá el botón de quitar.
2. Si una línea indica que ya no está disponible, quitala para poder continuar.
3. Si la tienda tiene una compra mínima, el carrito te avisa cuánto falta.
4. Leé el aviso sobre el tipo de cambio: si se actualiza mientras tenés el carrito abierto, los pesos se recalculan solos y aparece un aviso con la nueva conversión. Revisá el total.
5. Tocá Finalizar compra.

### Clienta: Finalizar compra

1. En Tus datos completá Nombre y apellido y Teléfono (WhatsApp), con código de país y solo números. Completá también tu Correo para recibir el comprobante.
2. Si usás siempre este dispositivo, marcá Recordar mis datos en este dispositivo para no volver a escribirlos. Se guardan solo en tu navegador.
3. En Entrega elegí Retiro en la tienda o Envío a domicilio. Si elegís envío, seleccioná la ciudad (se ve el costo y el plazo de cada una) y escribí la Dirección y referencia con calle, número, barrio y alguna referencia.
4. En Forma de pago elegí Mercado Pago o Efectivo en el local. Con Mercado Pago el total se muestra en pesos argentinos, e incluye un Recargo por pago en línea que corresponde a la comisión de Mercado Pago. Con efectivo elegís si pagás en bolivianos o en pesos y no se suma ningún recargo.
5. Si querés aclarar algo, escribilo en Nota (opcional).
6. Revisá el resumen y tocá Confirmar pedido.

Si algún campo tiene un error, el formulario te lleva al primer campo con problema y te explica qué corregir, por ejemplo que el teléfono parece incompleto.

### Clienta: Pedido: pagar

1. Después de confirmar, se abre la pantalla de Pedido con el estado Pendiente de pago.
2. Tocá Pagar ahora. Se abre la pantalla de Mercado Pago.
3. Elegí tu medio de pago y completá el pago en Mercado Pago.
4. Al terminar, volvé a la tienda. La pantalla del pedido se actualiza sola en pocos segundos y pasa a Pagado, con el título ¡Gracias por tu compra!.

### Clienta: Pedido: pagar con código QR

1. Desde la computadora, en la pantalla de Pedido, tocá Pagar con código QR desde el celular.
2. Aparece un código. Elegí la opción Con mi app de banco o Mercado Pago.
3. En tu celular abrí la app de Mercado Pago o la de tu banco, buscá la opción de pagar con QR o escanear, y apuntá al código de la pantalla. No lo escanees con la cámara común del celular: ese código solo lo leen las aplicaciones de pago.
4. Si preferís usar la cámara, elegí la opción Con la cámara: el código abre Mercado Pago en el navegador del celular para pagar con tu cuenta o tarjeta.
5. Cuando el pago se acredita, la pantalla del pedido pasa sola a Pagado.

### Clienta: Pedido: si sigue pendiente

1. Si pagaste y la pantalla sigue en Pendiente después de uno o dos minutos, tocá Ya pagué, verificar ahora.
2. Si el pago está acreditado, el pedido pasa a Pagado. Si todavía no se ve, la pantalla te indica que puede demorar unos minutos y que se actualiza sola.
3. Si pasaron los 30 minutos de reserva sin que se complete el pago, el pedido se cancela solo y deberás armar uno nuevo.

### Clienta: Pedido: efectivo en el local

1. Elegiste Efectivo en el local. La pantalla de Pedido te indica el código y el total en la moneda elegida.
2. Pasá por el local dentro del plazo de reserva con tu código de pedido, y pagá en el mostrador.
3. La encargada registra el pago y el pedido pasa a Pagado. Después podés seguir su estado como cualquier otro pedido.

### Clienta: Seguir mi pedido

1. Abrí Seguir mi pedido desde el pie de la tienda, o usá el botón del correo del comprobante, que te lleva directo a tu pedido sin pedirte datos.
2. Si lo hacés a mano, escribí el Código del pedido (por ejemplo TN-000123) y el Teléfono con el que compraste.
3. Tocá Buscar. Se muestra el estado del pedido y su detalle.

### Clienta: Contacto

1. Abrí Contacto desde el menú.
2. Usá el botón de WhatsApp para escribirnos, o el teléfono, la dirección y los horarios para ubicarnos.

### Clienta: Ayuda

1. Abrí Ayuda desde el menú.
2. Usá el índice para saltar al tema que te interesa, y tocá las preguntas frecuentes para ver cada respuesta.

### Administración: Inicio de sesión

1. Abrí la dirección del panel.
2. Escribí tu Correo electrónico y tu Contraseña.
3. Tocá Entrar. Vas a la primera pantalla que corresponde a tu rol.
4. Si aparece Correo o contraseña incorrectos, revisá los datos. Si dice que tu usuario no está habilitado, pedile a la administración que lo active.

### Administración: Inicio

1. Revisá las cifras del día y del mes.
2. En Pagos por confirmar, si hay pagos en efectivo esperando, tocá Confirmar pago en cada fila una vez que cobraste.
3. En Para hacer, tocá un pedido para abrirlo y avanzarlo. La lista está ordenada del más viejo al más nuevo y sugiere la próxima acción.
4. En Por reponer, revisá los modelos con poco stock.

### Administración: Pedidos

1. Para ubicar un pedido, escribí en el buscador su código, el nombre del comprador o su teléfono.
2. Elegí un filtro de estado. Por defecto se ven los Activos.
3. Si hace falta, acotá por Origen (Web o Kiosco) y por Período (Hoy, 7 días, Este mes o Todo).
4. Tocá una fila para abrir el pedido. Si hay más de 50, usá Ver más.
5. Tocá Exportar a Excel para bajar el listado actual.

### Administración: Detalle de pedido

1. Confirmá en el encabezado el estado y el medio de pago.
2. Para avisarle a la clienta, tocá WhatsApp: se abre la conversación con un mensaje armado según el estado.
3. Para imprimir el ticket de 80 mm, tocá Imprimir ticket.
4. Para avanzar el pedido, tocá el botón que corresponde: Confirmar pago (efectivo), Marcar en preparación, Listo para retirar, Marcar como enviado o Marcar como entregado. El sistema muestra un aviso, por ejemplo TN-000123: en preparación.
5. Para cancelar o reembolsar, tocá Cancelar pedido o Reembolsar, escribí el Motivo (obligatorio) y confirmá. Cancelar solo existe mientras el pago está pendiente; Reembolsar devuelve el stock y marca el pago como reembolsado. La devolución del dinero se hace desde la cuenta de Mercado Pago.
6. En Cobro con Mercado Pago controlá lo cobrado, el recargo, lo que descontó Mercado Pago y el neto que llegó.
7. En Historial consultá cada cambio de estado con su motivo.

### Administración: Productos

1. Usá el buscador o las pestañas de filtro para ubicar un producto.
2. Tocá una fila para editarlo (solo roles con permiso de edición) o abrí su ficha de consulta.
3. Tocá Categorías, Carga masiva o Nuevo producto para esas tareas.

### Administración: Nuevo o Editar producto

1. Para crear, tocá Nuevo producto. El Código ya viene con el siguiente libre; podés cambiarlo.
2. Completá Precio por docena (US$), Nombre y Categoría. Si la categoría no existe, escribila en el campo de creación y tocá Crear.
3. Escribí una Descripción si querés y marcá Marcar como Nuevo o Activo según corresponda.
4. En Tienda online escribí el Precio por unidad (Bs). Es el precio que ve la clienta y es obligatorio para publicar.
5. Marcá Publicado en la tienda y, si querés que salga en la portada, Destacado en el inicio. La Dirección en la tienda se genera sola del nombre y el código; solo cambiala si hace falta.
6. En Fotos tocá Agregar fotos. La primera es la principal; con las flechas cambiás el orden y con la papelera quitás una.
7. En Colores disponibles tocá Agregar color o elegí uno de uso común, y escribí el Stock inicial de cada color nuevo.
8. Tocá Crear producto o Guardar cambios. El sistema avisa Producto creado o Cambios guardados.
9. Si hay errores, el formulario te lleva al primer campo marcado. Los mensajes dicen exactamente qué corregir.
10. Para sacar un producto de la tienda sin perder su historial, tocá Dar de baja y confirmá. Para volver a mostrarlo, abrí el producto en el filtro Dados de baja y tocá Reactivar.

### Administración: Categorías

1. Escribí el nombre en Nueva categoría y tocá Crear.
2. Para ordenar, usá los botones de subir y bajar: ese orden es el que ve la clienta.
3. Para cambiar un nombre, tocá el lápiz, editá y tocá Guardar.
4. Las categorías no se eliminan.

### Administración: Carga masiva

1. En Productos desde Excel, tocá Descargar plantilla y completala con código, nombre, categoría, precio por docena en dólares, precio por unidad en bolivianos, publicado (si o no) y colores separados por coma.
2. Tocá Elegir archivo Excel y seleccioná tu planilla.
3. Revisá la vista previa: cuántos se crean, cuántos se actualizan y cuáles tienen error, con el motivo de cada fila.
4. Tocá Importar. Las filas con error no se importan: corregilas en el Excel y volvé a subirlo.
5. En Fotos en lote, nombrá cada foto con el código del producto y un número (por ejemplo MN-005_1.jpg), tocá Elegir fotos y revisá el resultado. Las fotos reemplazan a las que ya tenía el producto.

### Administración: Buscar por código

1. Escribí el código en el campo; también sirve una parte del nombre.
2. Tocá el resultado para ver su ficha lateral con colores y stock.
3. Si tenés permiso de edición, el botón Administrar te lleva a Productos.

### Administración: Stock

1. Revisá las tarjetas Prendas, Stock bajo y Agotados. Estas dos cuentan colores, no productos.
2. Usá el buscador o los filtros para ubicar un producto y tocalo.
3. En el panel, elegí el color y el tipo: Entrada (llegó mercadería), Salida (merma o pérdida) o Ajuste (conteo real).
4. Escribí la cantidad (en Ajuste, el total que hay de verdad) y el motivo, obligatorio en Salida y Ajuste.
5. Tocá Registrar. El movimiento queda en Últimos movimientos.

### Administración: Cargar stock desde Excel

1. Tocá Descargar planilla con el stock actual.
2. Corregí la columna unidades con el conteo real y guardá el archivo.
3. Tocá Elegir archivo Excel y subilo.
4. Revisá la vista previa y tocá Aplicar ajustes. Cada diferencia queda registrada como ajuste con su historial.

### Administración: Gastos

1. Elegí la Fecha (por defecto hoy) y escribí el Monto en bolivianos.
2. Elegí la Categoría y, si querés, una Descripción.
3. Para adjuntar el comprobante tocá Foto del comprobante (en el celular abre la cámara).
4. Tocá Cargar gasto. Aparece el aviso Gasto cargado.
5. Después de cargar, el formulario conserva los datos escritos: antes de volver a cargar, revisalos para no duplicar el gasto.
6. La administración puede editar un gasto con el lápiz, eliminarlo con la papelera y crear categorías en Categorías de gasto.

### Administración: Reportes

1. Elegí el Período: Hoy, 7 días, Este mes o Elegir fechas, que habilita los campos Desde y Hasta.
2. Leé las cuatro tarjetas y las tablas.
3. Tocá Exportar a Excel para bajar todas las tablas.

### Administración: Cobros

1. Elegí el período (Hoy, 7 días, Este mes o Todo).
2. Mirá las cuatro tarjetas: lo que valen los pedidos, lo que se cobró a las clientas, lo que descontó Mercado Pago y el neto que llegó.
3. Leé la nota debajo: indica si el recargo configurado está bien ajustado, corto o alto.
4. Tocá un código de pedido de la tabla para abrir ese pedido.
5. Tocá Exportar a Excel para llevarlo a tu contabilidad.

### Administración: Guía de Mercado Pago

1. Abrila desde Cobros, desde Configuración en la pestaña Pagos o desde un pedido pagado.
2. Leé las secciones en orden: qué descuenta Mercado Pago, los números de tu tienda, cómo se calcula el recargo y cuándo ajustarlo.

### Administración: Usuarios

1. Abrí Usuarios.
2. Para cambiar el rol de una persona, abrí su selector de rol y elegí el nuevo. El sistema avisa Usuario actualizado.
3. Para quitarle el acceso, tocá Desactivar. Para devolvérselo, tocá Activar.
4. No podés quitarte el acceso a vos misma.
5. Para dar de alta a alguien nuevo, pedíselo al equipo técnico.

### Administración: Configuración

Pestaña Tienda:
1. Escribí el Nombre del negocio (obligatorio).
2. Tocá Subir logo para cambiarlo.
3. Cargá el WhatsApp de la tienda con código de país, solo números.
4. Definí desde cuántas unidades se avisa Stock bajo.
5. Tocá Guardar.

Pestaña Moneda:
1. Escribí la conversión como Bolivianos (Bs) y Pesos argentinos (ARS). Por ejemplo 5 y 1 significa 5 bolivianos igual a 1 peso.
2. Mirá el resultado y los ejemplos que muestra la pantalla.
3. Si querés, escribí el motivo del cambio.
4. Si el cambio supera el 25 por ciento o deja al boliviano por debajo de 1 peso, marcá la casilla de confirmación.
5. Tocá Guardar. El sitio se actualiza solo en unos 20 segundos.

Pestaña Sitio:
1. En Sitio público, editá el lema, el título y la bajada de la portada, la foto de portada, Quiénes somos, los tres pasos de Cómo comprar, la dirección, la ciudad, el enlace al mapa, el teléfono, las redes y los horarios.
2. Tocá Guardar en esa sección.
3. En Textos legales, editá Términos de compra, Envíos y cambios y Privacidad, y tocá Guardar en esa sección. Si un texto empieza con la palabra BORRADOR, el sitio lo avisa.

Pestaña Envíos:
1. Marcá o desmarcá Retiro en la tienda.
2. En Ciudades de envío, completá Ciudad, Costo Bs y Plazo, y tocá Agregar ciudad para sumar más.
3. Si querés una Compra mínima, escribí el monto en bolivianos.
4. Tocá Guardar. Tiene que quedar habilitado al menos el retiro o una ciudad.

Pestaña Pagos:
1. En Pago en línea elegí Mercado Pago.
2. En Recargo por pago con Mercado Pago o QR escribí el porcentaje (de 0 a 50). Con 0 no se suma recargo.
3. Cargá los datos de transferencia: Banco, Titular, Número de cuenta e Imagen del QR.
4. Tocá Guardar.

Pestaña Kiosco:
1. Escribí los segundos de inactividad antes de volver al inicio (mínimo 30).
2. Escribí el texto al pie del ticket.
3. Definí el PIN de activación (4 a 8 dígitos) y, si hace falta, la dirección del agente de impresión.
4. Tocá Guardar. Si el equipo está activado, el enlace Desactivar actúa al instante, sin necesidad de guardar.

### Administración: Ayuda

1. Tocá Ayuda en la parte de arriba del panel.
2. Usá el índice para ir al tema y tocá cada pregunta frecuente para leer su respuesta.

## 5. Lógica del Sistema

Esta sección explica, sin términos técnicos, qué hace el sistema desde que la clienta elige una prenda hasta que el pedido se entrega y se contabiliza.

```text
Fase,Descripción Técnica,Efecto Visual
Elección de productos,El carrito se guarda en el dispositivo con la prenda y la cantidad; los precios se calculan siempre con la conversión vigente,La clienta ve el total en bolivianos y en pesos actualizado
Reserva de stock,Al confirmar el pedido las unidades quedan reservadas durante un plazo,Nadie más puede comprar esas unidades mientras el pedido está pendiente
Conversión de moneda,Los precios se guardan en bolivianos y los pesos se calculan con la conversión que define la administración; cada pedido conserva la suya,Un cambio en Moneda se refleja en el sitio en unos 20 segundos y el carrito avisa
Cobro con Mercado Pago,El sistema crea el cobro por el total más el recargo configurado y lo envía a Mercado Pago,La clienta paga en la pantalla de Mercado Pago
Recargo por pago en línea,Se suma un porcentaje al precio para cubrir la comisión de Mercado Pago,Línea separada en el resumen y en el comprobante
Confirmación del pago,Mercado Pago avisa a la tienda y la tienda verifica con Mercado Pago el monto y la moneda,El pedido pasa solo a Pagado en segundos
Verificación de respaldo,La pantalla del pedido consulta cada pocos segundos y hay una revisión programada de pedidos pendientes,Un aviso demorado no deja pagos sin registrar
Descuento de stock,Al confirmar el pago las unidades reservadas se convierten en venta,Baja la disponibilidad del producto en la tienda
Registro de lo cobrado,El sistema guarda lo cobrado el recargo la comisión las retenciones y el neto de cada pago,Bloque Cobro con Mercado Pago y pantalla Cobros
Comprobante,Se genera un correo con el detalle y un PDF adjunto y se envía a la clienta,Correo con número de comprobante CP y botón Seguir mi pedido
Pago en efectivo,La encargada confirma el cobro manualmente en el pedido o en Pagos por confirmar,El pedido pasa a Pagado y se descuenta el stock
Seguimiento,El pedido cambia de estado cuando el negocio lo prepara y entrega,La clienta ve el estado y recibe avisos por WhatsApp
Vencimiento de reservas,Si el pedido no se paga dentro del plazo se cancela y las unidades se liberan,El pedido figura como Cancelado
Sincronización,El panel guarda una copia local y envía los cambios al servidor cuando hay conexión,Indicador de conexión y contador de cambios por enviar
```

Plazos de reserva: 30 minutos para pagos con Mercado Pago y 12 horas para pagos en efectivo en el local. El recargo por pago en línea es un porcentaje que la administración define; existe porque Mercado Pago descuenta una comisión y retenciones de impuestos por cada cobro, y no se aplica al efectivo.

## 6. Gestión de Resultados

### Clienta: qué recibe al comprar

- La pantalla de Pedido con el mensaje ¡Gracias por tu compra! y el detalle de lo que compró.
- Un correo con el asunto Pago confirmado y el número de pedido, enviado al correo que escribió.
- Un PDF adjunto (comprobante-CP-000123.pdf, por ejemplo) con el logo, el detalle de artículos, los totales con el recargo si corresponde, el tipo de cambio y los datos del comprobante: número de comprobante, pedido, fecha y hora, medio de pago e identificador de la operación.

El correo cierra con el botón Seguir mi pedido y la aclaración de que es un comprobante de pago y no una factura. Conviene guardar el correo y el PDF como constancia de compra.

### Administración: archivos y registros

```text
Origen,Nombre del archivo,Contenido
Pedidos,pedidos-AAAA-MM-DD.xlsx,Hojas Pedidos y Artículos con el listado filtrado actual
Carga masiva,plantilla-productos.xlsx,Plantilla para cargar productos
Stock,stock-actual.xlsx,Planilla con el stock actual por producto y color
Reportes,reportes-DESDE-HASTA.xlsx,Ventas por día; medio de pago; origen; más vendidos; categorías; gastos
Cobros,cobros-mercado-pago-AAAA-MM-DD.xlsx,Cada cobro con precio; cobrado; recargo; comisión; retenciones y neto
```

Los archivos se descargan en la carpeta de descargas del navegador. El ticket de pedido se imprime desde el detalle del pedido en formato de 80 mm. El historial de cada pedido y de cada movimiento de stock queda registrado con fecha, persona y motivo.

## 7. Copias de Seguridad y Datos Técnicos Básicos

### Dónde viven los datos

Los datos de la tienda (pedidos, productos, stock, gastos, usuarios y ajustes) se guardan en la base de datos del servicio contratado, administrada por el equipo técnico: esa base es la fuente de verdad. Los pedidos de la clienta no dependen de su dispositivo y no se pierden si cambia de celular o borra el navegador: los recupera con el enlace del correo o con su código de pedido y su teléfono.

Cada dispositivo guarda además una copia local temporal en el navegador: el carrito, los códigos de pedidos hechos desde ese dispositivo, los datos de contacto si se marcó Recordar mis datos en este dispositivo, y una copia del catálogo para abrir rápido.

### Clienta: cómo borrar los datos del dispositivo

En un dispositivo compartido, desde los ajustes del navegador se eligen borrar los datos del sitio. Esto vacía el carrito y olvida los datos y pedidos recordados en ese dispositivo; los pedidos siguen existiendo y se recuperan con el código y el teléfono. No hace falta hacer copias de seguridad de la tienda: solo conviene conservar el correo del comprobante.

### Administración: respaldos recomendados

La base de datos tiene sus propias copias de seguridad en el servicio; la frecuencia depende del plan y la verifica el equipo técnico. Además, la administración puede descargar periódicamente a Excel: Pedidos, Reportes y Cobros (una vez por mes), el Stock actual (Cargar desde Excel, Descargar planilla) y, como referencia del catálogo, la planilla de la Carga masiva. Conviene guardarlos en una carpeta del negocio con el mes en el nombre.

La restauración de la base la hace el equipo técnico desde las copias del servicio. Un Excel de respaldo sirve para consulta y, en productos y stock, para volver a cargar datos con la Carga masiva y con Cargar stock desde Excel.

Al tocar Salir en el panel, el sistema borra los datos locales del dispositivo después de verificar que no haya cambios sin enviar. Si hay cambios pendientes no deja salir: hay que conectarse a internet y esperar a que se envíen.

## 8. Guía de Solución de Dudas

```text
Problema,Causa Probable,Solución
Clienta: Pagué y el pedido sigue en Pendiente,El aviso de Mercado Pago todavía no llegó,Tocá Ya pagué verificar ahora; si no cambia en unos minutos escribinos por WhatsApp con tu código de pedido
Clienta: No me llegó el correo del comprobante,Está en Spam o Promociones o no escribiste el correo,Revisá esas carpetas; si no está escribinos con tu código y te lo reenviamos
Clienta: Mercado Pago me rechazó el pago,Fondos insuficientes o la tarjeta no autorizó la operación,No se te cobró nada; reintentá con otra tarjeta u otro medio mientras el pedido siga reservado
Clienta: Me aparece el botón de pagar deshabilitado o gris,Estás logueada en Mercado Pago con la misma cuenta que cobra la tienda,Pagá con otra cuenta o con una tarjeta de otra persona
Clienta: El total es mayor que la suma de los precios,Se suma el recargo por pago en línea de Mercado Pago,Revisá la línea Recargo por pago en línea en el resumen; con efectivo en el local no se suma
Clienta: Aparece un aviso de que el tipo de cambio se actualizó,La tienda cambió la conversión mientras comprabas,Revisá el nuevo total y confirmá de nuevo
Clienta: Una prenda dice Sin stock,Se agotó ese color,Elegí otro color o consultá por WhatsApp si volverá a ingresar
Clienta: El carrito dice que un artículo ya no está disponible,Alguien compró las últimas unidades o la prenda se dio de baja,Quitá ese artículo para poder continuar
Clienta: No encuentro mi pedido en Seguir mi pedido,El código o el teléfono están mal escritos,Revisá que el código tenga el formato TN seguido de seis números y que el teléfono sea el que usaste al comprar
Clienta: El pedido apareció como Cancelado,No se pagó dentro del plazo de reserva,Armá un nuevo pedido; si pagaste y igual se canceló escribinos con el comprobante de Mercado Pago
Clienta: El código QR no funciona con la cámara,El código de pago solo lo leen las aplicaciones de pago,Usá la app de Mercado Pago o de tu banco o elegí la opción Con la cámara
Clienta: La página muestra datos viejos,El navegador guardó una versión anterior,Cerrá y volvé a abrir la página o recargala
Clienta: No puedo ver el botón de pagar con QR,Estás en el celular,El código QR se ofrece en la computadora; desde el celular usá Pagar ahora
Administración: No puedo entrar al panel,Correo o contraseña incorrectos o usuario desactivado,Verificá el correo; pedí a la administración que revise tu usuario y tu contraseña
Administración: Dice que para entrar la primera vez hace falta internet,El dispositivo todavía no tiene datos guardados,Conectate a internet e ingresá de nuevo
Administración: Un producto no aparece en la tienda,No está activo ni publicado o falta el precio en Bs o los colores o el stock,Abrí el producto y revisá Activo; Publicado en la tienda; Precio por unidad en Bs y los colores con stock
Administración: Un pedido de Mercado Pago sigue en Pendiente,El aviso de Mercado Pago todavía no llegó,Abrilo (la pantalla consulta sola); si la clienta pagó que toque Ya pagué verificar ahora o buscá la operación en Cobros
Administración: Un pedido en efectivo sigue en Pendiente,Falta que la encargada confirme el cobro,Tocá Confirmar pago en Pagos por confirmar o en el detalle del pedido
Administración: El total cobrado es mayor que el precio,Se suma el recargo por pago en línea,Mirá el bloque Cobro con Mercado Pago del pedido y la Guía de Mercado Pago
Administración: Llegó menos plata que el precio del pedido,El descuento real de Mercado Pago fue mayor que el recargo,Revisá Cobros: la nota indica a qué porcentaje conviene subir el recargo
Administración: No veo Reportes Cobros Usuarios o Configuración,Son pantallas solo de la Administradora,Pedí el acceso o que lo consulten con la administración
Administración: No puedo cancelar ni reembolsar un pedido,Solo la Administradora puede hacerlo,Pedíselo a la administración
Administración: No puedo salir del panel,Hay cambios sin enviar,Conectate a internet y esperá a que el contador de cambios por enviar llegue a cero
Administración: El panel muestra datos viejos,El navegador guardó una versión anterior,Cerrá y volvé a abrir la pestaña; aparece un aviso cuando hay una versión nueva
Administración: Se cambió la conversión y el sitio muestra el valor viejo,El sitio se actualiza cada unos 20 segundos,Esperá y recargá la página de la tienda
Administración: La carga masiva rechaza filas,Código repetido; falta nombre o precio; precio con formato inválido,Corregí las filas indicadas en el Excel y volvé a subirlo
Administración: Un gasto aparece duplicado,El formulario conserva los datos después de cargar,Eliminá el duplicado con la papelera y revisá el formulario antes de cargar otro
Administración: No me deja registrar una salida de stock,La cantidad supera lo que hay de ese color,Revisá el stock disponible; para corregir el conteo usá Ajuste
```

## 9. Consejos de Eficiencia

### Clienta: consejos

- Escribí tu correo real al comprar: es el único modo de recibir el comprobante y el enlace para seguir tu pedido.
- Usá la opción Recordar mis datos en este dispositivo si comprás seguido desde tu propio celular, y no la uses en un dispositivo compartido.
- Guardá el correo del comprobante. Su botón Seguir mi pedido abre tu pedido desde cualquier dispositivo, sin pedirte datos.
- Si comprás varias prendas, agregalas todas al carrito antes de finalizar: se reserva todo junto y el pago es uno solo.
- Pagá dentro de los 30 minutos de reserva. Si necesitás más tiempo, elegí efectivo en el local, que reserva el pedido por más horas.
- Antes de pagar, revisá el total en la moneda que corresponda: con Mercado Pago se cobra en pesos argentinos.
- Si la tienda cambia la conversión mientras comprás, no te preocupes: el sitio te avisa y recalcula; solo revisá el nuevo total antes de confirmar.
- Ante cualquier consulta, escribinos por WhatsApp con tu código de pedido (por ejemplo TN-000123): con ese dato encontramos tu compra en segundos.
- Para que los envíos lleguen bien, escribí una dirección completa, con calle, número, barrio y una referencia cercana.

### Administración: consejos

- Empezá el día por el Inicio: confirmá los pagos en efectivo pendientes y recorré Para hacer en orden, del más viejo al más nuevo.
- Contraé el menú lateral con el botón de arriba para ganar ancho en las tablas.
- Revisá Cobros una vez por mes. La nota del resumen te dice si el recargo está bien ajustado; ajustalo en Configuración, pestaña Pagos, con los números reales.
- Antes de publicar un producto, cargá siempre foto, colores con stock y el precio por unidad en bolivianos: así aparece completo en la tienda.
- Para cargar muchos productos o corregir muchos precios, usá la Carga masiva en lugar de editar uno por uno.
- Usá Ajuste (con el conteo real) para corregir diferencias de stock, y anotá el motivo: queda en el historial.
- Al cambiar la conversión de moneda, escribí el motivo: queda registrado junto a las versiones anteriores.
- Cuando una clienta consulte por un pedido, buscalo por su código o por su teléfono y usá el botón WhatsApp del detalle: ya trae el mensaje armado según el estado.
- Cerrá siempre la sesión con Salir en equipos compartidos.
- Pedí al equipo técnico revisar periódicamente la copia de seguridad de la base de datos, y guardá tus propios Excel de pedidos, reportes y cobros cada mes.
