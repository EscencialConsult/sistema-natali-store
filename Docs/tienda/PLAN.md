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
| D1 | **No se extiende `/c`.** Se crean rutas `/tienda/*`. `/c` queda intacto | `/c` depende del caché local y del `SyncRunner` con usuario: un navegador anónimo no obtiene catálogo |
| D2 | `/tienda/*` se monta **antes** de `Arranque`, `AuthProvider`, `PrimeraCarga` y `SyncRunner` (edición mínima en `App.jsx`) | `prepararBase` puede borrar `modas-naty`; `SyncRunner` puede enviar pendientes |
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
- [!] E0.3 **No hay backup** (confirmado por Facundo 15/10) y en esta máquina **no hay credenciales** de la base de Renzo: las del cerebro son de la instancia vieja `aaxrcacoavghapiqhkrn`. `respaldo.mjs` está listo y probado en `Docs/tienda/herramientas/`. Falta que quien tenga la cadena de conexión de `bulcbrgafrfklaejfyjd` lo corra, y preguntarle a Renzo si ese proyecto tiene Backups activos.
- [ ] E0.4 Staging **local en PGlite** con el esquema real de Renzo (ya probado en `probar-herramientas.mjs`). Un proyecto Supabase de staging queda como opcional si hace falta probar Storage y Auth reales.
- [~] E0.5 Línea base: `linea-base.sql` listo y probado contra el esquema real. **Falta correrlo en producción** (SQL Editor, 5 minutos) y guardar `linea-base-ANTES.json`.
- [x] E0.6 (15/10) `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md` creado.
- [ ] E0.7 Staging con `.env.local` propio **y** otro origen o perfil de navegador vacío. Verificar en DevTools que `modas-naty` no se comparte.
- [x] E0.8 (15/10) `Docs/tienda/herramientas/iniciar-dev.bat` monta el repo como `S:` y corre con `--root S:\app`. Verificado: 118 tests OK en tres corridas seguidas (una corrida aislada dio 2 fallas por lentitud y no se repitió).

Criterio: línea base y respaldo en mano, la app corre contra staging y los 118 tests pasan.

## Etapa E1 · Esquema aditivo y ejecutor seguro (6 h)
- [ ] E1.1 `Docs/tienda/CONTRATO.md`: qué lee la tienda de `naty_*` (`naty_catalogo_publico` o sus tablas base vía vista nueva, `naty_config`, `naty_es_rol`) y qué no se toca.
- [ ] E1.2 `app/supabase/tienda_schema.sql`, idempotente, en una transacción, solo `create ... if not exists` y `create or replace`:
  - `tienda_config`, `tienda_oculto` (sin FK).
  - Vistas `tienda_catalogo_publico` y `tienda_ajustes_publicos` (D9).
  - Sin `ALTER TYPE`, sin extensiones, sin triggers sobre `naty_*`.
- [ ] E1.3 Políticas y grants explícitos (D8, D9). Escritura solo `naty_es_rol('admin')`.
- [ ] E1.4 `app/scripts/aplicar-tienda.mjs` (D17), con `--dry` por defecto.
- [ ] E1.5 Pruebas en PGlite: aplicar `naty_schema.sql` y después `tienda_schema.sql`, dos veces cada uno.
- [ ] E1.6 Prueba de catálogo: **diff vacío** de definiciones, grants, columnas y dependencias `naty_*` antes y después.
- [ ] E1.7 Matriz de roles, **secuencial** y un principal por vez: anon, authenticated vendedor, admin, superadmin. Verificar denegación de INSERT/UPDATE/DELETE en las vistas.
- [ ] E1.8 Prueba de rollback: aplicar y revertir en staging, comparar con la línea base.
- [ ] E1.9 Enviar el contrato a Renzo.

Criterio: diff `naty_*` vacío, rollback limpio y matriz de roles en verde.

## Etapa E2 · Rutas públicas y catálogo (8 h)
- [ ] E2.1 Edición mínima en `App.jsx` (D2): `pathname === '/tienda' || startsWith('/tienda/')` con selección reactiva dentro del router. Probar entrada directa, navegación interna y atrás/adelante sin montar el árbol privado.
- [ ] E2.2 `features/tienda/data/clientePublico.js` (D3) y repositorio público con paginación por clave (código, id), páginas de 24, sin conteos exactos.
- [ ] E2.3 Normalizar URLs de fotos absolutas y relativas (D12).
- [ ] E2.4 `precioPublico()` (D10, D11) con tests: precio null, tasa 0 o NaN, el caso 101 centavos × 1,5 media docena (resultado 76, como Renzo).
- [ ] E2.5 Copiar y adaptar grilla, filtros, ficha y `useScrollConservado` sin color ni Bs minoristas.
- [ ] E2.6 Etiquetas "Media docena (6)" y "Docena (12)". Mínimo media docena.
- [ ] E2.7 Caché propia `tienda-v1` (D15) y aviso "precios consultados el ...".
- [ ] E2.8 SEO y enlace compartible por producto.
- [ ] E2.9 Tests: cliente sin sesión (aunque haya sesión interna en el mismo navegador), catálogo con 0 productos, producto sin foto, foto rota.

