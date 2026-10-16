# Demostración local

Sirve para **ver y probar la tienda y el sistema de notas en tu compu**, sin tocar la base de Renzo ni ningún dato real. No hace falta Docker.

## Cómo abrirla

Doble clic en `Docs\tienda\herramientas\iniciar-dev.bat` con el argumento `demo`, o desde una terminal en la raíz del repo:

```powershell
Docs\tienda\herramientas\iniciar-dev.bat demo
```

Compila la app y la deja andando en **http://localhost:4300**. Para apagarla: `Ctrl+C`.

| Qué | Dirección |
|---|---|
| Tienda pública | http://localhost:4300/ |
| Sistema de notas y stock | http://localhost:4300/admin |

## Usuarios

Todos con la contraseña **`Demo-Naty-2026`**.

> **Datos reales en la demo.** Si existe `~\.claude\secretos\modas-naty-tienda-config-inicial.json` (la configuración real de la tienda, fuera del repo), el servidor demo la carga en lugar de la cuenta de ejemplo, así la tienda se ve con los datos verdaderos conectados por la base. Solo se sirve en `127.0.0.1`. Para usar otro archivo: variable `DEMO_CONFIG_TIENDA`. Son de ejemplo y solo existen mientras la demostración está abierta.

| Usuario | Rol | Para probar |
|---|---|---|
| `natali` | superadmin | Todo: Ajustes de la tienda, usuarios, limpieza |
| `fabiana` | admin | Ajustes y Gestor web, sin gestión de usuarios |
| `carla` | vendedor | Segunda vendedora: con ella se ve el selector de vendedor en el pedido |
| `pamela` | encargada de tienda | Lo que ve una encargada |
| `ariel` | vendedor | Que NO pueda cambiar la configuración de la tienda |

## Qué probar

1. **Tienda** (`/`): portada, catálogo con 60 modelos de ejemplo, filtros por categoría, orden, ficha, agregar al pedido, elegir vendedor, ver los datos de transferencia y armar el mensaje de WhatsApp.
2. **Ajustes** (`/admin` → Ajustes, con `natali`): al final están las tarjetas **Tienda online**. Cambiá el alias de la cuenta, un horario, o destildá un modelo en "modelos visibles", y recargá la tienda.
3. **Permisos**: entrá como `ariel` y fijate que la tienda online no le deja guardar nada.

## Qué es real y qué no

| Real | De ejemplo |
|---|---|
| El esquema completo de Renzo y el de la tienda, con sus permisos por rol y sus funciones | Los usuarios, las fotos, los productos y el stock |
| El login con usuario y contraseña (la contraseña se guarda con `crypt`, como en Supabase) | Los datos bancarios (cuenta de demostración) |
| Las pantallas y el código, idénticos a los que se van a publicar | Los teléfonos de vendedores |

Lo que **no** se puede probar acá: Mercado Pago (descartado), el envío real de WhatsApp (abre el enlace pero no manda nada), ni cómo se comporta con la base real de Renzo hasta aplicar el esquema.

## Cosas a saber

- **Todo vive en memoria.** Al apagarla se pierde lo que cambiaste y vuelve a empezar de cero.
- **Si cambiás el código y recompilás, recargá con `Ctrl+F5`.** El sistema de notas guarda una copia para funcionar sin internet y el navegador puede mostrarte la versión anterior.
- **Escucha solo en tu compu** (`127.0.0.1`). Nadie más de tu red la ve.
- El código está en `app/scripts/servidor-demo.mjs` y tiene su prueba automática.
