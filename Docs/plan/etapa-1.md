# Etapa 1 — Datos locales, seed y offline (10 h)
Leer: `_comun.md`, `../06-arquitectura.md` (modelo de datos, offline-first).

### Tarea 1.1 · Esquema Dexie · 2 h
Estado: [ ]
**Archivos**: `app/src/data/db.js`.
**Pasos**
- [ ] 1. Definir tablas: perfiles, categorias, productos, producto_colores, producto_fotos, ventas, venta_items, movimientos_stock, config, cola_sync. Índices: `productos.codigo` único, `ventas.creada_en`, `ventas.sync_status`, `movimientos_stock.producto_id`. Verificación: ver la DB en DevTools → Application → IndexedDB.
- [ ] 2. Versionado (`db.version(1)`) con nota de cómo migrar.
- [ ] 3. `cargarSeedSiVacio()`: importa los productos del seed la primera vez. Verificación: recargar y ver 138 productos sin duplicar.
- [ ] 4. Botón (solo dev) "Reiniciar datos de prueba".
**Criterios de aceptación**
- [ ] La segunda carga no duplica; funciona sin internet.

### Tarea 1.2 · Repositorios · 4 h
Estado: [ ]
**Archivos**: `app/src/data/repos/{productos,categorias,ventas,stock,perfiles,config}.js` + `index.js` que exporta la implementación activa.
**Pasos**
- [ ] 1. Definir la interfaz de cada repositorio (comentario de cabecera, una línea por método): `listar(filtros)`, `obtener(id)`, `crear`, `actualizar`, `eliminar` según corresponda.
- [ ] 2. `productos`: `buscarPorCodigo(texto)` (prefijo, sin importar mayúsculas ni guiones/ceros: "mn1" encuentra MN-001), `listarPorCategoria`, CRUD con validación zod.
- [ ] 3. `ventas.crear(venta, items)` en una transacción Dexie que además descuenta stock (`movimientos_stock`) y encola la sincronización.
- [ ] 4. `stock`: `registrarMovimiento`, `stockActual(productoId, colorId)` calculado desde movimientos.
- [ ] 5. Hooks `useProductos`, `useVentas`, etc. con `useLiveQuery` y estados carga/error/vacío.
- [ ] 6. Tests (Vitest) de `buscarPorCodigo` y de venta+stock. Verificación: `npm test`.
**Criterios de aceptación**
- [ ] Ninguna pantalla importa `db.js` directamente (solo repos).

### Tarea 1.3 · Numeración y cola de sincronización · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Decidir numeración: ids UUID + número visible por vendedor (`NV-<iniciales>-<correlativo>`) para evitar choques offline. Confirmar con Facundo/Natali y anotar en `../06-arquitectura.md`.
- [ ] 2. Tabla `cola_sync` (operación, entidad, payload, intentos, estado).
- [ ] 3. `sync/cola.js` con `procesar()` simulado (marca `synced` si hay conexión). Verificación: vender offline → pendiente; volver online → sincronizada.
- [ ] 4. Reintento con espera creciente; nunca pierde datos si falla.
**Criterios de aceptación**
- [ ] Ninguna venta se pierde al cerrar el navegador en modo offline.

### Tarea 1.4 · Utilidades · 2 h
Estado: [ ]
**Archivos**: `src/lib/moneda.js`, `fechas.js`, `permisos.js`, `codigo.js`.
**Pasos**
- [ ] 1. `moneda.js`: `aCentavos`, `formatear(cent, moneda)`, orden `['usd','ars','bs']`, símbolos US$ / $ / Bs. Verificación: tests de redondeo.
- [ ] 2. `fechas.js` en es-BO.
- [ ] 3. `codigo.js`: normalización de códigos para el buscador.
- [ ] 4. `permisos.js`: `puede(rol, accion)` (se completa en 2.2).
**Criterios de aceptación**
- [ ] No hay formateo de dinero fuera de `moneda.js`.

**Cierre**: tests, build, lint; modo offline probado. Pedir autorización Etapa 2.
