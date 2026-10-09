# Notas — Etapa 8: Backend con Supabase (2026-10-08)

> ## Actualización: adaptado al sistema de Supabase compartido de Facundo
> Facundo indicó que la base va **provisoriamente** en el Supabase compartido de su cerebro (skill `supabase-automatizacion-skill`: un proyecto, muchos sistemas, separados por prefijo y registrados en la tabla `proyectos`) y que al final se migra a una cuenta de la clienta. El primer diseño (schema propio + 5 migraciones) **no cumplía las reglas de esa skill** y tenía **dos riesgos reales en una instancia compartida**, que se corrigieron:
> 1. Un trigger creaba un perfil de Modas Naty por cada usuario nuevo de `auth.users`: en la instancia compartida, **usuarios de otros proyectos habrían quedado como vendedores**. → Eliminado: los perfiles los crea solo la administración (`naty_configurar_usuario`).
> 2. La lectura estaba abierta a "cualquier usuario autenticado": **usuarios de otros proyectos habrían podido leer catálogo, stock, perfiles y ajustes**. → Ahora hay que ser **miembro** (perfil activo) para leer; hay prueba que lo verifica.
>
> Cambios de forma (según la skill): **un solo archivo idempotente** `app/supabase/naty_schema.sql` (sin migraciones sueltas), todo con **prefijo `naty_`** en `public` (tablas, funciones, vista, tipos, bucket `naty_productos`), registro en `proyectos`, `app/SUPABASE-REGLAS.md`, y se quitó la modificación de la configuración global de la API (era riesgoso en una instancia compartida). Las pruebas aplican el archivo **dos veces** y verifican que solo crea objetos `naty_*` (más `proyectos`) y que no cuelga nada de `auth.users`.
>
> **Pendiente de decisión de Facundo:** (a) cuál instancia (ver abajo), (b) el **modo de acceso**: la skill exige MODO CERRADO para plata y datos de clientas, y este sistema (PWA sin conexión, directo a Supabase con la sesión de cada persona) usa un modo "abierto-autenticado endurecido" que figura como excepción en `SUPABASE-REGLAS.md`, (c) quién sube el archivo (a mano en el SQL Editor o con el runner).
>
> **Qué instancia:** en el cerebro hay dos. La de **automatizaciones** (cuenta areaidautomatizaciones@gmail.com, ref `aaxrcacoavghapiqhkrn`, ya tiene `farpep`) es la que define la skill, pero **no aparece en la sesión del CLI** (que es de la cuenta personal de Facundo). La de **DISC + Eneagrama** (`platform_disc2026`, ref `pnyzlhmpfavrusqgjuxk`) sí aparece en el CLI y es la que originó el patrón.

