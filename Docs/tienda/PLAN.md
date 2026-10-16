# Plan de trabajo: catálogo y pedido mayorista de Modas Naty dentro del sistema de nota

Versión 2, consolidada tras el duelo Claude vs Codex del 2026-10-15 (3 rondas, consenso; sesión `20261015-1700-catalogo-mayorista-en-sistema-de-nota`).
Rama: `feature/tienda-online` (sale de `origin/main`). Material reciclable: `tienda-origen/` (copia literal de la tienda online, commit 3142b20; no compila).
Método: etapas con tareas y pasos tachables. `[ ]` pendiente · `[~]` en curso · `[x]` hecho con fecha · `[!]` bloqueado. **Cada etapa nueva arranca solo con OK explícito de Facundo.**

---

## 0. Reglas inviolables (la base de Renzo ya tiene datos reales y está en uso)

1. **Cero cambios a objetos `naty_*` existentes**: ni columnas, ni enums, ni funciones, ni políticas, ni datos, ni triggers (por eso no hay claves foráneas hacia sus tablas). Solo objetos nuevos con prefijo `tienda_`.
2. **No se aplica nada a la base real** sin: backup, dry-run con rollback, línea base de objetos y OK de Facundo y de Renzo.
3. **Todo se prueba primero en staging** (proyecto Supabase aparte y PGlite). Staging se abre en **otro origen web o en un perfil de navegador vacío**: la IndexedDB de Renzo se llama siempre `modas-naty` y puede tener ventas pendientes que se enviarían al backend equivocado.
4. **El código de Renzo se toca lo mínimo** y cada edición queda en `Docs/tienda/CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`. Previstas solo dos: `App.jsx` (montar la tienda antes del arranque interno) y `Ajustes` (un acordeón nuevo).
5. **Dueño único por dato**: productos, fotos, precios y tipo de cambio son del sistema de nota. La tienda los lee por vistas `tienda_*`, no los duplica.
6. **Sin secretos en git.**
7. **El commit `0b8899b` de `main` local NO se usa** (modifica `naty_productos`). No se pushea.
8. **La tienda nunca reutiliza** `config.guardar`, `SyncRunner`, `prepararBase`, `obtenerSupabase` ni `aplicar-schema.mjs` de Renzo.

---

## 1. Decisiones del duelo (cerradas)

