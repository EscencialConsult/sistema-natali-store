# Backlog v1.1 (lo que quedó fuera de la versión 1 a propósito)

Ordenado por impacto. Cada ítem dice de dónde sale.

## Seguridad y abuso
- [ ] **Límite en el checkout público**: un anónimo puede crear pedidos sin pagar y reservar stock 30 min (auditoría, sección 5). Opciones: tope por teléfono e IP en la Function de checkout (etapa 5), verificación invisible (Cloudflare Turnstile), y reserva más corta hasta que haya pago iniciado.
- [ ] **Límite de intentos de PIN** en `kiosco-activar` y en la verificación del acceso de la encargada (hoy cada verificación crea un registro "(verificación)" en dispositivos: sumar una Function de solo verificación).
- [ ] Recuperar contraseña del panel por correo (`resetPasswordForEmail`).
- [ ] Alta de usuarios con correo desde el panel (Function con `service_role`).

## Rendimiento
- [ ] **Miniaturas de fotos** al subir (`ruta_mini` de ~360 px) y usarlas en grillas, carrito y kiosco. Es la mejora más grande para el LCP del catálogo (hoy 6,4 s en Lighthouse móvil; objetivo ≥ 90 de rendimiento).
- [ ] Tiempo máximo (timeout) y reintento visible en las llamadas a Supabase y a las Functions.
- [ ] Error tracking en producción (Sentry o equivalente) y analytics (tarea 9.4).

## Experiencia
- [ ] "Deshacer" al quitar un artículo del carrito.
- [ ] Guardar un borrador del formulario de checkout.
- [ ] Cuentas de compradoras con historial y direcciones guardadas (fuera de v1 por decisión).
- [ ] Cupones y descuentos, reseñas, lista de deseos, newsletter.
- [ ] Cotización automática de envío con transportistas.

## Operación
- [ ] Facturación fiscal (SIAT Bolivia) y notas de crédito.
- [ ] Reembolso parcial por la pasarela (v1: solo total).
- [ ] Página de créditos y licencias.
- [ ] Ayuda dentro del panel (guía rápida por pantalla).
- [ ] Probar el sitemap y la vista previa de productos contra la base real cuando el esquema esté aplicado.
