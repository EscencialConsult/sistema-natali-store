# Publicación a producción (etapa E9): procedimiento

Requiere el OK de Facundo **y** de Renzo. Hacerlo fuera del horario de ventas.
Todos los comandos se corren desde la raíz del repositorio. La cadena de conexión va en una variable de entorno y nunca se guarda en un archivo.

```powershell
$env:DATABASE_URL = "postgresql://postgres.<ref>:<clave-codificada>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
$env:PG_CA_FILE   = "C:\ruta\a\supabase-ca.crt"   # CA raíz de Supabase (prod-ca-2021.crt)
```

## 0. Antes de tocar nada

| Chequeo | Cómo | Estado al 15/10 |
|---|---|---|
| Respaldo reciente de las tablas | `node Docs\tienda\herramientas\respaldo.mjs C:\respaldos\<fecha>` | Hecho el 15/10 (534 filas) |
| Respaldo de las fotos del bucket y las cuentas | Exportar desde Supabase (Database y Storage) | **Pendiente** |
| Línea base reciente | `Docs\tienda\linea-base.sql` en el SQL Editor | Hecho el 15/10 |
| Confirmar con Renzo en qué sitio de Netlify está hoy el sistema, y que `modas-naty.netlify.app` es ese sitio | Preguntar | **Pendiente** |
| Avisar al equipo que la app instalada pasa a `/admin` | Mensaje al equipo | **Pendiente** |
| Rotar claves que pasaron por chats (Mercado Pago, Brevo, correo de Natali) | Paneles de cada servicio | **Pendiente** |

## 1. Esquema de la base

```powershell
# Prueba: corre todo en una transacción y revierte siempre.
node app\scripts\aplicar-tienda.mjs --guardar C:\respaldos\fotos-<fecha>

# Solo si dijo PROBADO_Y_REVERTIDO y "Objetos naty_*: SIN CAMBIOS":
node app\scripts\aplicar-tienda.mjs --aplicar --guardar C:\respaldos\fotos-<fecha>-aplicado
```

El ejecutor revierte solo si cambia cualquier objeto de Renzo. Después de aplicar:

```powershell
node Docs\tienda\herramientas\comparar-linea-base.mjs <antes>.json <despues>.json
```

Debe decir "Objetos naty_*: SIN CAMBIOS". Las filas que cambien por ventas legítimas se informan aparte.

## 1b. Datos iniciales de la tienda

Carga la transferencia y los locales con sus horarios en `tienda_config`. Escribe solo en esa tabla, valida con las mismas reglas que el editor de Ajustes, y por defecto prueba y revierte. El archivo con los datos vive **fuera del repo** porque tiene datos bancarios.

```powershell
node app\scripts\cargar-config-tienda.mjs C:\Users\PERSONAL\.claude\secretos\modas-naty-tienda-config-inicial.json            # prueba
node app\scripts\cargar-config-tienda.mjs C:\Users\PERSONAL\.claude\secretos\modas-naty-tienda-config-inicial.json --aplicar  # guarda
```

Antes de aplicar, completar en ese archivo lo que falte (banco y enlaces de mapa). Después, quien administre actualiza todo desde Ajustes.

## 2. Publicar el código

1. Pasar `feature/tienda-online` por un PR a `main` para que lo revise Renzo.
2. Netlify construye desde `app/` (ya está en `netlify.toml`). Variables en el panel de Netlify: solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca la clave de servicio.
3. Probar primero en un **deploy preview**.

## 3. Verificación después de publicar

- [ ] `/` carga la tienda con los 45 modelos y sin errores en la consola.
- [ ] `/admin` carga el login de Renzo y se puede iniciar sesión.
- [ ] En un celular con la app **ya instalada**, abre el sistema y no la tienda.
- [ ] **Celulares del equipo con la versión vieja**: el service worker viejo sigue mostrando la app anterior hasta que se actualiza. Cada persona tiene que abrir la app **una vez con internet** y tocar "Actualizar" cuando aparezca el aviso. Mientras no lo haga, ve la versión vieja (que sigue funcionando). Conviene mandarles ese paso por WhatsApp el día de la publicación y probarlo antes con un celular real.
- [ ] `/c` lleva a la tienda. Un QR de una nota vieja funciona.
- [ ] Una nota de venta nueva se crea y se imprime sin cambios.
- [ ] Sin conexión, el sistema interno sigue vendiendo.
- [ ] Un pedido de prueba sale por WhatsApp con los datos correctos.
- [ ] Natali carga un horario en Ajustes y se ve en la tienda.

