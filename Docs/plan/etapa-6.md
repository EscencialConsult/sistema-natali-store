# Etapa 6 — Dashboard, PWA, animación y pulido (10 h)
Leer: `_comun.md`, `DESIGN.md` de la app, skills `animate`, `emil-design-eng`, `apple-design` (consulta).

### Tarea 6.1 · Dashboard · 3 h
Estado: [ ]
**Pasos**
- [ ] 1. Admin/encargadas: ventas de hoy por vendedor y por moneda, últimas ventas, stock bajo/agotado.
- [ ] 2. Vendedor: sus ventas de hoy y su comisión (si 5.3 está lista).
- [ ] 3. Estados vacíos útiles ("Todavía no hay ventas hoy — empezá una venta").
- [ ] 4. Gráficos simples solo si aportan (skill `dataviz`); sin adornos.

### Tarea 6.2 · PWA y caché offline · 3 h
Estado: [ ]
**Pasos**
- [ ] 1. `vite-plugin-pwa`: manifest (nombre, ícono con logo, `display: standalone`), service worker con precaché de la app.
- [ ] 2. Caché de fotos del catálogo (estrategia stale-while-revalidate, tope de tamaño).
- [ ] 3. Aviso "Hay una versión nueva" para actualizar (conecta con skill `notificador-versiones` si se decide).
- [ ] 4. Prueba real: instalar en un celular, apagar datos, abrir y vender.
**Criterios de aceptación**
- [ ] Con la app instalada y sin conexión se puede buscar, ver fichas y vender.

### Tarea 6.3 · Animaciones con propósito · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Lista corta de dónde sí (skill `find-animation-opportunities`): apertura de ficha/Sheet, resultado de búsqueda, agregar ítem a la venta, confirmación de venta, cambio de estado de sync.
- [ ] 2. Implementar con la skill `animate` (curva y duración definidas, interrumpibles).
- [ ] 3. `prefers-reduced-motion` respetado. Verificación: desactivar animaciones del sistema y revisar.
- [ ] 4. Que ninguna animación retrase la acción del vendedor (≤ 200 ms en interacciones frecuentes).

### Tarea 6.4 · Accesibilidad y estados · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Recorrer cada pantalla: ¿tiene carga, error y vacío?
- [ ] 2. Contraste, foco visible, tamaños táctiles ≥ 44 px, etiquetas de formulario.
- [ ] 3. Skill `reglas-de-pagina` como checklist de lo que suele olvidar el vibe coding (404, legal, SEO de la vista pública).
- [ ] 4. Skill `embellece_mi_frontend` / `anti-ia` si queda "sabor IA".
- [ ] 5. Build de producción: revisar peso y tiempo de carga con red lenta simulada.

**Cierre de etapa**: auditoría completa; build+lint+tests. Pedir autorización Etapa 7.
