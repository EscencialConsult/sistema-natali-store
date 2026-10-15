# Plan de trabajo: catálogo y compra mayorista de Modas Naty dentro del sistema de nota

Creado el 2026-10-15. Rama: `feature/tienda-online` (sale de `origin/main`). Material reciclable: `tienda-origen/` (copia literal de la tienda online, commit 3142b20).
Método: etapas con tareas y pasos tachables. `[ ]` pendiente · `[~]` en curso · `[x]` hecho con fecha · `[!]` bloqueado. **Cada etapa nueva arranca solo con OK explícito de Facundo.**

---

## 0. Reglas inviolables (la base de Renzo ya tiene datos reales y está en uso)

1. **Cero cambios a objetos `naty_*` existentes**: ni columnas, ni enums, ni funciones, ni políticas, ni datos. Solo se agregan objetos nuevos con prefijo `tienda_`.
2. **No se corre `naty_schema.sql` ni `tienda-origen/app/supabase/tienda_schema.sql` contra la base real** sin dry-run con rollback, backup previo y OK de Facundo y de Renzo.
3. **Todo se prueba primero en una copia** (proyecto Supabase de staging o Postgres en memoria con PGlite), nunca contra producción.
4. **El código de Renzo se toca lo mínimo**: se agregan archivos nuevos y, donde no hay otra forma, se editan líneas puntuales en archivos suyos (rutas, un enlace). Cada edición a un archivo suyo queda listada en `Docs/tienda/CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`.
5. **Dueño único por dato**: productos, fotos, stock, precios, tipo de cambio, usuarios y teléfonos son del sistema de nota. La tienda los lee. No se duplican.
6. **Sin secretos en git**: `.env*` fuera del repo (ya ignorados).
7. **El commit `0b8899b` de la rama `main` local NO se usa.** Modifica `naty_productos` y reescribe `naty_guardar_producto`, que es justo lo que ahora está prohibido. No se pushea. Esta rama sale de `origin/main`.

---

## 1. Lo que cambia el plan (hallazgos al leer el código de Renzo)

| # | Hallazgo | Consecuencia |
|---|---|---|
| H1 | Ya existe un catálogo público en `/c` con vista `naty_catalogo_publico`, botón de WhatsApp (`whatsapp_tienda`) y bandera `mostrar_precios_publico` | No se construye "una tienda aparte": se **extiende `/c`** |
| H2 | El precio base es **USD por docena** y `tipo_cambio` guarda `{bs, ars}` por 1 USD. Orden fijo USD, ARS, Bs | La tienda no necesita precio minorista en Bs. Se convierte con la misma función `convertirDesdeUsd` |
| H3 | **Ya no hay color** (un color informativo opcional) y todo va en medias docenas | Coincide con el pedido de Natali. No hay selector de color |
| H4 | La nota de venta ya imprime un **QR con `url_catalogo`** cuando esa clave está cargada | "Que desde la nota se entre al catálogo" ya está hecho. Falta cargar la URL y probar la impresión |
| H5 | `naty_perfiles` tiene `rol` y `telefono` | Los vendedores y las encargadas con su WhatsApp ya existen. Falta una vista pública mínima (`tienda_contactos_publico`) |
| H6 | Mercado Pago, kiosco, pedidos online, comprobante PDF y reservas de stock **no se piden** | Se descartan de la V1. La compra es: armar pedido, ver datos de transferencia, escribir al vendedor |
| H7 | El proyecto Supabase viejo (`aaxrcacoavghapiqhkrn`) era de pruebas | Se abandona. La única base es la de Renzo (`bulcbrgafrfklaejfyjd`) |

---

## 2. Qué pidió la clienta (desgrabación del 2026-10-15)

