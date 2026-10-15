# Plan de actualización y concordancia con el sistema de nota

Creado el 12 de octubre de 2026. Actualizado el mismo día tras conectarse a la base compartida (ver sección 6). Es la misma empresa y los dos sistemas manejan la misma información. Este plan corrige los huecos que aparecieron cuando el sistema de nota cambió su modelo de datos (rama `rediseno-usuarios-excel` del repo `sistema-natali-store`).

Método: `metodo-etapas-tareas`. Cada etapa necesita autorización explícita de Facundo para arrancar. Marcas: `[ ]` pendiente, `[~]` en curso, `[x]` hecha con fecha, `[!]` bloqueada.

## 1. Qué cambió en el sistema de nota (verificado leyendo su código)
| Cambio | Dónde se ve |
|---|---|
| Base propia en Supabase, proyecto `bulcbrgafrfklaejfyjd` (São Paulo), con el esquema ya aplicado | Su README: "proyecto propio" |
| Un solo color por producto, opcional e informativo. Los colores sobrantes quedaron marcados como eliminados | Commit `c68e33c` |
| El stock es del producto, no del color. Los movimientos pueden tener `color_id` nulo | `naty_schema.sql`, última sección |
| Tipo de movimiento nuevo `saldo`. El rol `superadmin` es nuevo | Enums del esquema |
| Ingreso con CI y contraseña, con un correo interno `<ci>@ci.modasnaty.internal` | Commit `63aa388` |
| Funciones de limpieza que borran movimientos y productos de baja | `naty_resumir_movimientos`, `naty_eliminar_productos` |
| Ventas con método de entrega, correo y dirección del cliente | Commit `63aa388` |

## 2. Huecos detectados, y en qué etapa se cierra cada uno
| # | Gravedad | Hueco | Etapa |
|---|---|---|---|
| H1 | Alta | La rama no trae los campos de tienda: precio minorista, publicado, slug, destacado, `pedido_id` en movimientos y tipos reserva y liberación. El esquema de la tienda no se puede aplicar encima | U1 |
| H2 | Alta | La tienda calcula y reserva el stock por color. El modelo nuevo es por producto y deja movimientos sin color | U2 |
| H3 | Media | Un carrito o pedido con un color que ahora está eliminado falla | U2 |
| H4 | Media | Las limpiezas del otro sistema pueden borrar reservas abiertas, y borrar productos con pedidos de la tienda | U4 |
| H5 | Media | La tienda apunta a la base compartida vieja, no a la del sistema de nota | U0 y U5 |
| H6 | Baja | El frontend de la tienda no conoce `superadmin` | U3 |
| H7 | Media | La tienda hace login con correo y el equipo ya entra con CI. Hay dos juegos de usuarios | U3 |
| H8 | Por verificar | El umbral de stock bajo se carga en docenas en el otro sistema | U3 |
| H9 | Media | Las ventas online no aparecen en los reportes de ninguno de los dos para el otro | U4 |
| H10 | Media | Hay dos migraciones a la cuenta de Natali, y deben ir juntas | U5 |

## 3. Quién es dueño de cada dato
Regla: cada dato tiene un solo dueño. El otro sistema lo lee y no lo duplica.

| Dato | Dueño | La tienda... |
|---|---|---|
| Productos, categorías, colores, fotos, precio mayorista | Sistema de nota (`naty_*`) | lo lee. La publicación y el precio minorista son suyos |
| Stock y movimientos | Sistema de nota | lo lee y escribe solo reservas, liberaciones y ventas con `pedido_id` |
| Personas, roles y contraseñas | Sistema de nota | lo usa. No gestiona usuarios propios |
| Logo, nombre y tipo de cambio | Sistema de nota (`naty_config`) | lo lee |
| Pedidos, pagos, kiosco, gastos de la tienda | Tienda (`tienda_*`) | es el dueño |
| Publicación, precio minorista, destacados, slug | Tienda | es el dueño (columnas propias, sin tocar funciones del otro) |

## Etapa U0 · Decisiones y acuerdo con el otro equipo (2 h, más espera)
No hay código. Si esto no se cierra, las demás etapas se hacen sobre arena.

- [ ] U0.1 Confirmar de quién es el proyecto `bulcbrgafrfklaejfyjd` (¿la cuenta de Natali o provisoria?) y si la tienda se conecta ahí. **Recomendado: sí, a la misma base.**
- [ ] U0.2 Definir con Natali si la tienda vende "por modelo" (un color informativo) o "por color". **Recomendado: por modelo, igual que el sistema de nota.**
- [ ] U0.3 Definir cómo se ven las ventas online en los reportes: reportes propios de la tienda con exportación, o espejo en `naty_ventas`. **Recomendado: reportes propios, sin espejo** (las comisiones por vendedor no aplican a la web).
- [ ] U0.4 Acordar con quien hace el sistema de nota: quién aplica cada esquema y en qué orden, que `naty_schema.sql` no pise columnas de tienda, y un aviso antes de cambiar tablas compartidas.
- [ ] U0.5 Pasarles la lista de lo que la tienda usa de `naty_*` (sección 5).