Criterio: un navegador limpio carga `/tienda` sin tocar la IndexedDB de Renzo, y el precio de cada producto coincide con la nota de venta, centavo por centavo.

## Etapa E3 · Pedido y contacto con el vendedor (8 h)
- [ ] E3.1 Carrito propio en `localStorage` con versión (nada de tablas Dexie de Renzo).
- [ ] E3.2 Reconciliación: al abrir el carrito se resuelven los IDs contra el catálogo vigente; si un producto desapareció o cambió el precio, se avisa y se pide revisar.
- [ ] E3.3 Pantalla "Tu pedido": líneas, totales en las tres monedas o "a consultar", aviso "el precio final lo confirma tu vendedor".
- [ ] E3.4 Selector "¿Con qué vendedor hablás?" desde `tienda_config` (D7). Verifica que el contacto siga publicado.
- [ ] E3.5 Pago: Transferencia (datos y botón copiar) o Efectivo en el local.
- [ ] E3.6 Entrega: retiro en uno de los dos locales o recibir, "a coordinar con tu vendedor".
- [ ] E3.7 Botón "Enviar por WhatsApp" y "Copiar pedido" (D14).
- [ ] E3.8 Texto posterior: "Mandá el comprobante al mismo vendedor". Aclarar que enviar no reserva ni confirma.
- [ ] E3.9 Sin conexión: se pueden ver cantidades sin importe y se indica que no hay confirmación.
- [ ] E3.10 Tests: texto armado con tildes, emojis y 40 líneas, contacto sin teléfono, teléfono mal formado.

Criterio: un pedido de ejemplo llega por WhatsApp completo, correcto y sin escribir nada en la base.

## Etapa E4 · Información del negocio y edición (5 h)
- [ ] E4.1 "Cómo comprar" desde `tienda_config`.
- [ ] E4.2 "Dónde estamos": dos locales, dirección, horarios, indicaciones desde la chalana y enlace a Maps validado (D13).
- [ ] E4.3 Editor en **Ajustes de Renzo** (acordeón nuevo, solo admin y superadmin) con **repositorio propio** que escribe en `tienda_config` con el cliente autenticado. Nunca `config.guardar`.
- [ ] E4.4 Validación de campos al guardar (URL, teléfono, longitud). Los textos se muestran como texto, nunca HTML.
- [ ] E4.5 Legales simples revisados por Natali.

Criterio: Natali cambia un horario o un teléfono desde Ajustes y se ve en `/tienda` sin tocar código.

## Etapa E4b · Marca coherente en los dos sistemas (3 h)
Contexto: los logos reales (imagotipo, isotipo e íconos de la app) existen solo en la tienda original. Renzo no los usó. Su app muestra un monograma "MN" sobre fondo oscuro, y su logo se carga desde Ajustes (`useMarca`, clave `logo`), que alimenta el encabezado y la nota de venta.

- [x] E4b.1 (15/10) `imagotipo.png` e `isotipo.png` copiados a `app/public/brand/` (archivos nuevos, no pisan nada).
- [ ] E4b.2 Mapa completo de dónde aparece la marca en Renzo: `Logo.jsx`, `useMarca`, encabezado de la nota, `favicon.svg`, íconos de `public/icons/`, manifiesto (nombre "Modas Naty · Notas de venta", color `#8a3a63`) y `index.html`.
- [ ] E4b.3 `/tienda/*` usa `brand/imagotipo.png` e `isotipo.png` con ancho y alto fijos, sin depender de la configuración de Renzo.
- [ ] E4b.4 Logo de Ajustes: se sube con `imagotipo.png` **desde la pantalla Ajustes** (D19), primero en staging y después en producción por Natali o un admin. Nunca por script.
- [ ] E4b.5 Íconos de la app instalada: reemplazar los 4 PNG de `app/public/icons/` por los de la tienda (192, 512, maskable y apple-touch) y sumar el favicon PNG de 48 px. Revisar la zona segura del ícono maskable. Registrado en `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`, fila 3.
- [ ] E4b.6 Un solo color de marca: el manifiesto de Renzo ya usa `#8a3a63`. Confirmar que coincide con la ciruela de la tienda y dejar un único valor.
- [ ] E4b.7 Verificación visual con capturas antes y después en `Docs/tienda/marca/`: nota A5 impresa en PDF con el logo real, PWA instalada en un Android con el ícono nuevo, pestaña con favicon, panel interno y `/tienda` con la misma marca.
- [ ] E4b.8 Avisar a Natali que el ícono de una app ya instalada tarda en actualizarse y puede requerir reinstalar.

