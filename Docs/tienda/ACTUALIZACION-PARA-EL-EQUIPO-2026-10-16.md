# Modas Naty · Tienda online: actualización final

**Fecha:** 16 de octubre de 2026
**De:** Facundo Lazarte, Área de Innovación y Desarrollo, Escencial Consultora
**Para:** equipo de Modas Naty y Renzo

La tienda online de Modas Naty ya está terminada y conectada al sistema de notas y stock. A partir de ahora las dos cosas viven en el mismo lugar: la tienda que ven las clientas en la dirección principal, y el sistema del equipo en la misma dirección seguida de `/admin`.

- **Tienda para las clientas:** https://modasnaty.onelabs.pro
- **Sistema del equipo (ventas y stock):** https://modasnaty.onelabs.pro/admin
- La dirección anterior del sistema, https://modas-naty.netlify.app/admin, sigue funcionando.

Abajo va primero la lista de todo lo que se hizo, y después la explicación de cada punto.

## 1. Checklist de lo que se hizo

- [x] Tienda pública con catálogo, ficha de cada modelo y pedido por WhatsApp.
- [x] Precios por docena y media docena en dólares, pesos argentinos y bolivianos, con la cotización del día.
- [x] Página del pedido completa: fotos, cantidades, vendedor, forma de pago, retiro o entrega, datos de la cuenta para transferir y envío por WhatsApp.
- [x] Páginas Quiénes somos, Contacto (con mapa de cada local) y Ayuda (cómo comprar y preguntas frecuentes).
- [x] Gestor web dentro de Ajustes, para administrar todo lo que ve la clienta sin tocar código.
- [x] Cuenta de transferencia con fecha de cambio y aviso automático.
- [x] Vendedores que se toman solos de Usuarios.
- [x] Textos de todas las páginas editables, organizados con los mismos nombres que ve la clienta.
- [x] El sistema de ventas y stock pasa a `/admin`, con el logo real y mejoras de uso.
- [x] Base de datos: objetos nuevos solo para la tienda, sin tocar nada de lo que ya existía, con respaldo previo.
- [x] Pantalla automática de "Estamos preparando la tienda" para los momentos de mantenimiento.
- [x] Pruebas automáticas, revisión de seguridad y auditoría del manejo de la información.

## 2. Explicación de cada punto

### 2.1 Tienda pública con catálogo, ficha y pedido por WhatsApp

La clienta entra, recorre el catálogo por categorías, busca por código o nombre y abre cada modelo para ver sus fotos y su precio por docena y por media docena. El catálogo muestra 24 modelos por página y los modelos que el equipo marca como nuevos salen primero. Desde la ficha agrega el modelo a su pedido eligiendo docena o media docena. Al agregar, la foto "vuela" hasta la bolsita del menú y aparece un aviso con el botón "Ver pedido". La tienda no cobra ni reserva: el pedido le llega al vendedor por WhatsApp y es el vendedor quien confirma disponibilidad y precio final.

### 2.2 Precios en tres monedas con la cotización del día

Los precios se cargan una sola vez, en dólares por docena, desde el sistema. La tienda los muestra también en pesos argentinos y en bolivianos usando la cotización que la administración carga en Ajustes, y aclara de qué día es esa cotización. Si la cotización está en valores de ejemplo o falta, la tienda muestra solo dólares para no inducir a error. El precio de la media docena se calcula igual que en la nota de venta, así nunca hay diferencia entre lo que ve la clienta y lo que cobra el equipo.

### 2.3 Página del pedido

Muestra cada modelo con su foto, código, precio por docena, cantidad en docenas y prendas, y subtotal. A la derecha va el resumen fijo: total estimado con selector de moneda, el vendedor con quien va a hablar, la forma de pago (transferencia o efectivo en el local), si retira por un local o quiere recibirlo, y el botón "Enviar pedido por WhatsApp". Si elige transferencia, ve la cuenta completa con botones para copiar el CBU, el alias y el número de cuenta, y el importe estimado en pesos argentinos. También puede copiar el pedido completo como texto. El mensaje de WhatsApp nunca se recorta: si el pedido es largo, se manda un mensaje breve y la clienta pega el detalle completo.

### 2.4 Quiénes somos, Contacto y Ayuda

Quiénes somos presenta el negocio, qué ofrece, cómo se trabaja en cuatro pasos y qué lo distingue, y termina con el mapa de los locales. Contacto tiene el WhatsApp de la tienda, cada vendedor con su botón para escribirle, y cada local con su mapa, dirección, horario y botón "Cómo llegar" que abre Google Maps. Ayuda explica cómo comprar paso a paso y tiene catorce preguntas frecuentes agrupadas por tema, con buscador. Todo lo que el negocio todavía no definió (envíos, cambios) remite al vendedor en lugar de inventar una política.

### 2.5 Gestor web dentro de Ajustes