## 4. Si algo falla (vuelta atrás)

| Situación | Acción |
|---|---|
| La tienda se ve mal o falla | En Netlify, volver al deploy anterior. Es inmediato y no toca la base |
| El sistema interno no abre en `/admin` | Idem: volver al deploy anterior. La base no se modificó por esto |
| Hay que retirar la tienda de la base | Solo con OK explícito: borra objetos **de la tienda** (nunca de Renzo): las dos vistas y las dos tablas `tienda_*`. Se pierden solo los datos de `tienda_config` y `tienda_oculto` |
| Cualquier duda sobre datos de Renzo | Comparar con `respaldo.mjs` del 15/10 (huellas SHA-256 en su `MANIFIESTO.json`) |

## La tienda pública durante la publicación

El sistema del equipo **no** se pone en mantenimiento: es offline-first, cada celular guarda las ventas en su cola local y las envía cuando puede, y el despliegue en Netlify es atómico. Lo único que cambia para el equipo es que la app pasa a vivir en `/admin`; ver la nota del service worker más arriba y hacerlo fuera del horario de ventas.

La tienda pública queda cubierta sola: mientras la tabla `tienda_config` no exista en la base, la raíz muestra «Estamos preparando la tienda» con el WhatsApp y los locales. En cuanto se aplica el esquema y se carga la configuración, la tienda queda abierta. Para revisarla antes, el equipo entra a `https://modas-naty.netlify.app/?previa=1`.

Si alguna vez hace falta cerrarla a mano (por ejemplo, para cambiar la cuenta con calma): cargar con `cargar-config-tienda.mjs --aplicar` un JSON con `{ "tienda": { "cerrada": true, "mensaje": "…" } }`, y para abrirla `{ "tienda": { "cerrada": false } }`. No hay interruptor en el Gestor web (decisión del 16/10).

## Vendedores que ve la clienta

Salen solos de Usuarios: rol «Vendedor/a», activo y con teléfono cargado. Antes de publicar, revisar en Usuarios que cada vendedor tenga su teléfono con código de país; el que no lo tenga no aparece en la tienda.

## Dominio oficial de la tienda: `modasnaty-tienda.onelabs.pro`

Estado al 16/10: el dominio existe y apunta por CNAME a `modasnaty-tienda.netlify.app`, un sitio de Netlify que hoy sirve la **tienda vieja** (la de Mercado Pago). El DNS de `onelabs.pro` está en Hostinger (servidores `dns-parking.com`). El QR de las notas ya manda a este dominio.

Para que ese dominio muestre la tienda nueva, sin duplicar despliegues, hay que hacer tres cosas el día de la publicación, en este orden:

1. **Netlify**: en el sitio donde vive el sistema de Renzo (confirmar cuál con él), agregar `modasnaty-tienda.onelabs.pro` como dominio personalizado. Netlify emite el certificado solo cuando el DNS ya apunta.
2. **DNS en Hostinger** (`onelabs.pro`): cambiar el CNAME de `modasnaty-tienda` para que apunte al sitio del sistema (por ejemplo `modas-naty.netlify.app`) en vez de `modasnaty-tienda.netlify.app`. Hasta que propague (minutos, a veces horas), el dominio sigue mostrando la tienda vieja.
3. **Supabase, Authentication → URL Configuration**: agregar `https://modasnaty-tienda.onelabs.pro/**` a las Redirect URLs. El ingreso del equipo es con usuario y contraseña y no depende de esto, pero evita sorpresas si algún día se usa recuperación de contraseña.

Después: en Ajustes, «Dirección del catálogo (para el QR)» debe ser `https://modasnaty-tienda.onelabs.pro/`. El sitio viejo `modasnaty-tienda.netlify.app` se puede borrar o dejar apagado una vez que el dominio apunte al nuevo.

La tienda nueva **no manda correos**: no hace falta configurar nada en Brevo para este dominio. Brevo era de la tienda vieja (correos de pedidos con Mercado Pago).
