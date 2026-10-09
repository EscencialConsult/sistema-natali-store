# Notas de cierre — Etapas 0, 1 y 2 (2026-10-08)

Verificación de cierre: `oxlint` sin avisos · `vite build` OK · 24 tests pasando · recorrido manual en 390px y 1440px (login, 7 usuarios, permisos, "Más", sin conexión).

## Cómo correr el proyecto (importante)
El `#` de la carpeta `#EMPRESAS PERSONALIZADO` **rompe Vite** (servidor de desarrollo y tests; el build sí funciona). Solución: `iniciar-dev.bat` (en la raíz del proyecto) monta la carpeta como unidad `R:` sin `#` y trabaja desde ahí.
- Doble clic en `iniciar-dev.bat` → servidor de desarrollo (http://localhost:5173).
- `iniciar-dev.bat npm test` · `iniciar-dev.bat npm run build` · `iniciar-dev.bat npm run lint`.
- La unidad `R:` dura hasta reiniciar la PC; el .bat la recrea solo.
- Solución definitiva (opcional): renombrar la carpeta padre sin `#`.
- Por lo mismo, las fuentes están en `app/public/fonts` y no vienen del paquete npm.

## Qué quedó hecho
**Etapa 0** — App Vite + React + Tailwind (tokens en `src/styles/tokens.css`, reglas en `app/DESIGN.md`), 13 componentes base, página de muestra solo en desarrollo (`/muestra`), seed de 138 productos con colores y stock de ejemplo (`src/data/seed/productos.json`, generado con `scripts/generar-seed.mjs`).
**Etapa 1** — Dexie (`src/data/db.js`), repositorios en `src/data/repos/local/*` exportados desde `src/data/repos/index.js`, cola de sincronización simulada (`src/data/sync/cola.js`), hooks de lectura (`src/data/hooks.js`), utilidades en `src/lib/`.
**Etapa 2** — Login de prueba por usuario + PIN (`0000`, configurable con `VITE_PIN_PRUEBA`), rutas protegidas, matriz de permisos, layout (barra lateral en escritorio, barra inferior con "Más" en celular), indicador de conexión + contador de ventas por enviar, aviso al sincronizar.

## Decisiones tomadas (confirmar)
- **Numeración de notas**: `NV-<iniciales del vendedor>-<correlativo de 4 cifras>` (ej. `NV-AM-0001`), un contador por vendedor. Evita choques cuando se vende sin internet. → confirmar con Natali.
- **Stock en unidades** (no en docenas); una docena = 12 (configurable). El stock se calcula sumando movimientos, nunca se guarda como número.
- **Permisos** (propuesta, B6): vendedor = buscar/vender/sus ventas/su comisión; enc. tienda = lo del vendedor + todas las ventas + inventario (ver); enc. ventas = lo del vendedor + todas las ventas + exportar + comisiones; enc. depósito = catálogo (editar) + inventario (mover); admin = todo.
- **Repos en `repos/local/`** (el plan decía `repos/`): deja lugar para `repos/remoto/` en la etapa 8.
- **Perfiles de prueba sin correos ni contraseñas** (los correos reales entran con Supabase Auth). Natali figura como administradora (a confirmar).
- Tipos de cambio del seed son **de ejemplo** (6,96 Bs y 1400 ARS por USD), marcados `ejemplo: true`.

## Pendiente / a tener en cuenta
- Archivos de la plantilla de Vite sin usar (no pude borrarlos): `app/src/App.jsx`, `app/src/App.css`, `app/src/assets/`, `app/public/icons.svg`. Se pueden eliminar a mano.
- `xlsx` 0.18.5 (para exportar/importar Excel) tiene avisos de seguridad conocidos en `npm audit`. Para exportar no hay riesgo práctico; para la **carga masiva (importar archivos)** conviene reemplazarlo (ej. `exceljs`) antes de la etapa 3.5.
- Bloqueos que siguen abiertos: B1 (comisión), B2 (logo), B3 (teléfonos), B4 (URL del QR), B5 (tipo de cambio), B6 (permisos), B7 (carga masiva).
- Sin commit ni GitHub (decisión de Facundo).
