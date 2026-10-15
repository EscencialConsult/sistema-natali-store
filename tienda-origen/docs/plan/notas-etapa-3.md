# Notas de cierre — Etapa 3: Carrito y checkout (2026-10-09)

Verificación: lint sin avisos · build OK · 69 pruebas en 11 archivos · axe (WCAG 2.1 A/AA + 2.2 AA) en carrito, checkout, pedido y seguimiento: 0 infracciones · **flujo completo en el navegador a 390 px**: agregar Blazer Fucsia → carrito (Bs 150) → checkout con validación (campos vacíos marcan error y mensaje) → envío a Bermejo (provisorio, Bs 15) → pedido `TN-000001` por Bs 165, carrito vacío → "Pagar ahora" (simulado) → estado Pagado, "Recibimos tu pago. Estamos preparando el envío." → un código ajeno redirige a seguimiento → seguimiento con `tn-000001` + `591 7123-4567` encuentra el pedido. Capturas en `../capturas/etapa-3/`.

## Qué quedó hecho
- **3.1** `useCarrito`: carrito del dispositivo armado con producto, color, precio actual y stock en vivo; detecta `sin_producto`, `sin_color`, `sin_stock`, `cantidad_mayor` (esta última se corrige sola con aviso). `lib/carrito.js` con totales e ítems para el pedido, con pruebas.
- **3.2** `/carrito`: líneas con cantidad editable y quitar; avisos por línea; resumen con subtotal, "envío se calcula al finalizar", mínimo de compra; único botón primario "Finalizar compra"; vacío con "Ver catálogo".
- **3.3** `/checkout` en un solo paso: datos (con `autocomplete` y "recordar en este dispositivo"), entrega (retiro con dirección de la tienda / envío con ciudades y costos de `sitio.envios`), forma de pago (en línea o transferencia), nota; validación zod por campo al salir y completa al enviar, foco al primer error; barra fija compacta en celular (total y botón) y resumen completo en escritorio.
- **3.4** Pedido creado con id generado una vez por pantalla (doble clic = un solo pedido); carrito vaciado; código recordado en el dispositivo; `/pedido/:codigo` con estado, "qué sigue", artículos, entrega, total, "Pagar ahora" y WhatsApp. En modo local el pago se simula con `?simular=aprobado` (lo reemplaza el webhook en la etapa 5).
- **3.5** `/seguimiento`: código + teléfono (acepta espacios y guiones), mensaje genérico si no coincide.
- **3.6** Pendiente de Facundo: deploy de prueba y sesión con Natali (Hito A).

## Decisiones
- `/pedido/:codigo` solo se muestra si el código es de este dispositivo; cualquier otro va a `/seguimiento` con el código precargado. Es la privacidad mínima mientras no haya servidor (los códigos son correlativos y adivinables); en la etapa 4 la consulta pública exige teléfono en la base.
- La forma de pago se elige en el checkout (no en la etapa 5) porque define el plazo de la reserva de stock (30 min en línea, 24 h transferencia).
- El envío es una lista de ciudades con costo fijo (`sitio.envios.ciudades`), editable desde el panel; no hay cotización automática.

## Queda afuera a propósito
- Datos bancarios y subida de comprobante para transferencia (5.5); redirección real a Mercado Pago (5.2–5.4).
- Ciudades y costos reales de envío (B-E1); hoy "Bermejo (provisorio) Bs 15".
- Notificación por WhatsApp o correo al confirmar (B-N1).

## Aprendizajes
- Enfocar el primer campo inválido hay que hacerlo en un efecto después de pintar los errores: en el mismo `submit` el DOM todavía no tiene `aria-invalid`.
- En celular una barra fija con el resumen completo tapaba medio formulario: se dejó solo total y botón; el detalle se ve en escritorio y en el carrito.
- Las capturas de página completa muestran los elementos `sticky` repetidos a mitad de página: es un artefacto de la captura, no un error de layout.