En el sistema, en Ajustes, la administración (admin y superadmin) tiene dos pestañas: "Ajustes generales", que es lo de siempre, y "Gestor web", con todo lo que ve la clienta. El Gestor web tiene seis secciones: Configuración global (qué cuenta está conectada, qué cotización se usa, qué contacto, qué direcciones, y los avisos que necesitan atención), Cuenta, Contacto y locales, Textos, Modelos (qué modelos se muestran en la tienda, sin borrarlos del sistema) y Direcciones (las direcciones web, para copiar y abrir).

### 2.6 Cuenta de transferencia con aviso de cambio

La cuenta se carga una sola vez en el Gestor web, con la moneda en que transfiere la clienta y, si se quiere, la fecha en la que toca cambiarla. Una semana antes de esa fecha aparece un aviso en el Gestor; pasada la fecha, la tienda le pide a la clienta que confirme los datos con su vendedor antes de transferir. Sin fecha cargada, el aviso se basa en la antigüedad: a los 50 días avisa, a los 60 pide confirmación. La copia que guarda el navegador de la clienta vence a la hora, así nunca ve una cuenta vieja.

### 2.7 Vendedores automáticos

La tienda no tiene una lista propia de vendedores. Toma a las personas que en Usuarios tienen rol "Vendedor/a", están activas y tienen teléfono cargado. Son las que aparecen en Contacto y entre las que la clienta elige al armar el pedido. Si alguien no tiene teléfono, no aparece; el Gestor web lo avisa. Solo se publican el nombre y el teléfono, que ya salen impresos en la nota de venta.

### 2.8 Textos editables

En Gestor web, pestaña Textos, hay una tarjeta por página de la tienda (Inicio, Catálogo, Quiénes somos, Contacto, Ayuda, Tu pedido y Pie de página). Dentro de cada una, las secciones se llaman igual que en la tienda, así se entiende qué se está cambiando. Todos los textos vienen prellenados con lo que se ve hoy. Si se borra un texto y se guarda, vuelve el original.

### 2.9 El sistema pasa a /admin, con mejoras

El sistema de ventas y stock funciona exactamente igual, solo que ahora vive en `/admin`. Se le puso el logo real de Modas Naty en el ingreso y en el menú, un ícono por rol en lugar de las iniciales, el menú lateral se puede minimizar, y el indicador de conexión quedó más discreto. Ninguna pantalla de ventas, stock, comisiones o usuarios cambió su funcionamiento.

### 2.10 Base de datos: sin tocar lo existente

Todo lo nuevo en la base de datos tiene nombre propio de la tienda: dos tablas (configuración de la tienda y modelos ocultos) y tres vistas públicas (catálogo, ajustes y vendedores). Las vistas exponen solo lo necesario: no muestran stock, costos, clientas, ventas ni usuarios. No se modificó ninguna tabla, función ni permiso del sistema existente, y antes de aplicar se hizo un respaldo completo de las tablas. El procedimiento de aplicación prueba primero y revierte solo si detecta cualquier cambio fuera de lo previsto.

### 2.11 Pantalla de "Estamos preparando la tienda"

Si en algún momento la tienda está cerrada al público, la clienta ve una pantalla con el logo, el WhatsApp y los locales, en vez de un error. El sistema del equipo no se ve afectado nunca: funciona sin conexión y guarda las ventas en el celular hasta que vuelve la señal.

### 2.12 Pruebas, seguridad y auditoría

El proyecto tiene más de 240 pruebas automáticas que corren sobre una copia real de la estructura de la base, incluyendo la comprobación de que la tienda no cambia nada del sistema. Se hizo una revisión de seguridad cruzada con una segunda inteligencia artificial y una auditoría del manejo de la información (qué dato se ve, dónde vive y quién lo puede cambiar). No hay claves ni datos sensibles en el código.

## 3. Qué necesitamos de ustedes

1. **Celulares con la app instalada:** abrirla una vez con internet y tocar "Actualizar" cuando lo pida. A partir de ahí la app abre directamente en `/admin`.
2. **Usuarios:** cargar el teléfono de cada vendedor o vendedora, con código de país y sin espacios (ejemplo: 59171234567). Sin teléfono no aparece en la tienda.
3. **Ajustes, Gestor web, Cuenta:** poner la fecha en la que toca cambiar la cuenta, para recibir el aviso a tiempo.
4. **Ajustes, Gestor web, Contacto y locales:** revisar la ubicación de cada local en el mapa (hoy está aproximada) y pegar el enlace de Google Maps si lo tienen.
5. **Ajustes, Gestor web, Textos:** leer los textos de Quiénes somos y Ayuda y ajustarlos con sus palabras si quieren.
6. **Ajustes generales:** confirmar que la dirección del catálogo para el QR sea https://modasnaty.onelabs.pro/ y que "Mostrar precios en el catálogo público" esté activado.

## 4. Soporte

Cualquier duda o ajuste: Facundo Lazarte, Escencial Consultora.
