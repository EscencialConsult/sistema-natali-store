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