| # | Pedido | Etapa |
|---|---|---|
| P1 | Catálogo para que las clientas vean, elijan y compren. No es una landing ni deja datos | E2, E3 |
| P2 | Sin color. Se vende por fardo: producto, media docena, docena o cuántas docenas | E2, E3 |
| P3 | Texto "Cómo comprar": mirá el catálogo, abrí el modelo, elegí cantidad (media docena o docena), pasá por el local o coordiná con tu vendedor | E4 |
| P4 | Pago: solo transferencia o efectivo. Online siempre transferencia, con los datos de transferencia a la vista | E3 |
| P5 | Después de transferir, coordinar con la encargada de tienda o con su vendedor (WhatsApp, quizá QR) | E3 |
| P6 | La clienta elige **"vendedor"** (no "asesor") de una lista. Se usa para saber quién la atiende | E3 |
| P7 | Retirar o recibir, también coordinado con el vendedor | E3, E4 |
| P8 | Dirección de **dos locales**, horarios (lunes a sábado), teléfono de Ariel y de las encargadas | E4 |
| P9 | Ubicación con mapa, para que quien cruza la chalana de Bermejo llegue caminando derecho | E4 |
| P10 | Precios en **USD** con conversión automática a Bs y ARS según el tipo de cambio que carga ella | E2 |
| P11 | Unificar con la nota de venta: un solo stock, un solo lugar de carga | E5, E6 |
| P12 | Desde la nota de venta se pueda entrar al catálogo | E5 (H4) |
| P13 | Diseño fiel a la referencia hecha con IA | E7 |

---

## 3. Qué se recicla de `tienda-origen/` y qué se descarta

| Se recicla (copiar, adaptar en `app/`) | Se descarta en V1 |
|---|---|
| Tokens y estética crema y ciruela (`DESIGN.md`, `styles/tokens.css`) | Mercado Pago: `netlify/functions/checkout`, `webhook`, `reembolso`, `reconciliar` |
| `features/catalogo/tienda/*`: grilla, filtros, ficha, mini carrito, `useScrollConservado` | Kiosco completo (`features/kiosco`, `kiosco-*.js`) |
| `features/sitio/*`: inicio, quiénes somos, contacto, legales, pie, botón WhatsApp | Panel de pedidos, cobros, gastos, reportes de la tienda |
| `features/carrito/*` (adaptado a docenas) | Correo con comprobante PDF (`correo.js`, `comprobantePdf.js`) |
| `lib/seo.js`, `lib/whatsapp.js`, `lib/slug.js`, miniaturas `.mini.webp` | Tablas `tienda_pedidos`, `tienda_pagos`, `tienda_kiosco_*` |
| `features/ayuda/*` (guía de la clienta, reescrita) | Tipo de cambio versionado de la tienda (se usa el de `naty_config`) |
| Tests de `carrito`, `seo`, `csp` | Login y usuarios de la tienda |

---

## Etapa E0 · Seguridad y terreno (2 h)
Objetivo: poder trabajar sin riesgo de tocar datos reales.

- [x] E0.1 (15/10) Rama `feature/tienda-online` desde `origin/main`.
- [x] E0.2 (15/10) Copia literal en `tienda-origen/` sin secretos, sin fotos demo y sin dependencias.
- [ ] E0.3 Confirmar con Renzo que `bulcbrgafrfklaejfyjd` es producción y pedirle **backup** (dump) o la fecha del último automático de Supabase.
- [ ] E0.4 Crear una **copia de staging**: proyecto Supabase nuevo y gratuito, con `naty_schema.sql` de `origin/main` aplicado y un dump de datos anonimizado (teléfonos y nombres cambiados) o, si no se puede, datos de ejemplo.
- [ ] E0.5 Foto de línea base de producción en **solo lectura**: conteo de filas por tabla `naty_*`, lista de objetos existentes (`information_schema`), claves de `naty_config`. Se guarda en `Docs/tienda/linea-base.md`.
- [ ] E0.6 Crear `Docs/tienda/CAMBIOS-EN-ARCHIVOS-DE-RENZO.md` (vacío, con la regla 4).
- [ ] E0.7 Copiar `app/.env.local` al staging (otra URL y otra clave pública). Verificar que `npm run dev` apunta al staging y no a producción.
- [ ] E0.8 Resolver el `#` de la ruta para correr tests y dev desde la carpeta real (subst `R:` como hacía `tienda-origen/iniciar-dev.bat`) y dejarlo documentado.

Criterio de cierre: la app de Renzo corre desde esta rama contra staging, los 118 tests pasan y existe la línea base.

