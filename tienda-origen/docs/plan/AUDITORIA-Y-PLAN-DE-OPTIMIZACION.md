# Auditoría completa y plan de optimización (13/10/2026)

Alcance: sitio público, checkout y pagos, panel de administración, kiosco, base de datos (Supabase compartida), funciones de Netlify,
correo/PDF, despliegue. Método: lectura de código, consultas de solo lectura a la base, cabeceras reales del sitio, build, pruebas y
los cobros reales de estos días. Nada de lo que figura como "hallazgo" es una suposición: cada punto tiene su evidencia.

## 1. Cómo está hoy (resumen)
| Área | Estado |
|---|---|
| Cobro con Mercado Pago (link, QR) | Funciona. 6 cobros reales conciliados 1 a 1 con la cuenta |
| Detección del pago | Aviso firmado de MP + consulta cada 4 s + respaldo cada 10 min + botón "Ya pagué" |
| Comprobante | Correo HTML con logo + PDF; entregado y abierto en Gmail (prueba real) |
| Panel | Login, pedidos, productos, stock, gastos, reportes, usuarios, configuración. Menú contraíble |
| Pruebas automáticas | 196 (193 pasan + 3 de Excel que dependen de la carga de la máquina), lint con 3 avisos menores |
| Seguridad web | CSP, HSTS, X-Frame DENY, nosniff, Referrer y Permissions-Policy presentes; RLS activo en las 19 tablas |
| Datos | 138 productos con foto, slug, categoría y colores; 0 stock negativo; 0 pendientes vencidos sin cancelar |

## 2. Hallazgos y qué hacer (ordenados por prioridad)

### Críticos / antes de abrir al público
| # | Hallazgo (evidencia) | Qué hacer | Esfuerzo |
|---|---|---|---|
| A1 | **Claves que pasaron por chat**: service_role, Access Token y Client Secret de MP, contraseña de la base | Rotarlas en Supabase y Mercado Pago, actualizar en Netlify, redeploy | 30 min |
| A2 | **Precios de prueba en el catálogo real** (138 productos a 5–25 ARS; respaldo guardado) | `node scripts/precios-de-prueba.mjs restaurar` y cargar los precios definitivos | 5 min + decisión de precios |
| A3 | **Datos de prueba mezclados**: 29 pedidos (19 cancelados, 10 pagados, varios de $2.011 y de "Comprador de Prueba") | Script de limpieza con respaldo; reiniciar el listado de reportes; decidir si la numeración TN sigue o arranca limpia | 1 h |
| A4 ✅ | **Recargo de MP en 4 %** (HECHO 13/10: subido a 5,5 %) y el descuento real medido es 5,35 % (rango 3 % a 9 %) | Subir a 5,5 % y revisar cada mes con `scripts/comisiones-mp.mjs` | 5 min |
| A5 | **Retención "SIRTAC noinscripto Salta"** en los cobros; la caja del QR está ubicada en Orán, Salta (MP solo acepta provincias argentinas) | Consultar con contador; evaluar cuenta inscripta (monotributo/CUIT) | Externo |
| A6 | **Contraseñas iniciales** de 10 usuarios en un archivo; 4 vendedores y 2 admin activos | Forzar cambio en el primer ingreso, usuarios nominales, desactivar los de prueba | 1 h |

### Importantes / primera semana
| # | Hallazgo | Qué hacer | Esfuerzo |
|---|---|---|---|
| B1 ✅ | **CORS abierto** (HECHO: ORIGENES_PERMITIDOS cargada): las funciones públicas responden `Access-Control-Allow-Origin` con cualquier origen (variable `ORIGENES_PERMITIDOS` vacía) | Cargar `ORIGENES_PERMITIDOS` con el dominio real y el kiosco | 10 min |
| B2 | **Sin límite de frecuencia** en `confirmar-pedido` y `checkout`: cada llamada consulta a MP o a la base | Límite por IP y por pedido (p. ej. 20/min) en la función, o regla de rate limiting de Netlify | 2 h |
| B3 ✅ | **Mercado Pago puede ofrecer (HECHO: se excluyen ticket y cajero) medios en efectivo** (tickets) que tardan horas y el pedido vence a los 30 min | Excluir `ticket` y `atm` en la preferencia; limitar cuotas si se quiere cobrar sin sorpresas de comisión | 1 h |
| B4 | **Transferencia bancaria incompleta**: la pantalla dice "se habilita en la etapa 5" | Mostrar los datos del panel, subir comprobante y confirmación manual con aviso | 4–6 h |
| B5 ✅ | **Efectivo en el local** (YA EXISTÍA: botón Confirmar pago y bloque Pagos por confirmar): no hay un flujo claro de "confirmar cobro" para la encargada | Botón "Marcar cobrado" visible en el pedido y en la lista, con quién y cuándo | 2 h |
| B6 ✅ | **Versión vieja tras publicar** (HECHO: busca versión nueva cada 15 min y al volver a la pestaña): el service worker sirve el panel anterior (ocurrió dos veces) | Aviso "hay una versión nueva, recargar" visible en el panel y recarga automática al volver a la pestaña | 2 h |
| B7 ✅ | **Miniaturas (HECHO: 138 de 138 generadas, scripts/miniaturas-storage.mjs) `.mini.webp` inexistentes** en el Storage: 400 en consola en cada catálogo y fotos pesadas (Lighthouse móvil 61) | Generar y subir las miniaturas (`scripts/generar-miniaturas.mjs`) y servir `srcset` | 3 h |
| B8 ✅ | **Cobros** (HECHO: pantalla Cobros + guía de Mercado Pago): lo que ve el panel (precio) no coincide con lo que ve MP (cobrado) | Pantalla "Cobros" con cobrado, recargo, comisión, retenciones y neto + Excel | 3 h |

