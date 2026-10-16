# Auditoría integral del 15/10/2026

Alcance: todo lo hecho en la rama `feature/tienda-online`, la carpeta del proyecto, las notas de `cerebro-facundo` y los archivos locales que se generaron. Método: búsqueda de secretos y datos personales en el código y el historial, lectura del esquema y de los permisos, revisión de cada lugar donde la tienda lee o escribe, y comparación de la documentación con el código.

**Qué NO se verificó**: nada contra la base de producción de Renzo (nunca se tocó). Los permisos se probaron solo contra una copia en memoria del esquema. Tampoco se probó en celulares reales.

## Resultado en una línea

No hay fugas activas de secretos hacia afuera: nada se subió (la rama es solo local). Hay **cuatro cosas para resolver antes de publicar** y varias inconsistencias menores, ya corregidas o anotadas.

## Para resolver antes de publicar (en orden)

| # | Hallazgo | Riesgo | Qué hacer |
|---|---|---|---|
| 1 | ~~La copia de `tienda-origen` incluye una prueba con un token de Mercado Pago con los ids reales.~~ **Hecho el 16/10**: se reescribió el historial local (23 commits) quitando `netlify/`, `checkout`, `kiosco`, `panel`, `pagos` y los scripts de Mercado Pago de `tienda-origen`. Verificado: cero coincidencias en todo el historial. | — | — |
| 2 | Contraseñas y claves que pasaron por el chat: contraseña de la base, contraseña del correo de Natali, y claves de Mercado Pago y Brevo que se mostraron con enmascarado incompleto. | Alto si esos chats se guardan o comparten. | **Decisión de Facundo (16/10): no se rotan.** La clave de Brevo y la de la base son las definitivas. Queda anotado el riesgo: esas claves existen en el historial de chat de esta máquina. |
| 3 | Respaldos con datos personales sin cifrar en `C:\respaldos\` (ventas, clientes, usuarios, fotos). | Medio: es el disco de una persona. | Moverlos a una carpeta cifrada o un disco externo y borrar los de la carpeta común cuando Renzo confirme el respaldo oficial. |
| 4 | `main` local tiene un commit que toca `naty_productos` (0b8899b), abandonado por la regla de cero cambios a tablas de Renzo. `origin/main` no lo tiene. | Bajo, pero puede colarse en un push o un merge por error. | Con tu OK, volver `main` local a `origin/main`. No hace falta tocar nada más. |

## Hallazgos corregidos hoy

| # | Hallazgo | Corrección |
|---|---|---|
| A | La copia local de la cuenta de transferencia no vencía nunca. Una clienta sin conexión podía ver un CBU anterior al cambio de cuenta. | La copia de configuración vale 1 hora y la de ajustes (cotización) 6 horas. Pasado ese tiempo no se usa y la pantalla pide los datos al vendedor. |
| B | El aviso "confirmá los datos de la cuenta" dependía solo de la antigüedad, ignorando la fecha de cambio cargada. | Ahora usa el estado de la cuenta: con fecha manda la fecha, sin fecha manda la antigüedad (50 y 60 días). |
| C | El editor de la tienda aparecía para cualquier administrador y estaba todo mezclado en Ajustes. | Pasó a un Gestor web con pestañas, visible solo para el superadmin. |
| D | Documentación con rutas viejas (`/tienda`) y un punto de rollback que ya no era válido. | Corregidas en el plan, el contrato, el registro de cambios y el mensaje a Renzo. |
| E | Código sin uso: una función de aviso que reemplazó el estado de cuenta. | Eliminada junto con su prueba. |
| F | Claves de lista repetidas si dos locales o vendedores tenían el mismo nombre. | Las claves incluyen la posición. |

## Inconsistencias y riesgos aceptados o pendientes

- **La cuenta de transferencia es pública por diseño.** Cualquiera que consulte la API de la tienda ve titular, CUIT y CBU sin hacer un pedido. Es lo que se acordó con Fabiana para que la clienta transfiera sin intermediarios. Mitigación: el dato es el mismo que la clienta recibiría por WhatsApp, y la cuenta cambia cada 2 meses.
- **Permisos de escritura: resuelto el 16/10.** El Gestor web lo ven admin y superadmin, igual que las políticas de la base (`naty_es_rol('admin')`) y que el resto de Ajustes de Renzo. Decisión de Facundo.
- **Cualquier clave nueva en `tienda_config` queda pública.** El editor siempre guarda con visibilidad pública. Hoy las claves son fijas y no hay datos privados ahí. No guardar secretos en esa tabla.
- **Demo.** La clave de las cuentas de demostración está escrita en el repo y en el log de `cerebro-facundo`. Son cuentas que solo existen en memoria mientras el servidor demo está abierto. Riesgo bajo, pero no usar esa clave en ningún lugar real.
- **`cerebro-facundo` tiene un remoto en GitHub** (`Pachilazarte/facundo-brain`). No pude confirmar si es privado: la cuenta con la que trabaja `gh` es otra. Verificarlo a mano. Ese repo contiene notas del proyecto y la línea del log con la clave de demostración.
- **`Docs/05-equipo-y-roles.md`** (de Renzo, anterior a mi trabajo) lista correos personales del equipo en el repo de la organización. No lo toqué. Conviene avisarle.
- **Service worker del sistema de Renzo.** Los celulares del equipo que ya instalaron la app pueden seguir viendo la versión vieja hasta abrirla una vez con internet y tocar "Actualizar". Ya está documentado en `PUBLICACION.md`.
- **Zonas horarias.** La fecha de cambio de la cuenta se interpreta en la hora del navegador de quien mira. Argentina y Bolivia difieren una hora: el aviso puede adelantarse o atrasarse por horas, nunca por días.
- **Límite de 1000 modelos** en el catálogo completo y en el Gestor. Hoy el negocio tiene bastante menos. Si crece, hay que paginar.
- **Pendientes que dependen de terceros** (ya listados en el plan): respuestas de Renzo, OK para aplicar el esquema, respaldo completo con usuarios y bucket, accesibilidad con herramienta automática, Lighthouse y prueba en celulares reales.

## Lo que se comprobó que está bien

- La tienda **no escribe** en ninguna tabla de Renzo: las únicas escrituras son en `tienda_config` y `tienda_oculto`.
- Las vistas públicas proyectan columnas explícitas y no exponen costos, stock, clientes, ventas ni usuarios.
- El precio público solo sale con "Mostrar precios" activo.
- Ningún secreto (claves de servicio, contraseñas de base, tokens) en los archivos versionados actuales. Los datos bancarios reales no están en el repo ni en su historial; solo en la base y en un archivo fuera del repo.
- Los enlaces externos usan `noopener noreferrer`. No hay HTML inyectado ni `eval`. Los enlaces de mapa solo se aceptan si son `https` de Google Maps.
- La carpeta temporal del navegador de pruebas está ignorada por git y no contiene claves.
- 233 pruebas pasan, sin errores de lint, y el build compila.