Criterio de cierre: las cuatro decisiones quedan escritas en `docs/07-preguntas-abiertas-y-bloqueos.md` y en el cerebro.

## Etapa U1 · Esquema de la tienda independiente (4 h)
Objetivo: `tienda_schema.sql` se aplica solo, sin depender de que el otro archivo tenga nuestras columnas.

- [x] U1.1 (12/10) Mover a `tienda_schema.sql`, de forma idempotente, lo que hoy vive en la sección de tienda de `naty_schema.sql`:
  - Columnas de producto: precio minorista, publicado, destacado, slug.
  - Columna `pedido_id` en movimientos.
  - Valores de enum `reserva` y `liberacion`.
- [x] U1.2 (12/10) Crear `tienda_guardar_publicacion(producto, campos)` para guardar solo los campos de tienda, así dejamos de pasarlos por `naty_guardar_producto`, que es del otro sistema.
- [x] U1.3 (12/10) Que la vista pública no dependa de funciones del otro sistema que cambien.
- [x] U1.4 (12/10) Prueba: aplicar `naty_schema.sql` de la rama y después `tienda_schema.sql`, dos veces cada uno, en Postgres real en memoria.
- [~] U1.5 Quitar la sección de tienda de nuestra copia de `naty_schema.sql`.

Criterio: la prueba pasa y no queda ninguna columna de tienda declarada fuera de `tienda_schema.sql`.

## Etapa U2 · Stock por producto, color informativo (8 h)
Objetivo: la tienda funciona con los DOS modelos. Regla única (SQL y navegador): con un solo color activo o movimientos sin color, el stock es del producto; con varios colores, es por color.

Estado 12/10: hecha en SQL (aplicada en la base compartida), en el repositorio local y en las fichas. **Pendiente conocido:** un producto sin ningún color se puede comprar en la base, pero la ficha muestra "Sin colores cargados" y no deja agregarlo; hace falta carrito con color nulo (U2.9).

- [x] U2.1 (12/10) `tienda_disponible(producto)` suma los movimientos del producto, con o sin color.
- [x] U2.2 (12/10) `tienda_crear_pedido`: el color es opcional. Si el producto tiene uno, se guarda su nombre en el ítem. Los colores eliminados ya no frenan un pedido de un producto que sigue activo.
- [x] U2.3 (12/10) La reserva y liberación van por producto. La confirmación del pago convierte la reserva en venta como hoy.
- [x] U2.4 (12/10) La vista pública entrega el stock por producto y de 0 a 1 colores.
- [x] U2.5 (12/10) Frontend: ficha, carrito, mini carrito y kiosco muestran el color como dato y no como selector obligatorio.
- [x] U2.6 (12/10) Sincronización del catálogo público y repositorios locales al modelo nuevo.
- [x] U2.7 (12/10) Demo y pruebas: datos de ejemplo con un color, pruebas de reserva, cancelación y confirmación.
- [x] U2.8 (12/10) Un pedido viejo con color eliminado se sigue mostrando y se puede cancelar.

- [ ] U2.9 Carrito, mini carrito y kiosco para productos sin color (color nulo en la línea).

Criterio: pasa la prueba de compra completa con movimientos sin color y no se puede sobrevender (cubierto en `contrato.test.js` y `stock-modelos.test.js`).

## Etapa U3 · Identidad y configuración compartidas (5 h)
- [ ] U3.1 Reconocer el rol `superadmin` en permisos del frontend y en el SQL de la tienda, con los mismos permisos que admin.
- [ ] U3.2 Login con CI y contraseña como el otro sistema, usando el mismo correo interno de Auth.
- [ ] U3.3 La pantalla Usuarios de la tienda deja de gestionar personas: explica que se gestionan en el sistema de nota, y muestra la lista en solo lectura.
- [ ] U3.4 El umbral de stock bajo, el logo y el tipo de cambio se leen de `naty_config` y no se duplican. Convertir docenas a prendas donde corresponda (verifica H8).
- [ ] U3.5 Pruebas por rol: admin, superadmin, encargada de tienda, encargada de ventas, depósito.

Criterio: una persona que entra al sistema de nota entra también a la tienda con la misma clave.

## Etapa U4 · Integridad y reportes entre los dos sistemas (5 h)
- [ ] U4.1 Proteger las reservas abiertas ante las limpiezas: proponer al otro equipo que `naty_resumir_movimientos` no toque movimientos con `pedido_id` de pedidos abiertos. Si no lo aceptan, la tienda reconstruye la reserva desde sus ítems.
- [ ] U4.2 Productos con pedidos de la tienda: `naty_eliminar_productos` debe darles de baja y no borrarlos. Documentar la regla y probar que no rompe pedidos.
- [ ] U4.3 Reportes de la tienda por período, con exportación a Excel con el mismo formato que el sistema de nota.
- [ ] U4.4 Vista `tienda_ventas_resumen` de solo lectura para que el sistema de nota pueda leer las ventas online sin duplicarlas.
- [ ] U4.5 Prueba de contrato: si el esquema del otro sistema cambia algo que usa la tienda, la prueba falla antes de publicar.