## Etapa E1 · Contrato de datos, solo aditivo (4 h)
Objetivo: definir exactamente qué lee la tienda y qué objetos nuevos necesita, sin tocar nada de Renzo.

- [ ] E1.1 Escribir `Docs/tienda/CONTRATO.md`: tablas y columnas de `naty_*` que se leen (`naty_catalogo_publico`, `naty_config`, `naty_perfiles` solo vía vista) y qué no se toca.
- [ ] E1.2 Definir los objetos nuevos mínimos en `app/supabase/tienda_schema.sql` (idempotente, prefijo `tienda_`):
  - `tienda_contactos_publico` (vista): nombre, rol y teléfono de perfiles activos con rol `vendedor`, `enc_tienda`, `enc_ventas`. Sin id interno ni nada más.
  - `tienda_config` (tabla de una fila por clave, con RLS) para: datos de transferencia, textos de "Cómo comprar", dos direcciones, horarios, enlace de mapa, indicaciones de llegada.
  - `tienda_publicacion` (opcional, solo si E2.3 lo exige): producto publicado, destacado y orden. **Si se resuelve con lo existente, no se crea.**
- [ ] E1.3 Política de seguridad para cada objeto: lectura pública solo de la vista y de las claves de config marcadas públicas; escritura solo `admin` y `superadmin` vía `naty_es_rol` (se **usa**, no se modifica).
- [ ] E1.4 Prueba de contrato en PGlite: aplicar `naty_schema.sql` de `origin/main` y después `tienda_schema.sql`, dos veces cada uno. Verificar que **ninguna** tabla, columna, política o función `naty_*` cambió (diff de catálogo antes y después).
- [ ] E1.5 Dry-run con rollback contra staging. Resultado en `Docs/tienda/linea-base.md`.
- [ ] E1.6 Enviar a Renzo el contrato para que avise antes de cambiar algo de la lista.

Criterio: el diff de objetos `naty_*` es vacío y las pruebas pasan dos veces seguidas.

## Etapa E2 · Catálogo público sin color, en docenas y bimoneda (6 h)
Objetivo: `/c` muestra el catálogo con precio por docena en USD, Bs y ARS, y sin color.

- [ ] E2.1 Leer cómo `GrillaProductos`, `ProductoFicha` y `useBusquedaCodigo` de Renzo obtienen datos. Documentar en `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md` qué se reutiliza.
- [ ] E2.2 Copiar a `app/src/features/tienda/` los componentes reciclables (grilla con scroll conservado, filtros por categoría, ficha con galería, miniaturas) y quitar de ellos el selector de color y las referencias a Bs minoristas.
- [ ] E2.3 Decidir qué significa "publicado": **opción 1** todo producto activo con foto se muestra (cero objetos nuevos); **opción 2** `tienda_publicacion` con un interruptor por producto. Se decide en el duelo.
- [ ] E2.4 Mostrar precio por docena y por media docena, convertido con `convertirDesdeUsd` y `naty_config.tipo_cambio`. Orden USD, ARS, Bs. Bandera `mostrar_precios_publico` respetada.
- [ ] E2.5 Etiquetas de venta: "Media docena (6)" y "Docena (12)". Cantidad mínima: media docena. Se lee `unidades_por_docena`.
- [ ] E2.6 Estado de stock público sin cantidades: "Disponible" o "Consultar". Nunca el número ni el costo.
- [ ] E2.7 SEO básico y Open Graph por producto (`lib/seo.js`), con enlace compartible por WhatsApp.
- [ ] E2.8 Tests: conversión de monedas, redondeo, mínimo de media docena, producto sin foto, producto sin precio.

Criterio: la grilla y la ficha de un producto real de staging coinciden con lo que muestra la nota de venta, centavo por centavo.

## Etapa E3 · Pedido, transferencia y contacto con el vendedor (8 h)
Objetivo: la clienta arma su pedido sin dejar datos, ve cómo pagar y escribe al vendedor con el mensaje ya armado.