| # | Decisión | Motivo |
|---|---|---|
| D1 | **No se extiende `/c`.** La tienda vive en la raíz `/` (antes se pensó `/tienda`, ver D20) y `/c` solo redirige a `/` | `/c` depende del caché local y del `SyncRunner` con usuario: un navegador anónimo no obtiene catálogo |
| D2 | La tienda pública se monta **antes** de `Arranque`, `AuthProvider`, `PrimeraCarga` y `SyncRunner` (edición mínima en `App.jsx`) | `prepararBase` puede borrar `modas-naty`; `SyncRunner` puede enviar pendientes |
| D3 | **Cliente Supabase público propio**: `persistSession:false`, `autoRefreshToken:false`, `detectSessionInUrl:false` | El cliente de Renzo hereda la sesión interna |
| D4 | "Publicado" = producto activo con al menos una foto. Tabla `tienda_oculto(producto_id uuid pk)` **sin FK**, para ocultar | Evita tocar su ficha de producto y evita triggers sobre `naty_productos`. Ocultar es **editorial, no confidencial**: `naty_catalogo_publico` y el bucket siguen públicos |
| D5 | **Sin disponibilidad ni stock en V1.** El vendedor confirma al responder | El agregado sobre movimientos filtra stock indirecto y agrega costo sin medir |
| D6 | **Sin pedidos guardados en V1.** Solo mensaje de WhatsApp | Sin escritura anónima, sin superficie de abuso |
| D7 | Contactos: **lista curada** dentro de `tienda_config`, no vista sobre `naty_perfiles` | `telefono` puede ser personal y no hay bandera "publicar" |
| D8 | Configuración propia: `tienda_config(clave pk, valor jsonb, publico boolean)`. Lectura `anon` y `authenticated` solo con `publico = true`; admin lee y escribe todo vía `naty_es_rol('admin')` | No se escribe en `naty_config` |
| D9 | Vistas nuevas: `tienda_catalogo_publico` y `tienda_ajustes_publicos`, con **lista blanca de campos** (incluso dentro de JSON). `REVOKE ALL ... FROM PUBLIC, anon, authenticated` y luego `GRANT SELECT` | Una vista simple sobre `naty_config` puede ser actualizable |
| D10 | Cálculos: se **importan** `lib/docenas.js` y `features/ventas/calculos.js` de Renzo detrás de `precioPublico()` con guardas | Heredar su orden de redondeo (unitario primero, subtotal después) y las 12 unidades fijas. Se deja de leer `unidades_por_docena` |
| D11 | Precio oculto (`null`) = "A consultar". Sin totales ni importe de transferencia. Tasas inválidas = solo USD | `convertirDesdeUsd(null)` da cero |
| D12 | Fotos: URLs existentes, absolutas o relativas al bucket (como `remoto.js:123`). **No se asume `.mini.webp` ni se escribe en `naty_productos`** | No hay generador de miniaturas en Renzo |
| D13 | Mapa = **enlace https** validado con `new URL()` (protocolo, hostname y pathname por separado, sin credenciales). Sin iframe, sin CSP nueva | Renzo no declara CSP |
| D14 | WhatsApp: host fijo, teléfono solo dígitos, `encodeURIComponent`. **Nunca se trunca en silencio**: si es largo, "Copiar pedido completo" y mensaje breve. Un envío no es reserva ni pago | Evita total que no coincide con las líneas |
| D15 | Caché de datos propia (`tienda-v1`, con backend y fecha). Se revalida catálogo, cambio y contacto antes de armar el mensaje. Si falla, no se presenta como precio confirmado | No se toca el service worker compartido |
| D16 | `url_catalogo` lo carga **Natali a mano** desde Ajustes de Renzo. Nunca en un script ni en una migración | Es uso normal de su producto, no una migración nuestra |
| D17 | Ejecutor nuevo `app/scripts/aplicar-tienda.mjs`: archivo y destino explícitos, TLS validado, rollback por defecto, `lock_timeout` y `statement_timeout` | `aplicar-schema.mjs` fija `naty_schema.sql` y desactiva la validación TLS |
| D18 | **Marca real en los dos sistemas** (etapa E4b): los logos de la tienda original se suben al sistema de Renzo | Renzo nunca los usó: su app muestra un monograma "MN" y su logo se carga desde Ajustes |
| D19 | El logo de Ajustes (nota de venta y panel interno) se sube **desde la pantalla de Ajustes**, no por script. Los íconos de la app instalada sí son archivos y se reemplazan por commit | Es dato de producción en un caso y código versionado en el otro |
| D20 | **Mapa del sitio**: la tienda pública vive en la raíz `/` y el sistema de notas y stock de Renzo en `/admin`, en un único sitio de Netlify. **Dominio oficial de la tienda (16/10): `https://modasnaty.onelabs.pro`**, que hoy apunta por CNAME al sitio `modasnaty-tienda.netlify.app` (la tienda vieja). Al publicar, ese dominio se agrega como dominio personalizado del sitio donde vive el sistema y el CNAME se apunta ahí; `modas-naty.netlify.app/admin` sigue funcionando | Un solo despliegue para las dos cosas; la clienta usa el dominio propio y el equipo puede seguir con el de Netlify. El QR de las notas ya manda al dominio propio |
| D21 | La app instalada (PWA) es la del equipo: `start_url` y `scope` pasan a `/admin/`. Un ícono viejo que abra la raíz en modo instalado redirige a `/admin/`. La tienda no ofrece instalarse. El `/c` viejo redirige a `/` | Renzo y su equipo la usan todos los días: no puede quedar apuntando a la tienda |
| D22 | **Tienda cerrada al público (mantenimiento)**: clave `tienda` en `tienda_config` (`{cerrada, mensaje}`). Cerrada, o sin la tabla todavía en la base, la raíz muestra una pantalla con WhatsApp y locales; `/admin` no se toca; `?previa=1` deja ver la tienda al equipo. Sin interruptor en el Gestor web (Facundo, 16/10): se cambia por el script de carga | El sistema del equipo es offline-first y no necesita mantenimiento. La tienda pública queda cubierta sola durante la publicación: hasta que se aplica el esquema y se carga la configuración, la clienta ve la pantalla de preparación |
| D23 | **Vendedores automáticos**: los contactos de la tienda y las opciones de vendedor al pedir salen de `naty_perfiles` (rol vendedor/a, activos, con teléfono) por la vista `tienda_vendedores_publicos`; `tienda_config.contactos` queda solo de respaldo | Pedido de Facundo (16/10): una sola fuente, la de Usuarios. Solo se publican nombre y teléfono, que ya salen impresos en la nota |
| D24 | **Textos editables por página**: clave `tienda_config.textos` con un catálogo fijo de campos agrupados por página y sección, con los mismos nombres que ve la clienta (`lib/textos.js`) | Pedido de Facundo (16/10): que todo lo que se ve se pueda cambiar desde el Gestor y se entienda qué se cambia |