### Mejoras / antes del lanzamiento formal
| # | Hallazgo | Qué hacer |
|---|---|---|
| C1 | `scripts/usuario-panel-prueba.mjs` (crea un admin) está en el repo | Quitarlo del repo o dejarlo en una carpeta fuera del control de versiones |
| C2 | `?k=` (llave del pedido) queda en historial y registros | Vencerla a los 90 días del pedido cerrado o al pasar a entregado |
| C3 | Eventos de webhook y pagos crecen sin retención | Archivar a 90 días |
| C4 | Sin monitoreo ni alertas | Aviso por correo si `salud` falla y si hay pagos aprobados sin confirmar > 15 min |
| C5 | Backups: depende del plan de Supabase | Verificar copia diaria / PITR y probar una restauración |
| C6 | pdf-lib sumó peso a la función (cold start) | Medir en Netlify; si pasa 1 s, mover el PDF a una función aparte |
| C7 | "Mis pedidos" (lista por dispositivo) no existe | Enlace en la barra con los pedidos recordados |
| C8 | Kiosco sin prueba en equipo real (B-K1) | Sesión de prueba con la impresora térmica |
| C9 | Dirección del local provisoria (pie, correo, caja de MP) | Cargar la dirección real en Configuración y en MP |
| C10 | Estado del proyecto desactualizado | Actualizar `docs/ESTADO-DEL-PROYECTO.md` |

## 3. Plan de mejor sincronización de datos

### Diagnóstico
- **Hoy es sondeo (polling)**: catálogo cada 60 s, conversión cada 20 s, pedido cada 4 s. Funciona, pero hay una ventana de
  hasta 60 s en la que un precio o stock cambiado en el panel no se ve en el sitio.
- **El catálogo se baja completo** en cada ciclo (138 productos con colores y fotos): escala mal si crece.
- **Dos almacenes de configuración** (`naty_config` compartida con el sistema de nota y `tienda_config` propia): confunde dónde vive
  cada dato (ej.: tipo de cambio por dólar vs conversión Bs/ARS).
- **Base compartida con el sistema de nota** (modelo viejo con 138 productos de varios colores); el otro sistema ya evolucionó a un
  color por producto en otro proyecto. Riesgo de divergencia.

### Diseño objetivo
1. **Realtime de Supabase para lo que cambia poco y duele si llega tarde**: conversión, recargo, precio publicado y estado del
   pedido. El sondeo queda de respaldo (ya existe). Efecto: cambios instantáneos en todos los dispositivos.
2. **Sincronización incremental** del catálogo: pedir solo lo modificado desde la última marca (`updated_at > marca`) y borrar lo
   despublicado con una lista de bajas. Baja el tráfico y el trabajo del navegador.
3. **Una regla de oro por dato**: lo propio de la tienda vive en `tienda_*`; `naty_*` solo se lee. Migrar `recargo_mp` a `tienda_config`.
4. **Resolución de conflictos**: el servidor siempre gana; el cliente solo guarda lo que aún no pudo enviar (cola del kiosco) y la
   reenvía con el mismo id (ya idempotente).
5. **Versiones visibles**: cada config con `version` (como la conversión) y el panel muestra "última actualización" por dato.
6. **Separar la base** (plan U6 "una sola base"): mover la tienda y el catálogo a un proyecto propio cuando se defina el modelo de
   un color por producto con el equipo del sistema de nota.

## 4. Orden de trabajo propuesto
| Etapa | Qué | Cuándo |
|---|---|---|
| **0 · Hoy** | A4 (recargo 5,5 %), B1 (CORS), revisar A6 (contraseñas) | Antes de que el equipo siga probando |
| **1 · Esta semana** | B3, B5, B6, B7, B8 (cobros) | Tras el primer informe del equipo |
| **2 · Antes de lanzar** | A1 (rotar claves), A2 (restaurar precios), A3 (limpiar datos), B2, B4 | Con fecha de apertura |
| **3 · Después del lanzamiento** | Realtime + sincronización incremental, C2–C10 | Primer mes |
| **4 · Largo plazo** | Separación de la base (U6) | Con el equipo del sistema de nota |

## 5. Hecho hoy
Logo real en sitio, login, pie, kiosco y panel; íconos de la app e ícono del navegador; menú lateral contraíble que recuerda su
estado; código de producto asignado solo (siguiente libre, editable); cobro en el panel con neto de Mercado Pago.
