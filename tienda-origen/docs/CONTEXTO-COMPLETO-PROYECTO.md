# Contexto Maestro y Manual de Arquitectura — Tienda Online Modas Naty

> **Documento de Contexto Integral del Proyecto**  
> **Cliente:** Modas Naty (Natali) — Bermejo, Tarija, Bolivia (zona fronteriza con Argentina).  
> **Consultora / Desarrollo:** Área de Innovación y Desarrollo — Escencial Consultora.  
> **Repositorio:** [EscencialConsult/tienda-natali-online](https://github.com/EscencialConsult/tienda-natali-online) (rama `main`).  
> **Deploy:** [https://modasnaty-tienda.netlify.app](https://modasnaty-tienda.netlify.app) (Netlify team "Laura").  
> **Fecha de consolidación:** Octubre de 2026.

---

## 1. Para quién se hizo y con qué finalidad

### Cliente y Contexto del Negocio
El cliente es **Modas Naty**, un negocio de indumentaria femenina fundado y administrado por **Natali**, ubicado físicamente en **Bermejo (departamento de Tarija, Bolivia)**.  
Al estar en una **zona de frontera internacional con Argentina**, el negocio tiene una particularidad operativa determinante:
- Opera diariamente en dos monedas: **Bolivianos (Bs)** y **Pesos Argentinos (ARS)** (con el dólar USD como referencia de costos mayoristas).
- Vende tanto a nivel local boliviano como a clientas argentinas que cruzan o compran a distancia.
- Cuenta con un local físico con atención al público y un depósito de mercadería.

### Finalidad del Proyecto
El objetivo central fue construir una **solución digital unificada 3 en 1** que automatizara la venta minorista directa, eliminando la intermediación lenta de mensajes manuales y planillas de cálculo, pero integrada al ecosistema de gestión existente:

1. **Tienda Online Pública (`/`)**: Catálogo público web para celular y computadora, donde cualquier persona ingresa, explora colecciones, elige talles/colores, compra como invitada (sin registro obligatorio) y paga en línea o reserva para pagar en efectivo.
2. **Kiosco de Autogestión en el Local (`/kiosco`)**: Una terminal táctil física ubicada en el local comercial con impresora térmica integrada (80 mm). Las clientas presenciales navegan el catálogo solas, cargan su pedido y obtienen un ticket impreso con código QR para retirar y pagar en mostrador o vía QR.
3. **Panel de Control y Gestión (`/administracion`)**: Sistema interno administrativo para Natali y sus encargadas, permitiendo gestionar el catálogo minorista, autorizar pagos en caja, controlar stock con reservas activas, cuantificar gastos del local, ver reportes y configurar el tipo de cambio y los textos del sitio.

### Relación con el Sistema Hermano ("SISTEMA DE NOTA")
Modas Naty ya contaba con un primer desarrollo: el **ERP de Notas de Venta** ([sistema-natali-store](https://github.com/EscencialConsult/sistema-natali-store)).  
Para no duplicar el trabajo de Natali, la tienda online se diseñó para **compartir la base de datos de productos** (`naty_*` en Supabase): un producto cargado en el depósito sirve tanto para la venta mayorista interna como para la tienda pública.

---

## 2. En qué se basa y cómo funciona

### Stack Tecnológico
| Capa | Tecnología | Justificación y Función |
|---|---|---|
| **Frontend UI** | React 19 + Vite | Renderizado ultra ágil, compatible con PWA y componentes modulares. |
| **Estilos y Diseño** | Tailwind CSS v4 + Vanilla Tokens (`src/styles/tokens.css` y `DESIGN.md`) | Paleta exclusiva "crema y ciruela" sin bordes pesados ni cajas artificiales. |
| **Iconos** | Lucide React | Iconografía vectorial consistente y liviana. |
| **Enrutamiento** | React Router v7 | Separación en 3 layouts independientes (`LayoutSitio`, `LayoutKiosco`, `LayoutPanel`). |
| **Persistencia Local** | Dexie.js (IndexedDB) | Filosofía *offline-first*: el carrito, el catálogo cacheado y las órdenes del kiosco funcionan aun si se corta internet. |
| **Backend & Base** | Supabase (PostgreSQL + Auth + Storage + RLS) | Instancia de base relacional con funciones SQL (`SECURITY DEFINER`) para operaciones atómicas. |
| **Serverless Backend** | Netlify Functions (Node.js) | Microservicios seguros con `service_role` para checkout, webhooks firmados de Mercado Pago y tareas programadas. |
| **Pasarela de Pagos** | Mercado Pago Checkout Pro (adaptado mediante `pagokit`) | Cobro en pesos argentinos con confirmación asíncrona mediante webhooks. |
| **Impresión Térmica** | CSS Paged Media (`@page 80mm`) + `window.print` silencioso | Formato de ticket térmico estándar sin drivers externos invasivos. |
| **Manejo de Tiempos** | `Intl.DateTimeFormat` configurado estrictamente en **America/La_Paz** | Evita desfasajes horarios (Bolivia es UTC-4 todo el año sin horario de verano; Facundo opera desde Argentina UTC-3). |

### Principio Rector de Arquitectura: Pantallas → Repositorios → Base
Ningún componente de React importa directamente Supabase ni Dexie. Toda la lógica de datos se desacopla en tres capas:
1. **Componentes / Pantallas (`features/*`)**: Solo consumen Hooks reactivos (`src/data/hooks.js`).
2. **Repositorios (`src/data/repos/*`)**: Interfaz unificada con dos implementaciones intercambiables:
   - `local/`: Opera contra Dexie (IndexedDB) y semillas mock (utilizado en desarrollo y modo demo `VITE_MODO_DEMO=1`).
   - `remoto/`: Opera contra Supabase y Netlify Functions en producción.
3. **Persistencia y Serverless**: Base de datos Postgres con Row Level Security (RLS) y Netlify Functions con acceso privilegiado.

```
       UI (features: sitio, catalogo, carrito, kiosco, panel)
                             ↓
                   Hooks (src/data/hooks.js)
                             ↓
              Repositorios (src/data/repos/index.js)
                  ├── local  → Dexie (IndexedDB) + Caché
                  └── remoto → Supabase + Netlify Functions
                                      ↓
                         Postgres RLS / Mercado Pago
```

### Ciclo de Vida Crítico del Pedido y Stock
Para evitar ventas duplicadas o quiebres de stock:
1. **Creación**: Al tocar "Comprar", la función SQL atómica `tienda_crear_pedido` valida disponibilidad y genera un movimiento de stock tipo `reserva` con vencimiento de 30 minutos (24 horas si es transferencia con comprobante).
2. **Pago**:
   - Si es **Mercado Pago**: Se abre Checkout Pro. Cuando la compradora paga, Mercado Pago notifica a `netlify/functions/webhook-mercadopago.js`. La función valida la firma criptográfica (`x-signature`) y llama a `tienda_confirmar_pago`, convirtiendo la reserva en venta definitiva.
   - Si es **Efectivo en Caja / Kiosco**: Se genera el ticket con estado `pendiente_pago`. La encargada cobra en mostrador y presiona "Confirmar pago" en el panel.
3. **Vencimiento o Cancelación**: Si pasan los 30 minutos sin pago, la función `tienda_vencer_reservas` libera el stock reservado de forma automática.

### Manejo Bimoneda y Tipo de Cambio Dinámico
1. Todo precio de catálogo base vive en **Bolivianos (Bs)** en centavos enteros.
2. La administración define en el panel (`Configuración > Moneda`) la tasa vigente (ejemplo: `5 Bs = 1 ARS`).
3. Cada cambio sube la versión (`cambio_version`) en `tienda_config`.
4. El navegador y el kiosco consultan la versión cada 20 segundos. Al confirmar compra, se envía la versión vista; si la tasa cambió mientras la clienta elegía prendas, el servidor rechaza con `TIENDA_CAMBIO_ACTUALIZADO` y exige confirmación con el valor real, protegiendo al negocio de desfases cambiarios.

---

## 3. Problemas encontrados y Soluciones aplicadas

| # | Problema Detectado | Causa Raíz | Solución Técnica Implementada |
|---|---|---|---|
| **P1** | **Mercado Pago no opera en Bolivia.** | Mercado Pago no admite cuentas ni cobros en Bolivianos (`BOB`). | Se acordó operar con la **cuenta argentina de Natali** cobrando en **ARS**. La tienda exhibe precios duales (Bs y $) y al pagar en línea procesa en pesos argentinos. Para pagos en moneda boliviana, se habilitó el pago en caja / transferencia con comprobante. |
| **P2** | **Vite se colgaba y fallaba al iniciar.** | La ruta física de Windows contenía `#` (`#EMPRESAS PERSONALIZADO/MODAS NATALI`). Los servidores basados en Rollup/Vite rompen el módulo de resolución con `#` en la URL de archivo. | Se creó [iniciar-dev.bat](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/iniciar-dev.bat), que ejecuta el comando de Windows `subst R:` para montar la carpeta en una unidad virtual limpia `R:\` libre de caracteres especiales. |
| **P3** | **Riesgo de sobreventa o bloqueo de stock.** | Múltiples usuarias pueden intentar comprar la última prenda simultáneamente. | Transacciones atómicas en Postgres mediante `SECURITY DEFINER`. `tienda_crear_pedido` genera un bloqueo temporal de 30 min. Si el pago no entra, un cron/función libera el stock sin intervención humana. |
| **P4** | **Pérdida de posición y fotos pesadas en el catálogo.** | Al volver de ver un producto, el catálogo se reiniciaba arriba y consumía 17 MB en imágenes tipo flyers. | Se programó `useScrollConservado.js` para restaurar posición exacta y tandas; se generaron miniaturas `.mini.webp` reduciendo la carga de 17.3 MB a 4.7 MB. |
| **P5** | **Impresión térmica en kiosco desatendido.** | Los diálogos estándar de impresión del navegador exigen hacer clic en "Aceptar", impidiendo la autogestión. | Se estandarizó la impresión con reglas CSS `@page { size: 80mm auto; margin: 0 }` en `impresion-ticket.css`, configurando Google Chrome en modo kiosco (`--kiosk --kiosk-printing`) para imprimir directo a la impresora de 80 mm. |
| **P6** | **Doble juego de usuarios y login.** | El sistema de nota migró a login con cédula (`CI`), mientras la tienda usaba email tradicional. | Se desacopló la gestión de usuarios: la tienda consume la autenticación de Supabase existente y protege los roles (`admin`, `enc_tienda`, `enc_deposito`), bloqueando el acceso a vendedores mayoristas que no intervienen en la web. |
| **P7** | **Desfase horario entre Argentina y Bolivia.** | Facundo desarrolla desde Argentina (UTC-3) y el negocio opera en Bolivia (UTC-4). Un pedido de las 23:30 hs caía en "mañana". | Se centralizó todo cálculo de fechas en `src/lib/fechas.js` forzando la zona `America/La_Paz`, y en Netlify Functions se fijó la variable `TZ=America/La_Paz`. |

---

## 4. Mapa Exhaustivo de Archivos del Proyecto

A continuación se detalla la totalidad de carpetas y archivos que componen el repositorio, especificando su responsabilidad exacta.

### 4.1. Raíz del Repositorio
- [README.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/README.md): Resumen ejecutivo del repositorio, enlaces a documentación y mención a la zona horaria `America/La_Paz`.
- [iniciar-dev.bat](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/iniciar-dev.bat): Script Batch de inicio rápido en Windows. Monta la carpeta como unidad `R:` usando `subst` para esquivar el bug del `#` en Vite y ejecuta `npm run dev`.
- [netlify.toml](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/netlify.toml): Configuración de despliegue en Netlify: define base `app`, comando de compilación, headers de seguridad (CSP, X-Frame-Options), redirects para SPA y publicación de Netlify Functions.
- [login-logo.png](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/login-logo.png): Isotipo y logotipo de Modas Naty para pantalla de acceso.
- [.gitignore](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/.gitignore): Exclusión de `node_modules`, `.env`, builds y temporales.
- `vite-dev.log` / `vite-preview.log`: Registros de ejecución local del servidor.
- `.pagokit/`: Configuración interna del generador de pasarela Pagokit.
- `.playwright-mcp/`: Entorno de automatización de navegador para pruebas E2E.
- `.netlify/`: Caché y configuración local de Netlify CLI.

---

### 4.2. Directorio de Documentación (`docs/`)

#### Documentos Principales de Visión y Arquitectura
- [docs/01-vision-y-alcance.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/01-vision-y-alcance.md): Propuesta de valor, qué es y qué no es la tienda, criterios de éxito y alcance de la V1.
- [docs/02-roles-y-casos-de-uso.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/02-roles-y-casos-de-uso.md): Matriz de permisos (Admin, Encargada de tienda, Encargada de depósito, Kiosco) y casos de uso detallados.
- [docs/03-sistemas-y-caracteristicas.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/03-sistemas-y-caracteristicas.md): Desglose de los 7 subsistemas: Sitio, Catálogo, Carrito/Checkout, Pasarela, Kiosco, Panel y Backend.
- [docs/04-arquitectura.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/04-arquitectura.md): Decisiones arquitectónicas fundamentales (D1 a D9), diagrama de capas, modelo relacional y política horaria.
- [docs/05-pagos.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/05-pagos.md): Análisis integral de pagos, adaptación de Pagokit a Netlify Functions, flujo de Checkout Pro y pagos manuales.
- [docs/06-kiosco-e-impresion.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/06-kiosco-e-impresion.md): Especificación técnica del kiosco físico, interfaz táctil (56 px), manejo de inactividad e impresión térmica de 80 mm.
- [docs/07-preguntas-abiertas-y-bloqueos.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/07-preguntas-abiertas-y-bloqueos.md): Registro de bloqueos clasificados (`B-P1`, `B-K1`, `B-C1`, etc.) y decisiones tomadas.
- [docs/ESTADO-DEL-PROYECTO.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/ESTADO-DEL-PROYECTO.md): Cuadro de situación ejecutiva, métricas de calidad (tests, accesibilidad axe, Lighthouse) y pasos pendientes.
- [docs/README.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/README.md): Índice maestro para lectura ordenada de la documentación técnica.
- [docs/deploy.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/deploy.md): Guía paso a paso para desplegar en Netlify en modo demo (`VITE_MODO_DEMO=1`) y pase a producción.
- [docs/entrega-demo.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/docs/entrega-demo.md): Guion de presentación para compartir con Natali, con credenciales demo (PIN `0000` y PIN `2468`).

#### Subcarpeta `docs/plan/` (Planificación y Auditoría de Etapas)
- `tareas-v1.md`: Tablero maestro de 10 etapas (0 a 9) con estado de ejecución y estimaciones horarias.
- `etapa-0.md` a `etapa-9.md`: Especificación individual con criterios de aceptación de cada etapa.
- `notas-etapa-0.md` a `notas-etapa-8.md`: Bitácora y memoria técnica de cierre de cada fase.
- `_comun.md`: Reglas transversales de desarrollo (sin datos inventados, tests antes de cerrar, respeto a tokens).
- `PLAN-rediseno.md`: Plan del rediseño visual (R1 a R5) salido del debate entre Claude, Codex y Gemini.
- `PLAN-actualizacion-concordancia.md`: Plan de alineación (U0 a U6) con los cambios del modelo de datos del sistema de nota.
- `AUDITORIA-Y-PLAN-DE-OPTIMIZACION.md`: Informe de optimizaciones de rendimiento y UX.
- `DISENO-mejoras-y-prompts-stitch.md`: Diagnóstico visual `anti-ia` y prompts para generación de componentes en Google Stitch.
- `STITCH-comprobante.md`: Especificación visual para el comprobante térmico y digital.
- `auditoria-reglas-de-pagina.md`: Verificación de consistencia de navegación y rutas.
- `backlog-v1.1.md`: Funcionalidades futuras (cupones, cuentas de clienta, facturación electrónica SIAT).

#### Subcarpetas `docs/pagos/`, `docs/kiosco/`, `docs/entrega/` y `docs/referencias/`
- `docs/pagos/moneda-y-tipo-de-cambio.md`: Documento canónico sobre la lógica de conversión Bs/ARS, versionado y correo con comprobante en PDF.
- `docs/pagos/comprobante-y-recargo.md`: Reglas del comprobante y comisiones de pasarela.
- `docs/pagos/que-pedir-a-la-empresa.md`: Instructivo para solicitar a Natali sus credenciales de cobro de Mercado Pago.
- `docs/pagos/prueba-completa.md`: Procedimiento de verificación de cobro real de prueba.
- `docs/pagos/PAGOKIT_INTEGRATION.md` y `PAGOKIT_PRODUCTION_CHECKLIST.md`: Auditoría de seguridad del checkout.
- `docs/kiosco/configurar-equipo.md`: Configuración de Chrome en Windows para impresión desatendida.
- `docs/entrega/manuales/TiendaModasNaty.md`: Manual de usuario exhaustivo (600+ líneas) para la clienta y para el panel administrativo.
- `docs/entrega/guion-soporte.html`: Herramienta interactiva de soporte técnico ante incidencias comunes.
- `docs/referencias/`: Referencias visuales de diseño del sistema hermano y rediseño.

---

### 4.3. Aplicación Principal (`app/`)

#### Archivos de Configuración y Raíz de la App
- [app/package.json](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/package.json): Dependencias: React 19, react-router v7, tailwindcss v4, lucide-react, dexie, @supabase/supabase-js, zod, exceljs, canvas-confetti. Vitest para testing.
- [app/vite.config.js](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/vite.config.js): Configuración de Vite con plugins `@vitejs/plugin-react`, `vite-plugin-pwa` (service worker, manifiesto e íconos) y alias a directorios.
- [app/index.html](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/index.html): HTML base con precarga de fuentes (DM Sans y Playfair Display) y viewport optimizado.
- [app/CLAUDE.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/CLAUDE.md): Directivas operativas para agentes de IA (reglas de no inferencia, cómo correr scripts, prohibición de alterar esquemas sin permiso).
- [app/DESIGN.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/DESIGN.md): Sistema de diseño completo: colores base (crema `#FBF7F3`, tinta `#1C1819`, ciruela `#8A3A63`), tipografía, botones tonales y layouts.
- [app/SUPABASE-REGLAS.md](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/SUPABASE-REGLAS.md): Convenciones para escribir SQL: idempotencia estricta, prefijos, seguridad `SECURITY DEFINER` y RLS.
- [app/csp.js](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/csp.js): Cabeceras Content Security Policy para blindar el frontend contra inyecciones XSS.
- [app/.oxlintrc.json](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/.oxlintrc.json): Configuración del linter Oxlint de alta velocidad.
- `app/.env.example` y `.env.demo`: Plantillas de variables públicas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MODO_DEMO`).

#### Backend Serverless (`app/netlify/functions/`)
- `checkout.js`: Crea la preferencia de Checkout Pro en Mercado Pago a partir de un `pedido_id`, fijando referencias externas y URLs de retorno.
- `webhook-mercadopago.js`: Recibe notificaciones HTTP de Mercado Pago, verifica la firma criptográfica `x-signature` (HMAC-SHA256) y confirma el pago mediante la función Postgres `tienda_confirmar_pago`.
- `confirmar-pedido.js`: Confirmación manual de pedidos por encargadas.
- `kiosco-activar.js` y `kiosco-pedido.js`: Validación de PIN de hardware para terminales y recepción de pedidos desde kiosco.
- `reconciliar-pagos.js`: Tarea de conciliación de pagos que quedaron en estado indeterminado.
- `reembolso.js`: Dispara devoluciones monetarias vía API de Mercado Pago (restringido a rol admin).
- `salud.js`: Endpoint de health check y liveness para monitoreo.
- `sitemap.js`: Generación dinámica del mapa del sitio XML para motores de búsqueda.
- `vencer-reservas.js`: Proceso periódico para caducar pedidos sin pagar y reincorporar el stock a la venta.
- `og-producto.js`: Genera metadatos e imágenes dinámicas Open Graph para que al compartir un link en WhatsApp se vea la foto y precio.
- `_lib/`: Módulos compartidos por las funciones:
  - `_lib/mercadopago.js`: Cliente oficial del SDK de Mercado Pago.
  - `_lib/supabaseAdmin.js`: Conexión administrativa con `service_role`.
  - `_lib/correo.js`: Envío de comprobantes por correo (vía API Brevo).
  - `_lib/comprobantePdf.js`: Ensamblado del comprobante de compra en formato PDF.
  - `_lib/errores-pago.js`: Normalización de errores de pago para el usuario.

#### Base de Datos (`app/supabase/`)
- [app/supabase/tienda_schema.sql](file:///c:/Users/PERSONAL/Documents/PROYECTOS/#EMPRESAS%20PERSONALIZADO/MODAS%20NATALI/TIENDA%20ONLINE/app/supabase/tienda_schema.sql): Esquema SQL completo (53 KB) e idempotente. Contiene:
  - Tablas: `tienda_pedidos`, `tienda_pedido_items`, `tienda_pedido_historial`, `tienda_pagos`, `tienda_webhook_eventos`, `tienda_gastos`, `tienda_gasto_categorias`, `tienda_kiosco_dispositivos`, `tienda_config`, `tienda_cambio_historial`.
  - Funciones atómicas: `tienda_crear_pedido`, `tienda_confirmar_pago`, `tienda_cambiar_estado`, `tienda_cancelar_pedido`, `tienda_vencer_reservas`, `tienda_guardar_cambio`.
  - Políticas de seguridad (RLS) que blindan los datos contra accesos no autorizados.
- `app/supabase/README.md`: Instrucciones para ejecutar y verificar el esquema.
- `app/supabase/contrato/`: Pruebas de contrato automatizadas que validan el esquema contra una base PGlite en memoria.

#### Scripts de Utilidad y Mantenimiento (`app/scripts/`)
- `aplicar-schema.mjs`: Aplica el SQL contra la base de datos de Supabase de forma segura.
- `verificar-schema.mjs`: Valida que todas las tablas y columnas necesarias existan.
- `prueba-completa-mp.mjs` y `verificar-mercadopago.mjs`: Validan la integración y el flujo de cobros de Mercado Pago.
- `generar-miniaturas.mjs` y `miniaturas-storage.mjs`: Script para procesar flyers y comprimir fotos a `.mini.webp`.
- `generar-seed.mjs`: Crea el catálogo simulado de 138 productos para pruebas locales.
- `precios-de-prueba.mjs` y `productos-prueba.mjs`: Carga lotes de prueba para verificación visual.
- `usuario-panel-prueba.mjs`: Genera credenciales de acceso para testing del panel.
- `comisiones-mp.mjs`: Calcula los descuentos reales de pasarela según el medio de pago.
- `servidor-local.mjs`: Levanta un backend mock para pruebas locales de funciones serverless.
- `compilar-real.ps1`: Script PowerShell de compilación para producción.

---

### 4.4. Código Fuente Frontend (`app/src/`)

#### Estilos y Tokens (`app/src/styles/` y `index.css`)
- `src/styles/tokens.css`: Definición de variables CSS del sistema de marca: superficies (`--color-crema`, `--color-superficie`), acentos (`--color-ciruela`), textos (`--color-tinta`, `--color-tinta-suave`), radios y sombras.
- `src/styles/fuentes.css`: Declaración de fuentes tipográficas locales y web.
- `src/styles/impresion-ticket.css`: Reglas de impresión para papel térmico continuo de 80 mm (72 mm de área imprimible, sin márgenes ni encabezados de navegador).
- `src/index.css`: Directivas de Tailwind v4 y estilos globales del viewport.

#### Núcleo de Aplicación (`app/src/app/`)
- `App.jsx`: Componente raíz; monta los proveedores de contexto y el router.
- `AppRoutes.jsx`: Registro maestro de rutas, asociando cada URL con su respectivo layout (`LayoutSitio`, `LayoutKiosco`, `LayoutPanel`).
- `navegacion.js`: Definición canónica de pantallas del panel (`PANTALLAS`), sus íconos, roles requeridos y agrupación en menú (`menu: 'principal' | 'mas'`).
- `Arranque.jsx` y `PrimeraCarga.jsx`: Pantalla inicial de carga de datos locales y sincronización de caché.
- `ConexionPildora.jsx`: Notificación visual fija en pantalla que advierte si la terminal está sin internet o con red lenta.
- `ErrorBoundary.jsx`: Atrapador de excepciones de React para evitar pantallas blancas ante errores imprevistos.
- `RutaKiosco.jsx`: Validador que restringe la ruta `/kiosco` únicamente a dispositivos activados con PIN.
- `ActualizacionPWA.jsx`: Alerta flotante que avisa a la usuaria cuando hay una nueva versión de la app lista para recargar.
- `layouts/LayoutSitio.jsx`: Cabecera pública, menú móvil, contenedor principal y pie de página de la tienda.
- `layouts/LayoutKiosco.jsx`: Layout a pantalla completa sin cabeceras web, con navegación adaptada a pulsaciones táctiles.
- `layouts/LayoutPanel.jsx`: Panel administrativo con sidebar colapsable en escritorio y barra de navegación inferior en celular.

#### Librerías de Lógica Pura (`app/src/lib/`)
Contiene 39 módulos puros, testeados y reutilizables:
- `moneda.js`: Formateo de moneda en bolivianos (`Bs 120,00`) y pesos (`$ 24`), funciones de conversión (`bsAPesosCent`, `totalEnPesos`).
- `fechas.js`: Manejo estricto de fechas y horas en zona horaria **America/La_Paz**.
- `pedido.js`: Estados válidos (`pendiente_pago`, `pagado`, `en_preparacion`, `listo_retiro`, `enviado`, `entregado`, `cancelado`, `reembolsado`) y máquina de estados.
- `colaPedidos.js`: Filtrado y ordenamiento de la cola "Para hacer hoy" en el panel.
- `carrito.js`: Lógica de adición, sustracción, límites de stock y cálculo de subtotales.
- `stock.js`: Algoritmos de cálculo de stock real considerando movimientos y reservas activas.
- `permisos.js`: Matriz de control de acceso basada en roles (`admin`, `enc_tienda`, `enc_ventas`, `enc_deposito`).
- `imprimir.js`: Orquestador de la llamada a `window.print` para comprobantes térmicos.
- `reportes.js` y `exportarExcel.js`: Generación de métricas de rendimiento y descarga de informes estructurados en Excel.
- `fotos.js` y `imagen.js`: Compresión de imágenes en el cliente mediante HTML5 Canvas antes de subirlas al Storage.
- `codigo.js`: Búsqueda flexible y normalización de códigos de modelo (ignora mayúsculas, guiones y espacios).
- `whatsapp.js`: Generador de enlaces `wa.me` con mensajes preformateados para atención personalizada.
- `seo.js`: Inyección dinámica de meta-tags, canonicals y datos estructurados JSON-LD.
- `offline.js` y `useConexion.js`: Detección en tiempo real del estado de la red del dispositivo.
- `pantallaCompleta.js`: API para fijar el kiosco en Fullscreen sin barras de navegador.
- `errores.js`, `cn.js`, `id.js`, `slug.js`, `colores.js`, `misPedidos.js`, `modoDemo.js`, `cobros.js`: Módulos utilitarios auxiliares.
- Tests unitarios: `carrito.test.js`, `catalogo-fotos.test.js`, `csp.test.js`, `fechas.test.js`, `id.test.js`, `lib.test.js`, `panel.test.js`, `pedido.test.js`, `reportes.test.js`.

#### Acceso a Datos y Sincronización (`app/src/data/`)
- `db.js`: Configuración de base de datos local Dexie (IndexedDB) con esquemas de tablas locales.
- `supabase.js`: Inicialización del cliente Supabase para navegador.
- `hooks.js`: Hooks de React (`useProductos`, `useCarrito`, `usePedido`, `useCambio`, `useGastos`, etc.) que conectan las vistas con los repositorios.
- `repos/index.js`: Selector dinámico que entrega la implementación `local` (Dexie) o `remoto` (Supabase) según las variables de entorno.
- `repos/local/`: Implementaciones que operan contra Dexie: `productos.js`, `pedidos.js`, `carrito.js`, `cambio.js`, `gastos.js`, `sitio.js`, `stock.js`, `kiosco.js`, `pagos.js`, `categorias.js`, `config.js`, `perfiles.js`.
- `repos/remoto/`: Implementaciones que operan contra las tablas y funciones de Supabase: `pedidos.js`, `cambio.js`, `gastos.js`, `kiosco.js`, `pagos.js`, `sitio.js`.
- `sync/SyncRunner.jsx`: Componente silencioso que sondea el tipo de cambio cada 20 segundos y despacha eventos de actualización.
- `sync/cola.js`, `publico.js`, `remoto.js`: Lógica de sincronización en cola para terminales con conexión inestable.
- `seed/productos.json`: Base de 138 productos de indumentaria precargados para demostración y pruebas.
- `seed/cargar.js` y `perfiles.js`: Inyectores de datos semilla para el entorno local.

#### Componentes UI Reutilizables (`app/src/components/ui/`)
Componentes visuales puros construidos con Tailwind v4:
- `Button.jsx`: Botón accesible con variantes tonales, primarias y secundarias.
- `BotonLink.jsx`: Enlace semántico estilizado como botón interactivo.
- `Input.jsx` y `Select.jsx`: Controles de formulario con soporte de estados de error y accesibilidad ARIA.
- `Modal.jsx` y `Sheet.jsx`: Diálogos modales y paneles desplegables laterales accesibles con captura de foco y tecla Escape.
- `Badge.jsx` y `Chip.jsx`: Indicadores de estado visuales y chips seleccionables.
- `BuscadorLista.jsx`: Campo de búsqueda en vivo con botón para limpiar consulta.
- `Tabs.jsx`: Pestañas accesibles para navegación interna de pantallas.
- `Toast.jsx`: Notificaciones emergentes temporales de éxito o advertencia.
- `EmptyState.jsx` y `ErrorState.jsx`: Vistas de estado vacío o mensaje de error amigable.
- `Skeleton.jsx`: Efecto de carga esqueleto para transiciones visuales suaves.
- `estilos.js` e `index.js`: Exportación unificada de recetas de clases CSS.
- `components/Logo.jsx`: Renderizador del logotipo de la marca.

#### Módulos Funcionales (`app/src/features/`)

##### 1. `features/sitio/` (Portal Público)
- `InicioPage.jsx` y subcomponentes en `inicio/`: Página de inicio con portada editorial, carrusel de categorías destacadas, vitrina de novedades, sección "Cómo comprar" y bloque de ubicación física.
- `Cabecera.jsx` y `MenuMovil.jsx`: Barra de navegación superior responsive (dos filas en móvil, deslizables con el scroll para no invadir la pantalla).
- `Pie.jsx`: Pie de página con enlaces institucionales, datos fiscales y horarios de atención.
- `QuienesSomosPage.jsx`: Narrativa sobre la historia de Modas Naty, su taller y fotografías del local.
- `ContactoPage.jsx`: Información de contacto directo, mapa interactivo y botón de mensajería instantánea.
- `LegalPage.jsx`: Términos de compra, política de cambios y aviso de privacidad.
- `BotonWhatsApp.jsx`: Botón flotante para asistencia en tiempo real.
- `AvisoSinConexion.jsx`: Banner discreto que advierte al visitante sobre la pérdida de red.
- `NoEncontradaSitio.jsx`: Página 404 con diseño de marca para redirección al catálogo.

##### 2. `features/catalogo/` (Catálogo y Productos)
- `tienda/CatalogoPage.jsx`: Catálogo público con filtros por categoría, selector de orden (precio, novedad, nombre) y buscador en vivo.
- `tienda/ProductoPage.jsx`: Ficha técnica del modelo, galería de fotos con zoom, selector de color/talle, indicador de stock disponible y botón de agregado.
- `tienda/FiltrosCatalogo.jsx`: Barra lateral de filtrado con conteo de prendas por categoría.
- `tienda/MiniCarrito.jsx`: Notificación lateral rápida que aparece al agregar una prenda.
- `tienda/useScrollConservado.js`: Hook que retiene la posición de scroll y tandas al explorar el catálogo.
- `BuscadorPage.jsx`, `GrillaProductos.jsx`, `ProductoCard.jsx`: Grilla adaptativa (2 columnas en celular, 4 en escritorio).
- `ColoresChips.jsx`, `Precio.jsx`, `PrecioDoble.jsx`, `Galeria.jsx`, `Foto.jsx`: Componentes atómicos de producto.
- `admin/AdminListado.jsx`: Vista del listado de productos para el personal del local (modo consulta para encargadas, modo edición para admin).
- `admin/ProductoFormPage.jsx`: Formulario de alta y modificación de productos (precios minoristas, fotos y colores).
- `admin/ImportarPage.jsx`: Carga masiva de prendas mediante planillas de Excel y paquetes de fotos.
- `admin/CategoriasPage.jsx`: ABM y ordenamiento de categorías de catálogo.

##### 3. `features/carrito/` (Bolsa de Compras)
- `CarritoPage.jsx`: Pantalla de revisión del carrito, modificación de cantidades, cálculo de subtotales y advertencias.
- `LineaCarrito.jsx`: Fila de producto con imagen miniatura, color seleccionado, precio bimoneda y botón para quitar.
- `AvisoCambio.jsx`: Banner interactivo que alerta a la compradora si el tipo de cambio varió mientras navegaba.
- `useCarrito.js`: Hook reactivo que administra el estado del carrito en memoria y en IndexedDB.

##### 4. `features/checkout/` (Proceso de Compra)
- `CheckoutPage.jsx`: Formulario ágil de compra como invitada (nombre, teléfono WhatsApp, correo, método de retiro o envío a domicilio) con validación mediante esquemas Zod.
- `BotonPagar.jsx`: Disparador de compra que invoca la función serverless de Checkout Pro y redirige a Mercado Pago.
- `PedidoPage.jsx`: Pantalla de confirmación tras el pago con sondeo automático del estado real del pedido.
- `SeguimientoPage.jsx`: Consulta pública de estado de pedido ingresando el código (`TN-000123`) y el teléfono celular.
- `DetallePedido.jsx`: Resumen desglosado con detalle de prendas, precios aplicados, entrega y medios de pago.
- `PasarelaPrueba.jsx`: Simulador de pago para modo demostración.

##### 5. `features/kiosco/` (Terminal Físico de Autogestión)
- `BienvenidaPage.jsx`: Portada táctil atractiva ("Tocá para empezar") para iniciar la experiencia en el local.
- `CatalogoKiosco.jsx` y `ProductoKiosco.jsx`: Catálogo táctil con botones grandes (mínimo 56 px) sin efectos de hover.
- `CarritoKiosco.jsx` y `ConfirmarKiosco.jsx`: Resumen de compra táctil optimizado para operar sin teclado físico (teclado virtual en pantalla).
- `PagarPage.jsx`: Selección de modalidad de cobro presencial: "Pagar con QR" en pantalla o "Pagar en caja".
- `Ticket.jsx`: Formato de ticket térmico de 80 mm con código QR para retiro de mercadería.
- `GraciasPage.jsx`: Agradecimiento en pantalla y reinicio automático tras 15 segundos.
- `AccesoEncargada.jsx`: Acceso secreto protegido por PIN (presión mantenida de 3 s) para mantenimiento, reimpresión y prueba de impresora.
- `ActivarPage.jsx`: Configuración y vinculación inicial de la terminal POS mediante PIN de seguridad.
- `useInactividad.js`: Temporizador que limpia el carrito y vuelve a la bienvenida tras 90 segundos sin actividad táctil.

##### 6. `features/panel/` (Administración General)
- `inicio/InicioPanelPage.jsx`: Dashboard ejecutivo con ventas del día, ventas del mes, margen estimado, alertas de stock bajo y cola de pedidos pendientes.
- `pedidos/PedidosPage.jsx`: Listado integral de pedidos con filtros por estado, fecha y origen (Web / Kiosco).
- `pedidos/PedidoDetalle.jsx`: Ficha completa del pedido con historial de auditoría de cambios y accesos de reimpresión.
- `pedidos/CambiarEstado.jsx`: Modal para actualizar estado (preparando, listo para retiro, despachado, entregado).
- `pedidos/PagosPorConfirmar.jsx`: Lista de cobros pendientes en efectivo o transferencias manuales para aprobación.
- `gastos/GastosPage.jsx`: Registro y cuantificación de egresos del negocio clasificados por rubro, con opción de adjuntar comprobante.
- `reportes/ReportesPage.jsx`: Análisis visual de ventas por medio de pago, margen comercial y exportación estructurada a Excel.
- `configuracion/ConfiguracionPage.jsx`: Configuración centralizada: textos del portal, tipo de cambio bimoneda, costos de envío por ciudad, pasarela y parámetros del kiosco.
- `usuarios/UsuariosPage.jsx`: Administración de cuentas internas y asignación de permisos según el rol.
- `cobros/CobrosPage.jsx` y `GuiaMercadoPagoPage.jsx`: Panel de seguimiento de transacciones de pasarela y conciliación de comisiones.

##### 7. `features/inventario/` (Control de Stock)
- `InventarioPage.jsx`: Monitoreo de existencias en tiempo real con alertas de stock crítico.
- `MovimientoSheet.jsx`: Panel deslizante para asentar entradas, salidas y ajustes de stock manuales con motivo.
- `ImportarStockPage.jsx`: Actualización masiva de inventario mediante carga de planillas.

##### 8. `features/auth/` (Autenticación y Seguridad)
- `LoginPage.jsx` y `LoginRemoto.jsx`: Pantalla de inicio de sesión administrativo alojada en `/administracion`.
- `AuthProvider.jsx` y `AuthProviderRemoto.jsx`: Manejo de sesión persistente con tokens de Supabase Auth.
- `RutaProtegida.jsx`: Guardián de rutas que verifica sesión activa y valida permisos del rol antes de renderizar la pantalla.

##### 9. `features/ayuda/` (Manuales Integrados)
- `GuiaClientePage.jsx`: Ayuda visual rápida para compradores sobre cómo realizar compras y seguimientos.
- `GuiaPanelPage.jsx`: Instructivo interactivo integrado para el personal del local sobre uso diario del panel.
- `GuiaLayout.jsx`, `contenidoCliente.js`, `contenidoPanel.js`: Estructura y textos de soporte en pantalla.

---

## 5. Decisiones Tomadas y Estado Actual del Trabajo

### Decisiones de Arquitectura Consolidadas
1. **Mercado Pago en ARS (Zona Fronteriza)**: La tienda cobra en pesos argentinos mediante Mercado Pago Argentina y en efectivo/transferencia en bolivianos o pesos.
2. **Catálogo Compartido sin Duplicación**: La tienda lee la tabla `naty_productos` del sistema de notas de venta, enriquecida con los campos de tienda (`precio_unidad_bs_cent`, `publicado_tienda`, `destacado`, `slug`).
3. **Netlify Functions para Operaciones Críticas**: Los cobros, webhooks y vencimiento de reservas se procesan del lado del servidor para garantizar que ninguna credencial privada quede expuesta en el frontend.
4. **Offline-First para el Punto de Venta**: La terminal de kiosco retiene los catálogos en caché y puede emitir tickets para pago en caja incluso durante microcortes de conectividad.
5. **Horario Unificado de La Paz**: Todo reporte, registro de auditoría e impresión opera sobre la zona horaria de Bolivia (`America/La_Paz`).

### Estado de Etapas y Pendientes de Salida
- **Etapas 0 a 4 (Bases, Sitio, Catálogo, Checkout y Backend)**: 100% completadas y verificadas con pruebas automáticas.
- **Etapa 6 (Kiosco)**: Flujo de software, tickets y tiempos de inactividad terminados. *(Pendiente de prueba en el hardware táctil físico final de Natali).*
- **Etapa 7 (Panel Administrativo)**: Panel completamente operativo (pedidos, productos, gastos, reportes, configuración bimoneda y usuarios).
- **Etapa 5 (Pagos)**: Adaptador y webhook listos. Probado exitosamente con cuenta de prueba de Mercado Pago. *(Falta cargar las credenciales finales de la cuenta de Natali).*
- **Rediseño Visual (R1 a R3)**: Estilo editorial crema y ciruela aplicado, navegación optimizada para celulares y miniaturas generadas.
- **Etapa 9 (Puesta en Marcha Final)**: Pendiente de sesión de validación con Natali, vinculación del dominio comercial propio (`.com` o `.com.bo`) y migración final a la cuenta de Supabase definitiva de la clienta.
