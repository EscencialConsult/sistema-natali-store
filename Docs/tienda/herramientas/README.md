# Herramientas de seguridad para tocar la base de Renzo

Las tres son de **solo lectura**. Sirven para tener, antes de cambiar nada, una foto exacta de cómo está la base y una copia de sus datos.
Fueron probadas contra el esquema real de Renzo en un Postgres en memoria (`probar-herramientas.mjs`).

| Herramienta | Qué hace | Quién la corre |
|---|---|---|
| `linea-base.sql` | Foto de la estructura: tablas, vistas, funciones, permisos, políticas, triggers y conteos. Sin datos de personas | Renzo o Facundo, en el SQL Editor de Supabase |
| `respaldo.mjs` | Copia de todas las tablas `naty_*` en archivos, con huella de verificación | Quien tenga la cadena de conexión de la base |
| `comparar-linea-base.mjs` | Compara dos fotos y avisa si algo de `naty_*` cambió | Facundo, después de aplicar algo |

## 1. Línea base (5 minutos, sin instalar nada)

1. Supabase → proyecto de Renzo → **SQL Editor** → **New query**.
2. Pegar todo el contenido de `linea-base.sql` y apretar **Run**.
3. El resultado es una sola celda llamada `linea_base`. Copiarla y guardarla como `linea-base-ANTES.json` (en `Docs/tienda/`).

No crea, modifica ni borra nada. Es un único `select`.

## 2. Respaldo (porque hoy no hay ninguno)

Con la cadena de conexión del proyecto (Supabase → Project Settings → Database → Connection string → **Session pooler**):

```powershell
$env:DATABASE_URL = "postgresql://postgres.<ref>:<clave>@<host>:5432/postgres"
node Docs\tienda\herramientas\respaldo.mjs C:\respaldos\modas-naty-2026-10-15
```

- La carpeta de salida **tiene que estar fuera del repo**: el script se niega si no.
- Abre la conexión en modo solo lectura y valida el certificado de la base.
- Deja un archivo por tabla y un `MANIFIESTO.json` con conteos y SHA-256.
- No incluye las fotos del bucket ni las cuentas de acceso. Para eso, el respaldo de Supabase (Database → Backups) o que Renzo las exporte.

Si Supabase muestra "Backups" en su plan, activarlos o confirmar la fecha del último es mejor que esto. Esto es el piso mínimo.

## 3. Después de aplicar algo

```powershell
node Docs\tienda\herramientas\comparar-linea-base.mjs Docs\tienda\linea-base-ANTES.json Docs\tienda\linea-base-DESPUES.json
```

Código de salida 0 = ningún objeto de Renzo cambió. Las filas que crecieron por ventas legítimas se informan aparte.

## Correr tests y desarrollo desde esta carpeta

La ruta tiene `#`, que rompe Vite y PGlite. `iniciar-dev.bat` monta el repo como unidad `S:` y corre desde ahí:

```
Docs\tienda\herramientas\iniciar-dev.bat test
Docs\tienda\herramientas\iniciar-dev.bat node Docs\tienda\herramientas\probar-herramientas.mjs
```