---

## 2. Qué pidió la clienta (desgrabación del 2026-10-15)

| # | Pedido | Etapa |
|---|---|---|
| P1 | Catálogo para ver, elegir y comprar. No es una landing ni deja datos | E2, E3 |
| P2 | Sin color. Se vende por fardo: media docena, docena o cuántas docenas | E2, E3 |
| P3 | "Cómo comprar": mirá el catálogo, abrí el modelo, elegí cantidad, pasá por el local o coordiná con tu vendedor | E4 |
| P4 | Pago solo por transferencia o efectivo. Online siempre transferencia, con los datos a la vista | E3 |
| P5 | Tras transferir, coordinar con la encargada o el vendedor por WhatsApp | E3 |
| P6 | La clienta elige **"vendedor"** (no "asesor") | E3 |
| P7 | Retirar o recibir, coordinado con el vendedor | E3, E4 |
| P8 | Dos locales con dirección, horarios (lunes a sábado), teléfonos | E4 |
| P9 | Ubicación para quien cruza la chalana de Bermejo | E4 |
| P10 | Precios en **USD**, convertidos a Bs y ARS con el tipo de cambio que ella carga | E2 |
| P11 | Un solo stock y un solo lugar de carga | E6 |
| P12 | Desde la nota de venta se entra al catálogo | E5 |
| P13 | Diseño fiel a la referencia hecha con IA | E7 |

---

## 3. Qué se recicla de `tienda-origen/` y qué se descarta

| Se recicla (copiar y adaptar en `app/src/features/tienda/`) | Se descarta en V1 |
|---|---|
| Tokens crema y ciruela (`DESIGN.md`, `styles/tokens.css`) | Mercado Pago (`checkout`, `webhook`, `reembolso`, `reconciliar`) |
| `catalogo/tienda/*`: grilla, filtros, ficha, `useScrollConservado` | Kiosco completo |
| `sitio/*`: inicio, quiénes somos, contacto, legales, pie, `BotonWhatsApp` | Panel de pedidos, cobros, gastos, reportes |
| `carrito/*` (adaptado a docenas) | Comprobante PDF y correo |
| `lib/whatsapp.js` (con las validaciones de D14), `lib/seo.js`, `lib/slug.js` | Tablas `tienda_pedidos`, `tienda_pagos`, `tienda_kiosco_*` |
| `ayuda/*` (reescrita) | Tipo de cambio versionado propio |
| Tests de `carrito` y `seo` | Login y usuarios de la tienda |

Nota de seguridad al reciclar: `ContactoPage.jsx` pasa enlaces editables directo a `href`. Se reemplaza por la validación de D13.

---

## Etapa E0 · Terreno seguro (3 h)
- [x] E0.1 (15/10) Rama desde `origin/main`.
- [x] E0.2 (15/10) Copia literal en `tienda-origen/`, sin secretos ni fotos demo.
- [x] E0.3 (15/10) Acceso confirmado al proyecto `bulcbrgafrfklaejfyjd` (PostgreSQL 17, São Paulo) por el pooler de sesión, con TLS validado contra la CA raíz de Supabase. **Respaldo de solo lectura hecho**: 11 tablas, 534 filas, con huella SHA-256, en `C:\respaldos\modas-naty-2026-10-15` (fuera del repo, contiene datos reales). No incluye los 47 archivos del bucket ni las cuentas de acceso.
- [x] E0.4 (15/10) Staging **local en PGlite** con el esquema real de Renzo (ya probado en `probar-herramientas.mjs`). Un proyecto Supabase de staging queda como opcional si hace falta probar Storage y Auth reales.
- [x] E0.5 (15/10) Línea base real guardada en `Docs/tienda/linea-base-ANTES.json` y resumida en `Docs/tienda/linea-base.md`.
- [x] E0.6 (15/10) `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md` creado.
- [ ] E0.7 Staging con `.env.local` propio **y** otro origen o perfil de navegador vacío. Verificar en DevTools que `modas-naty` no se comparte.
- [x] E0.8 (15/10) `Docs/tienda/herramientas/iniciar-dev.bat` monta el repo como `S:` y corre con `--root S:\app`. Verificado: 118 tests OK en tres corridas seguidas (una corrida aislada dio 2 fallas por lentitud y no se repitió).

Criterio: línea base y respaldo en mano, la app corre contra staging y los 118 tests pasan.