> ## ESTADO ACTUAL (2026-10-08): app conectada y probada contra el Supabase REAL
> Decisiones de Facundo: instancia **Automatizaciones** (`aaxrcacoavghapiqhkrn`), modo **autenticado endurecido** (excepción provisoria en `SUPABASE-REGLAS.md`), subida con el **runner** (autorizado), y las claves anon y service_role guardadas por él en su archivo de secretos (las agregué ahí; la `service_role` no está en el proyecto).
> - **Esquema aplicado** con `app/scripts/aplicar-schema.mjs` (inspección de solo lectura → ensayo con rollback → commit → segunda pasada con rollback) y verificado con `app/scripts/verificar-schema.mjs` (RLS en las 9 tablas, `anon` sin acceso, funciones solo para `authenticated`, alta de personas cerrada, bucket con 4 políticas, cero triggers sobre `auth.users`, registro en `proyectos`, **FAREP intacto y cerrado**).
> - **7 personas dadas de alta** (`app/scripts/crear-usuarios.mjs`: Auth con contraseña aleatoria + rol con `naty_configurar_usuario`). Contraseñas en `C:\Users\PERSONAL\.claude\secretos\modas-naty-usuarios.md` (fuera del proyecto). Pendientes de dato real: **Natali** (no hay correo suyo: la cuenta administradora es provisoria, a nombre de Facundo) y **Jehovana Calla** (el correo original tiene una "ñ" que Auth rechaza —probable error de tipeo—: quedó con un correo provisorio `jehovana.calla.pendiente@example.com` a reemplazar).
> - **Catálogo de ejemplo cargado** (`app/scripts/cargar-catalogo-demo.mjs`): 15 categorías, 138 productos, 745 colores, 138 fotos en Storage y 643 movimientos de stock inicial. Son datos de prueba (de otra marca), no de la clienta.
> - **Prueba de integración real** (`src/data/remoto/integracion-real.test.js`, se salta sola sin credenciales): 6 pruebas contra Auth, API REST y Storage verdaderos con `supabase-js`: dispositivo nuevo baja el catálogo; venta enviada, con stock descontado e idempotente; **`anon` no abre nada** (42501) salvo el catálogo público sin stock ni costos; un **usuario de otro proyecto sin perfil no ve nada ni puede operar**; un vendedor no puede anular ni editar catálogo, la administradora anula y el stock vuelve; la encargada de depósito sube un producto con foto a Storage (URL pública, stock inicial). La prueba limpia todo lo que crea (verificado: 0 restos).
> - **Prueba en el navegador** contra el servidor real: ingreso con contraseña incorrecta (mensaje claro) y correcta, catálogo de 138 modelos con fotos desde Storage, búsqueda, y una venta hecha desde la interfaz que quedó **Sincronizada en 1,4 s**.
> - Error real que solo apareció en esta prueba: el ingreso consultaba `perfiles` en vez de `naty_perfiles` (corregido). Mejora: el envío ahora arranca ~1 s después de guardar (antes esperaba hasta 30 s).
> - **Falta**: modo avión con el servidor real en dos celulares (la lógica está probada en memoria y en navegador sin servidor), correo/contraseña reales de Natali y Jehovana, cambio de las contraseñas iniciales por cada persona.

**Estado: esquema aplicado, personas dadas de alta y app probada contra la instancia real; falta el modo avión con dos celulares reales y los datos reales de Natali y Jehovana.**
Verificación: lint sin avisos · build OK · **92 tests** automáticos (24 contra Postgres real con los permisos de producción y 16 de sincronización de punta a punta) **+ 6 de integración contra el Supabase real**.

## Qué se hizo
**Base de datos** (`app/supabase/naty_schema.sql`, archivo único con prefijo `naty_`; ver `app/supabase/README.md` y `app/SUPABASE-REGLAS.md`):
- Un archivo SQL idempotente: tablas, permisos por rol (RLS), funciones, fotos (Storage), alta de personas, ajustes base y registro del proyecto.
- **Lo delicado no se escribe con INSERT/UPDATE directos**: ventas, anulaciones y cambios de catálogo pasan por funciones que revisan permiso, titularidad y totales. Tablas en solo lectura para la app, salvo stock manual, categorías y ajustes.
- Venta idempotente (reenviar no duplica), todo o nada, y los movimientos de stock conservan el mismo id en el celular y en el servidor (no se cuentan dos veces).
- Catálogo público (`catalogo_publico`): sin stock, sin costos, sin ventas; precio solo si la administración lo activa.
- Iniciales únicas por persona (forman el número de nota).

**App**:
- Cola de sincronización ampliada: ahora **todo cambio local** (ventas, anulaciones, productos con fotos, stock, ajustes, teléfonos, categorías) se envía, no solo las ventas.
- `sync/remoto.js`: envío (con subida de fotos a Storage) y bajada incremental. Regla de oro: lo que está "por enviar" en un dispositivo **no se pisa** con lo del servidor.
- Ingreso real con correo y contraseña (sesión guardada: sin internet se sigue adentro). Con servidor no hay datos de ejemplo; la primera vez en un dispositivo se baja el catálogo.
- Salir con cambios sin enviar está bloqueado (otra persona no podría enviarlos). En un celular compartido, al salir se borra lo local.
- Una venta que el servidor rechaza queda marcada "con problema" y la nota muestra el motivo.
- Sin las dos variables de entorno la app sigue funcionando en modo prueba (verificado).