- [ ] E3.1 Carrito en el navegador (Dexie o `localStorage`), por modelo y cantidad en medias docenas. Total en las tres monedas.
- [ ] E3.2 Pantalla "Tu pedido": líneas, subtotal por moneda, aviso de que el precio final lo confirma el vendedor.
- [ ] E3.3 Selector **"¿Con qué vendedor hablás?"** (lista desde `tienda_contactos_publico`) y opción "Pasar por el local". Si no hay vendedores, cae en `whatsapp_tienda`.
- [ ] E3.4 Elección de pago: **Transferencia** (muestra banco, titular, cuenta, alias y un botón copiar) o **Efectivo en el local**. Los datos salen de `tienda_config`.
- [ ] E3.5 Elección de entrega: retiro en local (elige cuál de los dos) o recibir, siempre "a coordinar con tu vendedor".
- [ ] E3.6 Botón "Enviar pedido por WhatsApp": abre `wa.me/<tel vendedor>` con un texto armado: modelos, cantidades, total en la moneda elegida, método de pago y entrega. Sin guardar nada en el servidor.
- [ ] E3.7 Mensaje de ayuda post-transferencia: "Mandá el comprobante por WhatsApp al mismo vendedor".
- [ ] E3.8 (Decisión del duelo) Si se quiere registro del pedido: tabla `tienda_pedidos_web` mínima, solo escritura anónima por función con límite de frecuencia. Si no, queda fuera de V1.
- [ ] E3.9 Tests: armado del texto de WhatsApp (caracteres especiales, longitud), totales, carrito persistido, vendedor sin teléfono.

Criterio: un pedido de ejemplo llega por WhatsApp con todos los datos correctos y sin tocar la base.

## Etapa E4 · Información del negocio y "Cómo comprar" (4 h)
- [ ] E4.1 Página "Cómo comprar" con los pasos de P3, textos editables desde el panel.
- [ ] E4.2 Bloque "Dónde estamos": dos locales con dirección, mapa embebido o enlace a Google Maps, e indicaciones "pasando la chalana, caminá derecho hasta la esquina".
- [ ] E4.3 Horarios y teléfonos (Ariel, Pamela y la segunda encargada) desde `tienda_config` y `tienda_contactos_publico`.
- [ ] E4.4 Pantalla de edición de estos textos y datos dentro de **Ajustes** de Renzo (un acordeón nuevo, sin tocar los existentes), solo `admin` y `superadmin`.
- [ ] E4.5 Políticas legales simples (cambios y devoluciones) con los textos de `tienda-origen`, revisadas por Natali.

Criterio: Natali cambia un horario o un teléfono desde Ajustes y se ve en el catálogo sin tocar código.

## Etapa E5 · Enlace con la nota de venta (3 h)
- [ ] E5.1 Cargar `url_catalogo` (clave existente) en staging y verificar que la nota A5 imprime el QR.
- [ ] E5.2 Probar escaneo desde el celular con la nota impresa en A5 y en PDF.
- [ ] E5.3 Botón "Ver catálogo para clientas" en la navegación interna, que abre `/c` en otra pestaña.
- [ ] E5.4 Decidir con Natali si desde la nota el vendedor puede "pasar el pedido de la clienta" a una nota nueva (backlog, no V1).

## Etapa E6 · Un solo lugar de carga y stock (3 h)
- [ ] E6.1 Verificar que cargar o editar un producto en Inventario de Renzo aparece en `/c` sin pasos extra.
- [ ] E6.2 Si E2.3 eligió la opción 2: interruptor "Publicar en el catálogo" dentro de la ficha de producto de Renzo (cambio mínimo, registrado en `CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`).
- [ ] E6.3 Verificar que las limpiezas del superadmin (borrar productos y notas por fecha) no dejan enlaces rotos en `/c`.
- [ ] E6.4 Verificar el modo sin conexión: el catálogo cacheado abre sin internet y avisa que los precios pueden estar viejos.

## Etapa E7 · Diseño final con las imágenes de referencia (8 h)
Objetivo: lo construido en E2 a E5 queda visualmente igual a las referencias de Facundo.