## Etapa E1 · Esquema aditivo y ejecutor seguro (6 h)
Estado 15/10: **hecha en local y verificada contra el esquema real de Renzo**. Lo único que falta toca producción y lo hago yo en Supabase cuando haya acceso (E1.9 y el dry-run real).

- [x] E1.1 (15/10) `Docs/tienda/CONTRATO.md`: qué lee la tienda de `naty_*`, qué nunca lee y qué le pedimos a Renzo.
- [x] E1.2 (15/10) `app/supabase/tienda_schema.sql`, idempotente, solo objetos `tienda_*`: tablas `tienda_config` y `tienda_oculto` (sin clave foránea), vistas `tienda_catalogo_publico` y `tienda_ajustes_publicos`. Sin ALTER TYPE, sin extensiones, sin triggers sobre `naty_*`, sin DELETE ni TRUNCATE. Guardia de prerrequisito: falla con mensaje claro si falta `naty_schema.sql`.
- [x] E1.3 (15/10) Políticas y privilegios explícitos. `tienda_config`: lectura pública solo de `publico = true`, la administración lee y escribe, **nadie borra**. `tienda_oculto`: solo administración, sin borrado (mostrar de nuevo es `oculto = false`). Vistas con `security_barrier` y lista blanca de columnas, incluso dentro del JSON.
- [x] E1.4 (15/10) `app/scripts/aplicar-tienda.mjs`: guardia estática, una transacción, `lock_timeout` 5 s, `statement_timeout` 60 s, TLS validado, **prueba y revierte por defecto**, y revierte solo si la foto de `naty_*` cambió.
- [x] E1.5 (15/10) Pruebas en PGlite: `naty_schema.sql` y después `tienda_schema.sql`, dos veces cada uno.
- [x] E1.6 (15/10) Diff de catálogo `naty_*` antes y después: **vacío** (estructura, permisos, políticas, funciones, triggers y datos).
- [x] E1.7 (15/10) Matriz de roles, un principal por vez: anon, vendedor, depósito, admin y superadmin. Verifica denegación de INSERT, UPDATE, DELETE y TRUNCATE donde corresponde.
- [x] E1.8 (15/10) Rollback probado: la prueba revierte, un error revierte, y un cambio sobre `naty_*` que la guardia no vio también revierte.
- [x] E1.9 (15/10) **Contra producción, solo lectura y revertido**: dry-run real del esquema (4 objetos nuevos, `naty_*` sin cambios, nada quedó aplicado) y vistas probadas con el rol anónimo real de Supabase sobre los 45 productos reales. Queda pendiente enviar `CONTRATO.md` a Renzo.

Resultado: 19 pruebas nuevas, 137 en total (118 de Renzo más estas), tres corridas del esquema sin error.
Criterio cumplido en local: diff `naty_*` vacío, rollback limpio y matriz de roles en verde.

## Etapa E2 · Rutas públicas y catálogo (8 h)
Estado 15/10: **hecha en código y verificada** (18 pruebas nuevas, 155 en total, lint limpio, build OK, el chunk de la tienda pesa 15 kB y se carga solo en `/tienda`). Todavía **no se vio contra datos reales en un navegador**: las vistas `tienda_*` no existen en producción hasta E9, y el dry-run ya las validó con los 45 productos reales.

- [x] E2.1 (15/10) Edición mínima en `App.jsx`: la tienda (raíz `/`) y sus subrutas se montan antes de `Arranque`, `AuthProvider`, `PrimeraCarga` y `SyncRunner` (carga diferida). Registrada en `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`.
- [x] E2.2 (15/10) `features/tienda/data/clientePublico.js` (sin sesión, sin renovación, sin leer la URL) y repositorio. **Ajustado en E7**: el catálogo se trae completo en una consulta (tope de 1000 modelos) y se filtra, cuenta y ordena en el navegador, porque la referencia pide total de modelos, conteos por categoría y orden. Con unas decenas o pocas centenas de modelos es más simple y rápido que paginar.
- [x] E2.3 (15/10) Fotos absolutas y relativas al bucket. Solo se aceptan `https`; el resto se descarta.
- [x] E2.4 (15/10) `precioPublico()` importa las funciones de Renzo y hereda su redondeo. Precio oculto es "a consultar", tasa inválida deja solo USD, tasa de ejemplo muestra solo USD.
- [x] E2.5 (15/10) Catálogo y ficha: búsqueda con espera, filtro por categoría, "Ver más", galería, sin color. Usa los componentes y colores de Renzo; el diseño final llega en E7.
- [x] E2.5b (15/10) Al volver de una ficha se recuperan la lista ya cargada, la búsqueda, la categoría y la posición. La memoria es de la pestaña y vence a los 5 minutos para no dejar precios viejos.
- [x] E2.6 (15/10) Etiquetas "Docena (12)" y "Media docena (6)". El mínimo de media docena se aplica en el carrito (E3).
- [x] E2.7 (15/10) Caché propia `tienda-v1` por origen, con aviso "sin conexión" y sin presentar la caché como precio vigente.
- [~] E2.8 Título por producto hecho. **Falta** la vista previa al compartir por WhatsApp: en una SPA necesita una función de servidor o prerender. Decisión pendiente para E7 o E9.
- [x] E2.9 (15/10) Pruebas: rutas, precios (incluido el caso 101 centavos por 1,5), fotos con protocolos peligrosos, filtros, paginación, caché rota y enlace de WhatsApp.