## Qué se probó (y cómo)
| Prueba | Resultado |
|---|---|
| Permisos: cada rol ve/hace solo lo suyo; nadie escribe ventas directo; nadie falsifica ventas con un INSERT de stock; un vendedor no se hace administrador (ni por `user_metadata` ni llamando funciones de alta) | OK |
| **Las pruebas de permisos fallan si se rompe la regla** (se rompió a propósito una política y fallaron 3) | OK |
| Venta: descuenta stock, idempotente, rechaza ajena / sin permiso / sin sesión / vacía / total distinto / movimiento inválido, sin dejar nada a medias | OK |
| Anulación: solo administración, con motivo, devuelve stock, idempotente | OK |
| Dispositivo nuevo se llena; bajar de nuevo no duplica; ventas propias no se cuentan dos veces | OK |
| Otro vendedor ve el stock pero no ventas ajenas; encargada de tienda y admin ven todo | OK |
| Foto subida desde el celular → Storage → dirección pública en servidor y dispositivo | OK |
| Quitar color: queda `eliminado` en servidor y desaparece al bajar | OK |
| Lo pendiente del dispositivo no se pisa al bajar | OK |
| Un vendedor que edita el catálogo es rechazado y el pedido queda "con problema" con su motivo | OK |
| La app en modo prueba (sin servidor) y en modo servidor (con servidor caído: mensaje "hace falta internet") | OK, en navegador |

## Lo que NO está probado todavía (necesita Supabase de verdad)
1. Las migraciones **sobre un Supabase real** (Auth, Storage y la API REST reales). Lo probado es Postgres real con simulación de `auth.uid()`, roles y Storage: la lógica y los permisos están verificados, pero la integración con el servicio no.
2. `supabase-js` real (el cliente de la prueba imita su API para lo que usa la app).
3. Renovación de sesión, CORS y fotos desde Storage en celulares reales; modo avión con servidor real.
4. Subir `naty_schema.sql` a la instancia compartida (hay que confirmar la instancia y quién lo corre).

## Cómo seguir (cuando haya accesos)
Con la instancia confirmada, la clave pública (anon) y la subida de `naty_schema.sql`: crear las 7 personas → `usuarios.ejemplo.sql` con los correos reales → `.env.local` → cargar el catálogo → prueba con dos celulares (una venta sin internet, modo avión, anulación desde otra cuenta). Alternativa sin nube: Supabase local con Docker (instalado pero apagado; baja varios GB), para repetir esas pruebas con el stack real en la computadora.

## Decisiones tomadas
- Prefijo `naty_` en `public` (regla de la skill de la instancia compartida), un solo archivo idempotente y registro en `proyectos`.
- El rol sale de la tabla de perfiles (la maneja la administración), no de metadatos editables. Sin perfil activo no se ve ni se hace nada (usuarios de otros proyectos de la instancia).
- Categorías con id estable por nombre: dos celulares que crean "BLUSAS" sin conexión no chocan.
- Números de nota por persona y dispositivo; si una persona vende desde dos dispositivos a la vez sin conexión podrían repetirse (se puede consultar; ver README).
- La demo (`Cargar ventas de demostración`) queda deshabilitada cuando hay servidor.

## Pendiente conocido
- Limpieza de fotos viejas en Storage al reemplazarlas (no afecta el funcionamiento).
- Recuperar contraseña por correo desde la app (hoy la administración la restablece en Supabase).
- Subir el catálogo real de Natali (script o carga masiva desde la app, ya existe).
- Bloqueos de negocio abiertos: B1 comisión · B2 logo · B3 teléfonos reales · B4 URL del catálogo · B5 tipo de cambio · B6 permisos · B7 formato de carga masiva.
