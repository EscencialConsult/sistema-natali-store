# Tablero — Versión 1 (ERP Notas de Venta + Catálogo)

Estado general: frontend completo (etapas 0 a 6; 5.3 comisión bloqueada por B1). Etapa 7: preparada, falta la sesión de prueba en dispositivos reales. **Etapa 8: backend construido, esquema aplicado en el Supabase compartido, 7 personas dadas de alta y app probada contra el servidor real (6 pruebas de integración + navegador); falta el modo avión con dos celulares reales.** Notas: [0-2](notas-etapas-0-2.md) · [3](notas-etapa-3.md) · [4](notas-etapa-4.md) · [5](notas-etapa-5.md) · [6](notas-etapa-6.md) · [7: guion](guion-prueba.md), [hallazgos](hallazgos-etapa-7.md) · [8](notas-etapa-8.md).

| Etapa | Nombre | Horas est. | Estado |
|---|---|---|---|
| 0 | Fundaciones del frontend | 8 | [x] (2026-10-08) |
| 1 | Datos locales, seed y offline | 10 | [x] (2026-10-08) |
| 2 | Acceso, roles y estructura de pantallas | 8 | [x] (2026-10-08) |
| 3 | Módulo Catálogo (buscador, ficha, admin) | 16 | [x] (2026-10-08) |
| 4 | Nueva venta + nota de venta A5 | 16 | [x] (2026-10-08) |
| 5 | Historial de ventas, inventario y comisiones | 14 | [x] salvo 5.3 (2026-10-08) |
| 6 | Dashboard, PWA, animación y pulido | 10 | [x] (2026-10-08) |
| 7 | Prueba del frontend con el cliente | 6 | [~] preparada; falta sesión real |
| 8 | Backend: Supabase (esquema, auth, storage, sync) | 18 | [~] aplicada y probada contra el Supabase real; falta modo avión con 2 celulares |
| 9 | Migración a la cuenta del cliente, GitHub y deploy | 8 | [ ] |

Hito A (tras etapa 7): frontend completo y probado → Facundo pasa accesos de Supabase.
Hito B (tras etapa 9 / antes): Facundo pasa accesos de GitHub.

## Etapa 0 — Fundaciones ([etapa-0.md](etapa-0.md))
- [x] (2026-10-08) 0.1 Crear app Vite + React + Tailwind + lucide
- [x] (2026-10-08) 0.2 Kit de marca: tokens y DESIGN.md
- [x] (2026-10-08) 0.3 Componentes base de UI
- [x] (2026-10-08) 0.4 Seed visual: colores de ejemplo y catálogo cargable

## Etapa 1 — Datos locales ([etapa-1.md](etapa-1.md))
- [x] (2026-10-08) 1.1 Esquema Dexie y tipos
- [x] (2026-10-08) 1.2 Repositorios (interfaz estable)
- [x] (2026-10-08) 1.3 Numeración de notas y cola de sincronización simulada (numeración propuesta; falta confirmar)
- [x] (2026-10-08) 1.4 Utilidades: moneda, fechas, permisos

## Etapa 2 — Acceso y estructura ([etapa-2.md](etapa-2.md))
- [x] (2026-10-08) 2.1 Login local por usuario (mock)
- [x] (2026-10-08) 2.2 Matriz de permisos por rol (propuesta; falta confirmar con Natali, B6)
- [x] (2026-10-08) 2.3 Layout responsive y navegación
- [x] (2026-10-08) 2.4 Indicador de conexión

## Etapa 3 — Catálogo ([etapa-3.md](etapa-3.md))
- [x] (2026-10-08) 3.1 Buscador por código (pantalla principal del vendedor)
- [x] (2026-10-08) 3.2 Ficha de producto con galería y colores
- [x] (2026-10-08) 3.3 Listado/grilla con categorías
- [x] (2026-10-08) 3.4 Panel de administración de productos (alta/edición/baja)
- [x] (2026-10-08) 3.5 Carga masiva
- [x] (2026-10-08) 3.6 Vista pública del catálogo (destino del QR)

## Etapa 4 — Venta y nota ([etapa-4.md](etapa-4.md))
- [x] (2026-10-08) 4.1 Monedas y tipo de cambio (USD primero)
- [x] (2026-10-08) 4.2 Pantalla Nueva venta
- [x] (2026-10-08) 4.3 Confirmación y guardado offline
- [x] (2026-10-08) 4.4 Nota de venta A5 (logo + QR + pie)
- [x] (2026-10-08) 4.5 Compartir por WhatsApp y guardar PDF

## Etapa 5 — Historial, inventario, comisiones ([etapa-5.md](etapa-5.md))
- [x] (2026-10-08) 5.1 Historial de ventas con filtros y exportar a Excel
- [x] (2026-10-08) 5.2 Inventario y movimientos de stock
- [!] 5.3 Cálculo de comisiones — bloqueada por B1 (regla incompleta). Hecha la pantalla con las ventas por persona; falta el cálculo

## Etapa 6 — Pulido ([etapa-6.md](etapa-6.md))
- [x] (2026-10-08) 6.1 Dashboard
- [x] (2026-10-08) 6.2 PWA y caché offline
- [x] (2026-10-08) 6.3 Animaciones con propósito
- [x] (2026-10-08) 6.4 Accesibilidad y auditoría de estados

## Etapa 7 — Prueba ([etapa-7.md](etapa-7.md))
- [x] (2026-10-08) 7.1 Guion de prueba y datos de demo
- [~] 7.2 Sesión de prueba y lista de ajustes — recorrido automatizado hecho; falta la sesión con Facundo/Natali en celulares reales
- [~] 7.3 Correcciones — corregidos los hallazgos A1-A2; el resto depende de la sesión real

## Etapa 8 — Backend ([etapa-8.md](etapa-8.md))
- [x] (2026-10-08) 8.1 Proyecto Supabase y entorno — instancia Automatizaciones, `.env.local` (solo URL + clave pública), runner y verificador
- [x] (2026-10-08) 8.2 Esquema: archivo único idempotente `naty_schema.sql` con prefijo (esquema, índices, RLS) — probadas en Postgres real en memoria (22 pruebas); APLICADO en la instancia real (2026-10-08) y verificado
- [x] (2026-10-08) 8.3 Auth y perfiles reales — 7 personas dadas de alta; ingreso real probado en navegador (falta correo real de Natali y de Jehovana)
- [x] (2026-10-08) 8.4 Storage de fotos — probado con Storage real: subida desde la app, URL pública, 138 fotos cargadas
- [x] (2026-10-08) 8.5 Repositorios remotos + sincronización — envío y bajada probados de punta a punta contra el servidor en memoria (16 pruebas)
- [~] 8.6 Pruebas offline → online — venta enviada y sincronizada en 1,4 s contra el servidor real; falta el modo avión con servidor real y dos celulares

## Etapa 9 — Migración y salida ([etapa-9.md](etapa-9.md))
- [ ] 9.1 Conectar GitHub
- [ ] 9.2 Script de migración a Supabase del cliente
- [ ] 9.3 Deploy
- [ ] 9.4 Limpieza del proyecto genérico y entrega