Criterio: un navegador limpio carga la tienda (`/`) sin tocar la base local de Renzo (cumplido por construcción), y el precio coincide con la nota (cumplido en pruebas; falta verlo en pantalla con datos reales).

## Etapa E3 · Pedido y contacto con el vendedor (8 h)
Estado 15/10: **hecha en código y verificada** (17 pruebas nuevas, 172 en total, lint limpio, build OK, el chunk de la tienda pasó a 31 kB). Igual que E2, falta verla en un navegador con datos reales, que depende de aplicar el esquema (E9).

- [x] E3.1 (15/10) Carrito propio en `localStorage` con versión y clave propia, compartido entre pestañas. Nada de tablas Dexie de Renzo. Un almacenamiento roto da un carrito vacío.
- [x] E3.2 (15/10) Reconciliación: al abrir "Mi pedido" se consultan los productos vigentes. Un modelo que ya no está bloquea el envío, y si cambió el precio se avisa.
- [x] E3.3 (15/10) "Tu pedido": líneas con cantidad en pasos de media docena, total en la moneda elegida o "a confirmar". El total solo existe si TODAS las líneas tienen precio vigente.
- [x] E3.4 (15/10) Selector de vendedor desde `tienda_config.contactos`, validado. Si no hay lista cae en `whatsapp_tienda`. Con más de un vendedor hay que elegir uno.
- [x] E3.5 (15/10) Pago: transferencia (banco, titular, cuenta, alias, con botón copiar) o efectivo en el local. Si falta la configuración dice "pedile los datos a tu vendedor".
- [x] E3.6 (15/10) Entrega: retiro (con elección de local si hay más de uno) o recibir, siempre "a coordinar".
- [x] E3.7 (15/10) "Enviar por WhatsApp" y "Copiar pedido completo". **Nunca se recorta**: si no entra en el enlace, sale un mensaje breve y la persona pega el detalle completo.
- [x] E3.8 (15/10) Aclaración visible: enviar no reserva ni cobra, y después de transferir se manda el comprobante al mismo vendedor.
- [x] E3.9 (15/10) Sin conexión: se conservan las cantidades y los importes quedan "a confirmar", sin usar precios viejos como vigentes.
- [x] E3.10 (15/10) Pruebas: almacenamiento manipulado, duplicados, máximo, producto que desaparece, precio oculto, cambio de precio, tasa inválida, texto con tildes, pedido de 40 modelos, teléfono inválido.

**Para que funcione con datos reales** hace falta que alguien cargue en `tienda_config` (claves públicas): `contactos` (lista de nombre y teléfono), `transferencia` (banco, titular, cuenta, alias, nota) y `locales` (lista de nombre). Eso lo hace la pantalla de edición de E4.

Criterio: un pedido de ejemplo sale por WhatsApp con todos los datos correctos y sin escribir nada en la base (cumplido en pruebas).

## Etapa E4 · Información del negocio y edición (5 h)
Estado 15/10: **hecha en código y verificada** (14 pruebas nuevas, 186 en total, lint limpio, build OK).

- [x] E4.1 (15/10) "Cómo comprar": pasos por defecto tomados de lo que pidió la clienta, reemplazables desde Ajustes.
- [x] E4.2 (15/10) "Dónde estamos": locales con dirección, indicaciones para llegar y botón de mapa. El enlace solo se acepta si es https de Google Maps (se valida con `new URL()` por partes, sin credenciales ni puertos), tanto al guardar como al leer.
- [x] E4.3 (15/10) Horarios y contactos con WhatsApp, desde `tienda_config`.
- [x] E4.4 (15/10) Editor en la pantalla **Ajustes** de Renzo: vendedores y contactos, datos de transferencia, locales, horarios y pasos. Escribe solo en `tienda_config` con el cliente autenticado, nunca en `naty_config`. **Se oculta solo** mientras la tabla no exista en la base. Una línea de import y un bloque en `AjustesPage.jsx`, registrados.
- [x] E4.5 (15/10) Todo texto editable se muestra como texto, nunca como HTML.
- [ ] E4.6 Textos legales (cambios y devoluciones), con lo que apruebe Natali.

