# Notas de cierre — Etapa 6: Dashboard, PWA, animación y pulido (2026-10-08)

Verificación: lint sin avisos · build OK · 42 tests · prueba real en modo avión · auditoría de accesibilidad con axe-core en 17 pantallas/estados.

## 6.1 Inicio (`/inicio`)
- Quien ve todo (admin, enc. de tienda, enc. de ventas) arranca acá; las vendedoras siguen arrancando en el buscador. Encargada de depósito arranca en Inventario.
- Ventas de hoy (cantidad y total por moneda, sin mezclar), ventas por vendedor, alertas de stock (colores agotados / con stock bajo), últimas ventas, accesos rápidos "Nueva venta" y "Buscar modelo". El vendedor ve solo lo suyo. Estados de carga, vacío y error.
- Sin gráficos a propósito: con varias monedas un gráfico mezclaría escalas; las cifras son más claras.

## 6.2 App instalable y sin conexión
- Service worker (vite-plugin-pwa): guarda toda la app (44 archivos, ~900 KB). Íconos y nombre "Modas Naty" (provisorios, con "MN"; se cambian con el logo).
- **Prueba real** (build + modo avión): con el service worker activo se cortó la red y se recargó → la app abrió, el catálogo mostró fotos y colores, y se hizo una venta completa: quedó "Pendiente de enviar" (indicador "Sin conexión · 1 por enviar") y al volver la red pasó sola a "Sincronizada".
- **Fotos del catálogo**: botón "Descargar fotos del catálogo" en Inicio (guarda las 138 fotos en el dispositivo con buena conexión, con barra de progreso y reintento). También se guardan solas las que se miran.
- Aviso "Hay una versión nueva" con botón Actualizar: no se actualiza sola, para no cortar una venta a medias.
- Carga inicial más liviana: la app se partió en paquetes por pantalla (principal 307 KB, ~96 KB comprimido). La librería de Excel (~930 KB) solo se baja si se usa una carga masiva.

## 6.3 Animaciones (skill `animate`)
Se animó solo lo que aparece de vez en cuando; búsqueda, resultados, carrito y navegación **no** se animan (se usan decenas de veces al día).
| Qué | Cómo |
|---|---|
| Modal | fundido + escala 0,96→1, 180 ms |
| Hoja inferior (celular) | sube desde abajo y sale por el mismo camino, 300 ms, curva de cajón |
| Aviso (toast) | fundido + sube 8 px, 200 ms |
| Botón al tocar | escala 0,97, 150 ms |
| Check "venta guardada" | fundido + escala 0,8→1, 240 ms |
Solo `opacity` y `transform`, transiciones interrumpibles, CSS puro. Verificado midiendo el movimiento (la hoja pasa de 620 px abajo a su lugar en ~300 ms) y que con "reducir movimiento" quedan solo fundidos. Detalle en `app/DESIGN.md`. **Falta el chequeo de sensación** en un celular real (que no se sienta lento ni brusco).

## 6.4 Accesibilidad y estados
Auditoría con axe-core (WCAG 2.1 A/AA + buenas prácticas) en login, PIN, catálogo público, inicio, buscador, ventas, comisiones, ajustes, formulario de producto, nota, hojas de ficha e inventario y escritorio (1440): **sin infracciones**, tras corregir:
- Selector de orden sin nombre accesible (crítico) → ahora lleva `ariaLabel`.
- Texto gris tenue con contraste insuficiente (serio) → `texto-tenue` pasó de #8b8d92 a #6b6e73.
- Botón verde de WhatsApp al límite de contraste → #0f8a5f a #0b7a52.
Además: títulos de pestaña por pantalla ("Ventas · Modas Naty"), descripción y manifest, `lang="es"`, 404 y errores por pantalla, foco visible, objetivos táctiles de 44 px.
No se hicieron páginas legales (términos, privacidad): no hay registro de clientas ni cobros en línea todavía; revisar si Natali las quiere en el catálogo público.

## A tener en cuenta
- Probar la instalación en un **Android y un iPhone reales** (Agregar a pantalla de inicio) y la sensación de las animaciones: etapa 7.
- iPhone: Safari borra los datos de sitios web que no se usan por varias semanas; instalar la app y usarla seguido evita perder ventas sin enviar → motivo de más para la sincronización (etapa 8).
- Íconos y colores son provisorios hasta recibir el logo (B2).
- Bloqueos abiertos: B1 comisión · B2 logo · B3 teléfonos reales · B4 URL del catálogo · B5 tipo de cambio · B6 permisos · B7 carga masiva.
