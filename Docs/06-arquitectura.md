# Arquitectura del sistema

## Stack (decidido 2026-10-08)
| Capa | Elección | Por qué |
|---|---|---|
| UI | React + Vite (JSX) | stack habitual de Facundo, build rápido |
| Estilos | Tailwind con Design Tokens (kit-de-marca) | un solo lugar para colores/tipografía |
| Iconos | lucide-react | skill `lucide-icons` |
| Animación | skills `animate` / `animation-vocabulary` (motion con propósito, respeta reduced-motion) | |
| Routing | react-router | |
| Datos local/offline | Dexie (IndexedDB) | la conexión es mala: la app debe funcionar sin internet |
| Backend | Supabase (Postgres + Auth + Storage), proyecto genérico de Facundo | migra luego a la cuenta del cliente |
| QR | qrcode.react (o `qrcode`) | genera el QR sin servicio externo |
| PWA | vite-plugin-pwa | instalable en celular + caché de fotos |
| Validación | zod | |

## Principio rector: frontend primero, backend después
Todo el frontend habla con **repositorios** (`src/data/repos/*`) y nunca con Supabase directo. Mientras no hay backend, los repositorios usan **Dexie + seed** (Mock Service Layer). Al llegar Supabase se cambia la implementación del repositorio, no las pantallas.

```
UI (pages/components)
   ↓ hooks (useProductos, useVentas…)
Repositorios  ← interfaz fija (listar, obtener, crear…)
   ├─ impl local  (Dexie)           ← Etapas 1–7
   └─ impl remota (Supabase)  + cola de sincronización ← Etapa 8
```

## Offline-first (requisito del cliente)
- Toda lectura sale de IndexedDB (instantánea, sin red).
- Toda escritura se guarda local con `sync_status = pending` y entra a una **cola**; cuando hay conexión se envía y pasa a `synced`. (El demo ya muestra "Sincronizada/Pendiente".)
- Ids generados en el cliente (UUID) → se puede vender sin internet sin choques de numeración. El **número de nota (NV-00001)** se asigna por dispositivo-vendedor o al sincronizar (decidir en tarea 1.3).
- Fotos del catálogo: miniaturas livianas + caché del service worker.

## Modelo de datos (borrador)
- `perfiles` (id, nombre, email, rol: admin|vendedor|enc_tienda|enc_ventas|enc_deposito, telefono, activo)
- `productos` (id, codigo único, nombre, categoria_id, descripcion, precio_docena_usd_cent, precio_unidad_usd_cent?, activo)
- `producto_colores` (id, producto_id, nombre, hex?, stock_unidades)
- `producto_fotos` (id, producto_id, ruta, orden)
- `categorias` (id, nombre, orden)
- `ventas` (id, numero, vendedor_id, moneda: usd|ars|bs, tipo_cambio, metodo_pago: efectivo|transferencia, total_cent, cliente_nombre?, creada_en, sync_status)
- `venta_items` (id, venta_id, producto_id, color_id?, cantidad, unidad: docena|unidad, precio_cent)
- `movimientos_stock` (id, producto_id, color_id, tipo: entrada|salida|venta|ajuste, cantidad, motivo, usuario_id, creado_en)
- `config` (clave/valor: logo, telefonos del pie, url_catalogo, tipos de cambio, reglas de comisión)
- `comisiones` (se calcula a partir de ventas + regla; ver bloqueo B1)

Dinero siempre en **centavos enteros**. Cada venta está en UNA sola moneda. Orden de monedas en pantalla: **USD primero, ARS, Bs al final**.

## Roles (ver 05-equipo-y-roles.md)
admin · vendedor · encargada de tienda · encargada de ventas · encargada de depósito. Matriz de permisos en tarea 2.2 (a confirmar con Natali).

## Estructura de carpetas del código
```
src/
  app/            router, layout, providers
  features/       catalogo/ ventas/ nota/ inventario/ comisiones/ dashboard/ auth/ ajustes/
  data/           db.js (Dexie) · repos/ · seed/ · sync/
  components/     ui/ (Button, Select, BuscadorLista, Modal…)
  lib/            moneda.js · fechas.js · qr.js · permisos.js
  styles/         tokens
supabase/         migrations/ · seed.sql · storage.md   (Etapa 8)
DESIGN.md         reglas de diseño nombradas
```

## Estrategia de migración a la cuenta del cliente
1. Todo el esquema vive como **migraciones SQL versionadas** (`supabase/migrations`), incluidos RLS y buckets de Storage.
2. Datos reales: script de export/import (Postgres dump + copia de archivos de Storage).
3. El frontend lee URL y keys de variables de entorno → migrar = cambiar `.env` y volver a desplegar.
4. Nada de datos del cliente en el proyecto genérico más tiempo del necesario; limpiar al migrar.

## Impresión nota A5
Hoja CSS `@page { size: 148mm 210mm; margin: 8mm }`, versión solo-impresión, probada con "Guardar como PDF". Encabezado: logo + QR al catálogo. Pie: teléfonos vendedores + encargada de tienda.