Criterio: Natali cambia un horario o un teléfono desde Ajustes y se ve en la tienda sin tocar código (cumplido en código; se ve en pantalla recién cuando el esquema esté aplicado).

## Etapa E4b · Marca coherente en los dos sistemas (3 h)
Estado 15/10: **hecha en código**. Queda un paso manual de Natali (el logo de Ajustes) y verlo en un celular real.

- [x] E4b.1 (15/10) `imagotipo.png` e `isotipo.png` en `app/public/brand/`.
- [x] E4b.2 (15/10) Mapa de la marca en Renzo: `Logo.jsx` y `useMarca` (logo de Ajustes, clave `logo`), encabezado de la nota, `FaviconDinamico`, `favicon.svg`, cuatro íconos PWA y el manifiesto. El color `#8a3a63` del manifiesto ya coincide con la ciruela de la tienda.
- [x] E4b.3 (15/10) La tienda usa `brand/isotipo.png` con ancho y alto fijos, sin depender de la configuración de Renzo.
- [ ] E4b.4 **Logo de Ajustes** (nota de venta y encabezado interno): lo sube Natali o un admin **desde la pantalla Ajustes** con `imagotipo.png` (D19). Producción ya tiene una clave `logo` cargada: revisar cuál es antes de reemplazarlo.
- [x] E4b.5 (15/10) Íconos de la app instalada reemplazados por los de la tienda (192, 512, maskable y apple-touch, monograma dorado NM sobre crema). El maskable tiene margen de seguridad. El `favicon.svg` ahora embebe el logo real (48 px), así que `FaviconDinamico` sigue funcionando sin tocarlo.
- [x] E4b.6 (15/10) Un solo color de marca: `#8a3a63`.
- [ ] E4b.7 Verificación visual en dispositivos reales: nota A5 impresa con el logo, app instalada en un Android con el ícono nuevo, pestaña con favicon.
- [ ] E4b.8 Avisar a Natali: el ícono de una app ya instalada tarda en actualizarse y puede requerir reinstalar.

Criterio: misma marca en la nota impresa, el panel, la app instalada y la tienda.

## Etapa E5 · Enlace con la nota de venta (2 h)
Estado 15/10: **casi toda ya existe en el sistema de Renzo**. La nota imprime un QR con `url_catalogo` cuando está cargada. Falta cargarla y probar la impresión.

- [x] E5.0 (15/10) El texto de ayuda de Ajustes ahora sugiere `https://modas-naty.netlify.app/`. Los QR ya impresos con `/c` siguen funcionando por la redirección.
- [ ] E5.1 En staging, cargar `url_catalogo` **a mano desde Ajustes** (D16) y verificar que la nota A5 imprime el QR.
- [ ] E5.2 Escanear la nota impresa y en PDF con un celular.
- [ ] E5.3 Documentar para Natali el paso "cargar la dirección del catálogo", con capturas.
- [ ] E5.4 Backlog: "pasar el pedido de la clienta a una nota" (no V1).

## Etapa E6 · Un solo lugar de carga (3 h)
Estado 15/10: **hecha en código**. Falta verlo con datos reales (E9).

- [x] E6.1 (15/10) Un producto nuevo de Inventario aparece en la tienda sin pasos extra: la vista lee `naty_productos` y `naty_producto_fotos` directo. Con foto y activo, se publica.
- [x] E6.2 (15/10) Visibilidad por modelo: en Ajustes, lista con buscador y casilla "visible". Escribe solo en `tienda_oculto` y no borra nada (mostrar de nuevo es `oculto = false`). No toca la ficha de Renzo.
- [x] E6.3 (15/10) Las limpiezas del superadmin no dejan enlaces rotos: la vista filtra por existencia y `tienda_oculto` no tiene clave foránea. Las marcas huérfanas son inofensivas.
- [x] E6.4 (15/10) Sin conexión: la tienda muestra la última lista guardada con aviso y sin presentarla como precio vigente.
- [ ] E6.5 Dejar claro a Natali la diferencia: "oculto" saca el modelo de la tienda, pero sigue en `/admin/c` y en el bucket público.