## Etapa U5 · Una sola base y migración conjunta (4 h más la espera)
Requiere el OK de Facundo para tocar la base, y la conexión por una vía que él autorice.

- [ ] U5.1 Apuntar la tienda al proyecto definido en U0.1.
- [x] U5.2 (12/10, sobre la instancia compartida) Aplicar `tienda_schema.sql` con la corrida de prueba primero (`--dry`) y después real. Después verificar con el script de solo lectura.
- [x] U5.3 (12/10) Registrar el proyecto en la tabla maestra `proyectos`.
- [ ] U5.4 Compra de punta a punta con Mercado Pago en modo de prueba, y un pedido de kiosco.
- [ ] U5.5 `docs/migracion.md` común: un solo orden para pasar los dos sistemas a la cuenta de Natali, con los pasos del README del otro sistema.
- [ ] U5.6 Cargar los datos reales de la tienda: precios minoristas y publicación.

## Etapa U6 · Verificación cruzada y cierre (3 h)
- [ ] U6.1 Pasada completa: 125 pruebas más las nuevas, lint, build, axe y 320 px.
- [ ] U6.2 Recorrido manual por rol sobre la base real.
- [ ] U6.3 Actualizar `docs/04-arquitectura.md`, `docs/ESTADO-DEL-PROYECTO.md`, el tablero y el cerebro.
- [ ] U6.4 Nota para el otro equipo con el contrato (sección 5) y la fecha de la próxima revisión conjunta.

## 4. Orden y dependencias
```
U0 → U1 → U2 → U3 → U4 → U5 → U6
```
- U0 bloquea todo lo demás.
- U1 y U2 se pueden desarrollar sin tocar la base real.
- U5 es la única que toca la base de datos y necesita el OK de Facundo.
- El rediseño visual (R3 y R5 de `PLAN-rediseno.md`) puede ir en paralelo. R4 toca los mismos archivos que U3, así que va después de U3.

Estimación total: 31 horas de desarrollo, más la espera de respuestas del otro equipo y de Natali.

## 5. Contrato: lo que la tienda usa del sistema de nota
Si algo de esta lista cambia, hay que avisar a la tienda antes.

- Tablas: `naty_productos`, `naty_producto_colores`, `naty_producto_fotos`, `naty_categorias`, `naty_movimientos_stock`, `naty_perfiles`, `naty_config`.
- Funciones: `naty_es_rol`, `naty_es_miembro`.
- Bucket de fotos: `naty_productos`, con la convención de miniaturas `<ruta>.mini.webp`.
- Roles: `admin`, `superadmin`, `enc_tienda`, `enc_ventas`, `enc_deposito`.
- Tipos de movimiento que la tienda agrega: `reserva` y `liberacion`.

## 6. Hallazgo del 12/10: lo que hay realmente en la base compartida
Lectura en solo lectura de la instancia `aaxrcacoavghapiqhkrn` ("automatizaciones"), antes de aplicar nada:

| Dato | Valor |
|---|---|
| Modelo de catálogo | **El viejo**: varios colores por producto y stock por color |
| Productos y colores activos | 138 productos, 745 colores. Los 138 tienen más de un color |
| Movimientos, ventas, perfiles | 647, 1 y 10 |
| Rol `superadmin`, tipo `saldo`, campos de tienda | No existen |
| Proyectos registrados | `farpep` y `naty` |

Consecuencias:
- El rediseño del sistema de nota (un color por producto) se aplicó en **otro proyecto**, `bulcbrgafrfklaejfyjd`. La base compartida sigue con el modelo viejo.
- **Hoy conviven dos modelos.** La tienda tiene que funcionar con los dos hasta que se unifiquen. Esto cambia la etapa U2: no es "pasar a por producto", es **soportar ambos**. Regla: si el producto tiene un solo color activo o el movimiento no trae color, el stock es por producto. Si tiene varios colores, es por color.
- No hay que correr en esta base el script de "un solo color por producto" del otro sistema, porque borraría 607 de los 745 colores.

### Hecho el 12/10 sobre la instancia compartida
- Corrida de prueba con rollback, sin errores.
- Aplicación real del esquema de la tienda y confirmación.
- Verificado después: `naty_` sin cambios (138, 745, 647, 1, 10), FARPEP intacto, los 138 productos con slug, ninguno publicado todavía.
- Registrado el proyecto `tienda`.
- Creados: 9 tablas `tienda_*`, 16 funciones, el bucket privado `tienda_comprobantes` y la vista pública.

### Pendiente en la base
- Cargar precio minorista y publicar productos (U5.6). Hoy ninguno está publicado.
- Crear los perfiles de las encargadas en `naty_perfiles` si faltan. La tabla tiene 10.