- [ ] E7.1 Guardar las imágenes de referencia en `Docs/tienda/referencias/` (celular y escritorio, por pantalla) con nombres `01-inicio-390.png`, `01-inicio-1440.png`, etc.
- [ ] E7.2 Definir el kit de marca: contrastar los tokens de Renzo contra la referencia y fijar una sola paleta (skill `kit-de-marca`). Los tokens nuevos se agregan aparte, sin pisar los suyos.
- [ ] E7.3 Por pantalla: pasar la imagen de referencia y el kit al skill `ingeniero-react` (exige las dos entradas) para que construya el componente que iguale la imagen.
- [ ] E7.4 Verificación visual: capturar con Playwright cada pantalla en 390 y 1440 px y compararla con su referencia lado a lado. Se anota la diferencia en una tabla.
- [ ] E7.5 Pasada `embellece_mi_frontend` y `anti-ia` para sacar sabor genérico.
- [ ] E7.6 Accesibilidad (axe en 0), foco por teclado, contraste y 320 px.
- [ ] E7.7 Rendimiento: Lighthouse móvil mayor a 80 en catálogo y ficha, miniaturas `.mini.webp`.

## Etapa E8 · Pulido y datos pendientes de la clienta (3 h, más espera)
Datos que mencionó la desgrabación y todavía no llegaron:

| Dato | Para qué | Quién |
|---|---|---|
| Segunda dirección del local | E4.2 | Natali |
| Horarios exactos de atención | E4.3 | Natali |
| Teléfono de la segunda encargada y de cada vendedor (autorización para publicarlos) | E3.3 | Natali |
| Datos de transferencia: banco, titular, cuenta, alias, QR | E3.4 | Natali |
| Ubicación exacta (pin de Google Maps) de cada local | E4.2 | Natali |
| Textos de "Cómo comprar" con sus palabras | E4.1 | Natali |
| Si Natali quiere ver los pedidos registrados o solo por WhatsApp | E3.8 | Natali |
| Nombre del dominio o subdominio del catálogo | E9 | Natali |

- [ ] E8.1 Completar cada dato en cuanto llegue y tachar.
- [ ] E8.2 Revisión de ortografía y tono de todos los textos.
- [ ] E8.3 Guía corta de uso para Natali y su equipo (una página).

## Etapa E9 · Salida a producción (4 h, más espera)
Requiere OK de Facundo **y** de Renzo.

- [ ] E9.1 Backup de producción confirmado y a mano.
- [ ] E9.2 `tienda_schema.sql` contra producción con `--dry` (rollback) y revisión del resultado.
- [ ] E9.3 Aplicación real en una ventana tranquila (sin ventas en curso). Verificar conteos y objetos `naty_*` contra la línea base: **diferencia cero**.
- [ ] E9.4 Deploy preview en Netlify, con variables de producción cargadas en el panel, nunca en git.
- [ ] E9.5 Recorrido con Natali en un celular real: ver catálogo, armar pedido, escribir al vendedor.
- [ ] E9.6 Cargar `url_catalogo` definitiva y comprobar el QR en una nota real.
- [ ] E9.7 Plan de vuelta atrás: cómo apagar `/c` y quitar los objetos `tienda_*` si algo falla.
- [ ] E9.8 Merge a `main` (PR a revisar por Renzo).

---

## 4. Orden y dependencias
```
E0 → E1 → E2 → E3 → E4 → E5 → E6 → E7 → E8 → E9
              └─ E4 puede ir en paralelo a E3 (texto y datos)
E7 (diseño) arranca cuando E2 a E5 funcionan, no antes.
```
Estimación: 45 h de desarrollo, más la espera de datos de la clienta y la revisión de Renzo.

## 5. Riesgos
| Riesgo | Mitigación |
|---|---|
| Renzo cambia su esquema mientras trabajamos | Contrato (E1.6) y prueba de contrato que falla antes de publicar |
| Una prueba rompe datos reales | Regla 3: solo staging. La clave `service_role` de producción no se carga en este repo |
| Los teléfonos de vendedores se publican sin permiso | E8: autorización explícita antes de E9 |
| Natali pide cobro online más adelante | `tienda-origen` conserva Mercado Pago listo. Entra como etapa nueva, no en V1 |
| El diseño de referencia exige estructura distinta a la de Renzo | Se construye en `features/tienda/` con tokens propios; el panel interno no se toca |