## Etapa E7 · Diseño final con las imágenes de referencia (8 h)
Estado 15/10: **hecha para portada, catálogo, ficha y pedido** a partir de `Docs/tienda/referencias/00-referencia-inicio-y-catalogo-1440.png`. Capturas del resultado en `Docs/tienda/referencias/resultado/`. Solo hay referencia de escritorio de portada y catálogo; el resto de las pantallas hereda su estilo.

- [x] E7.1 (15/10) Referencia guardada en el repo.
- [x] E7.2 (15/10) Paleta tomada de la imagen por muestreo de píxeles: vino `#631B36`, terracota `#C26F4F`, coral `#D4958A`, rosa `#F6CBCB`, beige `#E3D6BF`, crema `#FBF4F1`. Acotada a `.tienda`: los colores del sistema interno no cambian.
- [x] E7.3 (15/10) Se construyó directo sobre los componentes existentes, sin copiar la referencia pixel a pixel:
  - encabezado con menú a la izquierda, logo al centro y búsqueda y pedido a la derecha;
  - portada con "Nueva temporada", modelo destacado y categorías con foto;
  - catálogo con barra lateral de categorías con conteos, buscador, total de modelos y orden;
  - tarjetas con "NUEVO" en vino, nombre, código y precio por docena;
  - formas orgánicas y hojas, en una capa a todo el ancho de la pantalla, por detrás del contenido.
- [x] E7.4 (15/10) Verificación visual con datos de ejemplo interceptados (80 modelos, sin tocar ninguna base) en 1440 y 390 px. Encontró y corrigió: fotos rechazadas por la validación estricta `https` (correcto), mancha vino pisando el menú y el título, manchas recortadas al ancho del contenido, grilla del celular más ancha que la pantalla.
- [x] E7.5 (15/10) Los colores del sistema de notas que usan el pedido y la ficha se reasignan a la paleta de la tienda, solo dentro de `.tienda`.
- [ ] E7.6 Accesibilidad con axe, foco por teclado y 320 px.
- [ ] E7.7 Rendimiento en celular con datos lentos (Lighthouse mayor a 80).
- [ ] E7.8 Revisión de Facundo y Natali sobre las capturas. Pendiente decidir sobre lo que la referencia muestra y no está en el plan:
  - "Quiénes somos" y "Contacto" en el menú: se reemplazaron por "Cómo comprar" y "Dónde estamos", que sí tienen contenido. Falta un texto de la historia de Modas Naty si lo quieren.
  - "Pagá en línea": no hay pago online en la V1 (transferencia y WhatsApp), se reescribió el texto.
  - Precios: la referencia muestra Bs y pesos; el sistema trabaja en dólares, así que la tarjeta muestra US$ y Bs, y la ficha las tres monedas.

Criterio: las pantallas se ven como la referencia en celular y escritorio (cumplido en capturas; falta la revisión visual de ustedes).

## Etapa E8 · Pulido y datos pendientes (3 h, más espera)
**Llegó el 15/10** (detalle en `Docs/tienda/DATOS-RECIBIDOS.md`): transferencia completa (titular, CUIT, CBU, alias y cuenta), las dos direcciones y el horario de cada local. Los datos bancarios están fuera del repo. El alias cambia cada 2 meses y Mercado Pago ya no funciona.

Sigue faltando, de lo que mencionó la desgrabación y de lo recién recibido:

| Dato | Para qué | Quién |
|---|---|---|
| Segunda dirección del local | E4.2 | Natali |
| Horarios exactos | E4.2 | Natali |
| Contactos a publicar (nombre y teléfono) con autorización | E3.4 | Natali |
| Datos de transferencia: banco, titular, cuenta, alias, QR | E3.5 | Natali |
| Pin de Google Maps de cada local | E4.2 | Natali |
| Textos de "Cómo comprar" con sus palabras | E4.1 | Natali |
| Si quiere ver pedidos guardados (hoy no, solo WhatsApp) | D6 | Natali |
| Si los precios se muestran o van "a consultar" (`mostrar_precios_publico`) | E2.4 | Natali |
| Dominio o subdominio | E9 | Natali |

- [ ] E8.1 Completar cada dato y tachar.
- [ ] E8.2 Revisión de ortografía y tono.
- [x] E8.3 (15/10) `Docs/tienda/GUIA-PARA-NATALI.md`: qué datos juntar, dónde cargarlos en Ajustes y preguntas frecuentes, en lenguaje simple.

## Etapa E9 · Salida a producción (5 h, más espera)
Requiere OK de Facundo **y** de Renzo. El procedimiento paso a paso, con comandos y vuelta atrás, está en `Docs/tienda/PUBLICACION.md`. Antes de arrancar se cierran los cinco puntos de evidencia de producción:

