# Etapa 3 — Módulo Catálogo (16 h)
Leer: `_comun.md`, `../03-modulo-catalogo.md`, `../referencias/diseno/README.md`.
Principio: el vendedor tiene un cliente esperando. **Escribir un código y ver foto + colores en menos de 3 segundos.**

### Tarea 3.1 · Buscador por código · 3 h
Estado: [ ]
**Archivos**: `src/features/catalogo/BuscadorPage.jsx`, `useBuscador.js`.
**Pasos**
- [ ] 1. Campo de búsqueda grande arriba, con foco automático al abrir. Teclado numérico/alfanumérico adecuado en celular.
- [ ] 2. Resultados en vivo mientras escribe (repo `buscarPorCodigo`), máx. 12, con foto miniatura + código + nombre.
- [ ] 3. Si hay un único resultado exacto, abrir su ficha en un panel (Sheet en celular) sin pasos extra.
- [ ] 4. Estados: vacío inicial (últimos códigos buscados), sin resultados ("No hay modelo X — ¿querés ver parecidos?"), error.
- [ ] 5. Historial de últimas 8 búsquedas guardado local.
- [ ] 6. Prueba: escribir "mn5", "MN-005", "5" → mismo resultado. Verificación: test + manual a 390px.
**Criterios de aceptación**
- [ ] Del foco al resultado visible en ≤ 3 interacciones, funcionando sin internet.

### Tarea 3.2 · Ficha de producto · 4 h
Estado: [ ]
**Archivos**: `ProductoFicha.jsx`, `Galeria.jsx`, `ColoresChips.jsx`.
**Pasos**
- [ ] 1. Cabecera con código grande, nombre, categoría y precio por docena en USD (y equivalente Bs/ARS pequeño, según config).
- [ ] 2. Galería: foto principal grande, miniaturas, deslizar con el dedo, zoom al tocar. Carga diferida; miniatura de baja calidad primero (conexión lenta).
- [ ] 3. Colores como chips con muestra (hex) + nombre + stock disponible (verde/ámbar/agotado, no solo color: también texto).
- [ ] 4. Descripción opcional plegable.
- [ ] 5. Botón "Agregar a venta" (lleva a 4.2 con el producto precargado) visible según permisos.
- [ ] 6. Estados: carga (skeleton), foto rota (placeholder), producto inexistente.
**Criterios de aceptación**
- [ ] Se entiende sin instrucciones; la foto es protagonista; usable con una mano.

### Tarea 3.3 · Grilla con categorías · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Grilla 2 columnas en celular, 4 en escritorio (referencia Divas House), tarjeta con foto, código, nombre, precio, etiqueta "Nuevo".
- [ ] 2. Filtro por categoría: chips horizontales en celular, lateral en escritorio.
- [ ] 3. Orden: por código, nombre, precio. Scroll continuo con carga por tandas (no 138 fotos juntas).
- [ ] 4. Estados vacío/error.

### Tarea 3.4 · Administración de productos · 4 h
Estado: [ ]
**Archivos**: `features/catalogo/admin/*`. Permiso: admin y enc. depósito.
**Pasos**
- [ ] 1. Listado administrable (tabla en escritorio, tarjetas en celular) con buscador y filtro activo/inactivo.
- [ ] 2. Formulario crear/editar: código (único, validado), nombre, categoría, descripción, precio docena, activo. Validación zod + mensajes claros; botón deshabilitado mientras guarda.
- [ ] 3. Subida de fotos desde celular/PC: elegir varias, reordenar, borrar; **comprimir en el navegador** (máx. ~900px, JPEG/WebP) antes de guardar.
- [ ] 4. Editor de colores: nombre + selector de color + stock inicial; agregar/quitar.
- [ ] 5. Eliminar con confirmación (baja lógica: queda inactivo, no se pierde el historial de ventas).
- [ ] 6. Revisar que tras editar el cambio se vea de inmediato en buscador y ficha.
**Criterios de aceptación**
- [ ] Natali puede crear un producto con 3 fotos y 4 colores sin ayuda en menos de 2 minutos.

### Tarea 3.5 · Carga masiva · 2 h
Estado: [ ]
**Bloqueos**: B7 (de dónde carga Natali). Propuesta inicial: Excel/CSV + carpeta de fotos nombradas por código.
**Pasos**
- [ ] 1. Plantilla descargable (Excel) con columnas: codigo, nombre, categoria, precio_docena, colores (separados por coma).
- [ ] 2. Importar archivo: vista previa con errores por fila (código repetido, precio vacío) antes de confirmar.
- [ ] 3. Subir fotos en lote y asociarlas por nombre de archivo (`MN-005_1.jpg`, `MN-005_2.jpg`).
- [ ] 4. Reporte final: cuántos creados, actualizados, con error.
**Criterios de aceptación**
- [ ] Importar los 138 del seed en un solo paso, sin duplicar.

### Tarea 3.6 · Vista pública del catálogo (destino del QR) · 1 h
Estado: [ ]
**Pasos**
- [ ] 1. Ruta `/c` pública, sin login, solo lectura: grilla + buscador + ficha. Sin precios si Natali lo decide (B4/pregunta 5 de `04-preguntas-abiertas.md`), configurable en Ajustes.
- [ ] 2. Cabecera con logo y botón de WhatsApp de la tienda.
- [ ] 3. Revisar que no expone datos internos (stock exacto, costos, usuarios).
**Criterios de aceptación**
- [ ] Abre desde un celular sin sesión y es rápida con red lenta.

**Cierre de etapa**: build+lint+tests; recorrer buscador→ficha→agregar con red apagada. Pedir autorización Etapa 4.
