# Tu catálogo online: qué tenés que cargar y dónde

Esta guía es para vos y para quien te ayude en la tienda. No hace falta saber de computación.
Todo se carga en **Ajustes**, dentro del sistema de notas (`modasnaty-tienda.onelabs.pro/admin`). Solo la administración puede cambiar estos datos.

## Antes de publicar: lo que tenemos que juntar

Mandanos estos datos por WhatsApp. Sin ellos la tienda sale, pero con partes vacías.

| Dato | Para qué sirve |
|---|---|
| Titular, CUIT o CUIL, banco, CBU, alias y número de cuenta | Que la clienta sepa a dónde transferir. **Ya llegaron**, falta el banco |
| Nombre y WhatsApp de cada vendedor y de las encargadas | Que la clienta elija con quién hablar. **Cada persona tiene que estar de acuerdo en que su número se publique** |
| Dirección de los dos locales | La clienta ve dónde estás |
| Horarios (por ejemplo, lunes a sábado de tal hora a tal hora) | Idem |
| El enlace de Google Maps de cada local | Para que el botón "Cómo llegar" funcione |
| Cómo se llega a pie desde la chalana | Para quien cruza de Argentina |
| Cómo querés escribir los pasos de "Cómo comprar" | Si no, usamos unos por defecto |
| Si querés mostrar los precios o que digan "a consultar" | Hoy están ocultos |
| El WhatsApp principal de la tienda | Aparece arriba en el catálogo |

## Cómo cargarlos

Entrá a **Ajustes**. Vas a encontrar estas tarjetas:

1. **Catálogo y código QR**: la dirección de la tienda (`https://modasnaty-tienda.onelabs.pro/`), el WhatsApp de la tienda y la casilla "Mostrar precios en el catálogo público". Esa dirección es la que sale como QR en cada nota.
2. **Tienda online · vendedores y contactos**: nombre y WhatsApp, con código de país y solo números (por ejemplo `59171234567`).
3. **Ajustes → Gestor web → Cuenta**: banco, titular, cuenta y alias.
4. **Ajustes → Gestor web → Contacto y locales, y Textos**: cada local con su dirección, su horario, cómo llegar y el enlace de Google Maps. Hay un campo de horario general por si alguna vez hace falta.
5. **Tienda online · modelos visibles**: tildá o destildá cada modelo para que se vea o no en la tienda.

Cada tarjeta tiene su botón **Guardar**. Los cambios se ven en la tienda enseguida.

## La cuenta cambia cada 2 meses

La cuenta de transferencia se cambia cada dos meses, y cuando cambia puede cambiar **todo**: el alias, el CBU, la cuenta y hasta el titular. Cada vez que cambie:

1. Entrá a **Ajustes** y buscá la tarjeta **Tienda online · datos de transferencia**.
2. Reemplazá los datos que cambiaron: titular, CUIT o CUIL, banco, CBU, alias y número de cuenta.
3. Tocá **Guardar**.

Solo la administración (admin o superadmin) puede hacerlo, desde Ajustes, pestaña «Gestor web». Para que no se pase por alto, el sistema te ayuda de dos formas:

- A los 50 días de la última vez que lo guardaste, la tarjeta te muestra un aviso para que lo revises.
- Si pasan 60 días, la tienda le dice a la clienta "la cuenta cambia cada tanto: antes de transferir, confirmá estos datos con tu vendedor".

**Importante:** si la cuenta cambió y todavía no se actualizó acá, un cliente puede transferir a una cuenta vieja. Por eso conviene cargar la cuenta nueva el mismo día que se estrena.

## Precios en dólares y en pesos

Los precios se cargan en **dólares** y la tienda los convierte con la cotización del día que está en **Ajustes > Tipo de cambio**. La clienta ve el dólar, los pesos argentinos y los bolivianos, y la fecha de la cotización.

Para cambiar la cotización: Ajustes, tarjeta **Tipo de cambio**, escribí cuántos pesos y cuántos bolivianos vale 1 US$ y guardá. Se actualiza en toda la tienda.

## Preguntas que van a surgir

**¿Cómo agrego un modelo nuevo a la tienda?**
Lo cargás en Inventario como siempre. Si está activo y tiene al menos una foto, aparece solo.

**¿Un modelo sin foto se ve?**
No. La tienda solo muestra modelos con foto.

**¿Qué pasa si destildo un modelo en «modelos visibles»?**
Deja de verse en la tienda. Sigue en tu inventario y en las notas de venta. Lo podés volver a mostrar cuando quieras.

**¿Cuándo cambia el precio en pesos y bolivianos?**
Cuando cambiás la cotización en Ajustes. Los precios se guardan en dólares y todo lo demás se calcula con la cotización del día.

**¿La clienta compra y paga desde la tienda?**
No. Arma su pedido y se lo manda al vendedor por WhatsApp con todo el detalle. El vendedor confirma disponibilidad y precio final, y la clienta transfiere o paga en efectivo en el local. Enviar el pedido no reserva ni cobra nada. No hay pago con tarjeta ni Mercado Pago.

**¿Veo los pedidos en algún lado?**
Por ahora llegan por WhatsApp al vendedor. No se guardan en el sistema.

## Si algo no anda

- **La tienda dice "El catálogo no está disponible":** probablemente no hay internet. Probá de nuevo en unos minutos.
- **No aparece un modelo:** revisá que esté activo, que tenga foto y que esté tildado en «modelos visibles».
- **Los precios dicen "a consultar":** la casilla "Mostrar precios en el catálogo público" está destildada, o el tipo de cambio todavía es de ejemplo.

## Los textos de la tienda

Todo lo que se lee en la tienda se cambia en Ajustes → Gestor web → **Textos**. Hay una tarjeta por página (Inicio, Catálogo, Quiénes somos, Contacto, Ayuda, Tu pedido, Pie de página) y adentro cada sección se llama igual que en la tienda, así sabés qué estás cambiando. Si borrás un texto y guardás, vuelve el original.

## Los vendedores que ve la clienta

No se cargan en la tienda: salen de **Usuarios**. Toda persona con rol «Vendedor/a», activa y con su teléfono cargado aparece en «Contacto» y entre las opciones al armar el pedido. Si alguien no tiene que aparecer, sacale el teléfono o desactivalo en Usuarios.