- [ ] E9.0a **Contrato desplegado**: propietario y opciones de las vistas existentes, RLS, grants, privilegios por defecto y esquema expuesto (con `auditor-backend`, en solo lectura).
- [ ] E9.0b **Service worker y hosting**: scope, versión activa, cachés y headers efectivos en dispositivos reales. Verificar entrada a `/tienda` desde un shell anterior.
- [ ] E9.0c **Fotos**: formato de rutas y accesibilidad de una muestra. No generar miniaturas.
- [ ] E9.0d **Capacidad**: volumen real y límites del proyecto. Medir paginación en staging. Sin pruebas de carga contra producción.
- [ ] E9.0e **Salida y recuperación**: backup recuperable, destino del ejecutor, rollback probado en staging.
- [ ] E9.0f **Cambio de raíz (D20 y D21)**: avisar al equipo ANTES de publicar y hacerlo fuera del horario de ventas. Verificar en un celular con la app ya instalada: abre `/admin/` y no la tienda; probar `/c`, `/admin`, un enlace profundo `/admin/ventas`, y que una nota abierta sin conexión no se pierde. Confirmar con Renzo en qué sitio de Netlify se publica y que `modas-naty.netlify.app` es ese sitio.
- [ ] E9.1 Aplicar con `aplicar-tienda.mjs --dry` contra producción y revisar.
- [ ] E9.2 Aplicación real en ventana sin ventas en curso. Comparar contra la línea base: diff `naty_*` cero (considerando ventas legítimas concurrentes).
- [ ] E9.3 Deploy preview en Netlify con variables en el panel, nunca en git. Despliegue sin forzar actualización del service worker.
- [ ] E9.4 Recorrido con Natali en celular real.
- [ ] E9.5 Natali carga `url_catalogo` definitiva y se verifica el QR en una nota real.
- [ ] E9.6 Rollback documentado: volver `App.jsx` a como estaba (el sistema vuelve a la raíz), conservar inicialmente los objetos `tienda_*`, no tocar `/c`.
- [ ] E9.7 PR a `main` para revisión de Renzo.

---

## 4. Orden y dependencias
```
E0 → E1 → E2 → E3 → E4b → E5 → E6 → E7 → E8 → E9
              └─ E4 en paralelo a E3 (textos y datos)
```
E4b va antes de E7 porque el diseño final usa la marca real. E7 arranca cuando E2 a E5 funcionan. Estimación: unas 53 h de desarrollo, más espera de datos de la clienta y revisión de Renzo.

## 5. Riesgos
| Riesgo | Mitigación |
|---|---|
| Renzo cambia su esquema mientras trabajamos | Contrato (E1.9) y prueba de catálogo que falla antes de publicar |
| Una prueba toca datos reales | Regla 3: solo staging y origen aparte. `service_role` de producción nunca en este repo |
| La tienda borra o envía la cola local de Renzo | D2 y regla 8: montaje antes del arranque interno, sin `SyncRunner` |
| Teléfonos publicados sin permiso | D7 y E8: autorización explícita antes de E9 |
| Enlaces editables maliciosos | D13: validación con `new URL()` y allowlist |
| Natali pide cobro online más adelante | **Mercado Pago quedó descartado** (la clienta confirmó el 15/10 que ya no funciona): el cobro es solo por transferencia o efectivo. `tienda-origen` conserva ese código como referencia, pero cualquier cobro online sería una etapa nueva con otro proveedor |
| La cuenta de transferencia cambia cada 2 meses (la clienta lo hace para no pagar impuestos) y un cliente transfiere a una cuenta vieja | Cambia la cuenta entera, no solo el alias. La tienda guarda la fecha en que se actualizó, avisa en Ajustes a los 50 días y le dice a la clienta que confirme los datos con su vendedor si pasaron más de 60. Lo actualiza el superadmin a mano. Riesgo residual: una transferencia a una cuenta ya dada de baja; por eso el vendedor confirma antes de cobrar |
| El diseño de referencia exige otra estructura | Se construye en `features/tienda/` con tokens propios |
| Gemini no pudo dar la pasada de UX (503, sigue caído el 15/10) | Pendiente: repetirla cuando haya servicio, antes de E7. Si no vuelve, la revisión de UX la hace Natali con un celular real en E9.4 |
| **No hay backup de producción** y no hay credenciales de su base en esta máquina | Nada se aplica a producción hasta correr `respaldo.mjs` y `linea-base.sql` y guardar los resultados (E0.3 y E0.5). Hasta entonces todo es staging local |