Criterio: misma marca en la nota impresa, el panel, la app instalada y la tienda.

## Etapa E5 · Enlace con la nota de venta (2 h)
- [ ] E5.1 En staging, cargar `url_catalogo` **a mano desde Ajustes** (D16) y verificar el QR en la nota A5.
- [ ] E5.2 Escanear la nota impresa y en PDF con un celular.
- [ ] E5.3 Documentar para Natali el paso "cargar la dirección del catálogo" con capturas.
- [ ] E5.4 Backlog: "pasar el pedido de la clienta a una nota" (no V1).

## Etapa E6 · Un solo lugar de carga (3 h)
- [ ] E6.1 Un producto nuevo en Inventario de Renzo aparece en `/tienda` sin pasos extra (si tiene foto y está activo).
- [ ] E6.2 Ocultar y mostrar desde el editor de la tienda (`tienda_oculto`). Sin tocar la ficha de Renzo.
- [ ] E6.3 Limpiezas del superadmin: sin enlaces rotos. Limpieza independiente de huérfanos de `tienda_oculto`.
- [ ] E6.4 Documentar la diferencia: "oculto" saca el producto de la tienda pero no de `/c`.

## Etapa E7 · Diseño final con las imágenes de referencia (8 h)
- [ ] E7.1 Guardar referencias en `Docs/tienda/referencias/` (`01-inicio-390.png`, `01-inicio-1440.png`, …).
- [ ] E7.2 Kit de marca (skill `kit-de-marca`): tokens nuevos aparte, sin pisar los de Renzo.
- [ ] E7.3 Por pantalla: referencia + kit al skill `ingeniero-react`.
- [ ] E7.4 Verificación visual con Playwright en 390 y 1440 px, lado a lado, con tabla de diferencias.
- [ ] E7.5 Pasada `embellece_mi_frontend` y `anti-ia`.
- [ ] E7.6 Accesibilidad (axe en 0), foco por teclado, 320 px.
- [ ] E7.7 Rendimiento en celular con datos lentos: fotos con dimensiones reservadas y `loading="lazy"`. Meta: Lighthouse móvil mayor a 80.

## Etapa E8 · Pulido y datos pendientes (3 h, más espera)
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
- [ ] E8.3 Guía de una página para Natali y su equipo.

## Etapa E9 · Salida a producción (5 h, más espera)
Requiere OK de Facundo **y** de Renzo. Antes de arrancar se cierran los cinco puntos de evidencia de producción:

- [ ] E9.0a **Contrato desplegado**: propietario y opciones de las vistas existentes, RLS, grants, privilegios por defecto y esquema expuesto (con `auditor-backend`, en solo lectura).
- [ ] E9.0b **Service worker y hosting**: scope, versión activa, cachés y headers efectivos en dispositivos reales. Verificar entrada a `/tienda` desde un shell anterior.
- [ ] E9.0c **Fotos**: formato de rutas y accesibilidad de una muestra. No generar miniaturas.
- [ ] E9.0d **Capacidad**: volumen real y límites del proyecto. Medir paginación en staging. Sin pruebas de carga contra producción.
- [ ] E9.0e **Salida y recuperación**: backup recuperable, destino del ejecutor, rollback probado en staging.
- [ ] E9.1 Aplicar con `aplicar-tienda.mjs --dry` contra producción y revisar.
- [ ] E9.2 Aplicación real en ventana sin ventas en curso. Comparar contra la línea base: diff `naty_*` cero (considerando ventas legítimas concurrentes).
- [ ] E9.3 Deploy preview en Netlify con variables en el panel, nunca en git. Despliegue sin forzar actualización del service worker.
- [ ] E9.4 Recorrido con Natali en celular real.
- [ ] E9.5 Natali carga `url_catalogo` definitiva y se verifica el QR en una nota real.
- [ ] E9.6 Rollback documentado: retirar la ruta `/tienda` (revertir `App.jsx`), conservar inicialmente los objetos `tienda_*`, no tocar `/c`.
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
| Natali pide cobro online más adelante | `tienda-origen` conserva Mercado Pago. Entra como etapa nueva |
| El diseño de referencia exige otra estructura | Se construye en `features/tienda/` con tokens propios |
| Gemini no pudo dar la pasada de UX (503, sigue caído el 15/10) | Pendiente: repetirla cuando haya servicio, antes de E7. Si no vuelve, la revisión de UX la hace Natali con un celular real en E9.4 |
| **No hay backup de producción** y no hay credenciales de su base en esta máquina | Nada se aplica a producción hasta correr `respaldo.mjs` y `linea-base.sql` y guardar los resultados (E0.3 y E0.5). Hasta entonces todo es staging local |
