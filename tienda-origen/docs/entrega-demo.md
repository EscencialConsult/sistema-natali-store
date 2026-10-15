# Texto para compartir la demo (editar el link)

> Hola. Te paso la **primera versión navegable de la tienda online de Modas Naty**: [LINK DE NETLIFY]
>
> **Qué es**: la tienda pública, el kiosco táctil para el local y el panel de administración, todo en una sola página. Los productos y precios son de ejemplo.
>
> **Qué podés probar**
> - **Tienda (celular o computadora)**: entrá al link, mirá el catálogo, agregá productos al carrito y hacé un pedido. El pago es simulado: no se cobra nada.
> - **Panel**: entrá a `[LINK]/administracion`. Elegí el usuario *Natali* e ingresá el PIN `0000`. Ahí ves pedidos, productos, stock, gastos, reportes y la configuración.
> - **Kiosco**: entrá a `[LINK]/kiosco`. Pide un PIN de activación: `2468`. Es la pantalla táctil para el mostrador, con ticket de 80 mm.
>
> **Importante**
> - Los datos viven en cada navegador: lo que hagas en tu celular no aparece en la computadora. Es solo para probar.
> - El cobro con Mercado Pago, las fotos reales y el logo se conectan en la siguiente etapa.
>
> **Qué necesito de ustedes para seguir**
> 1. Logo, colores y textos de "Quiénes somos" y contacto.
> 2. Qué productos publicar y a qué precio minorista.
> 3. Cómo manejan los envíos.
> 4. Una cuenta de Mercado Pago (la crea quien administra) para cobrar.
> 5. Qué equipo van a usar en el kiosco (pantalla táctil e impresora térmica).

## Accesos de la demo
| Zona | Dirección | Acceso |
|---|---|---|
| Tienda | `/` | libre |
| Panel | `/administracion` | usuario Natali (admin), Pamela Aramayo (encargada de tienda) o María Córdoba (encargada de depósito) · PIN `0000` |
| Kiosco | `/kiosco` | PIN de activación `2468` |

El PIN `0000` y el `2468` existen solo en modo demo. En producción se reemplazan por usuarios reales.

## Qué se hizo hasta ahora
Etapas 0 a 4, 6, 7 y 8 de las 10 del plan (ver `docs/plan/tareas-v1.md`): sitio público, catálogo, carrito y pedido, kiosco con ticket, panel completo, base de datos preparada y probada, instalable como app, preparada para Google y accesible.
Falta: cobro con Mercado Pago (necesita sus credenciales), prueba en el equipo real del kiosco, datos reales, dominio y puesta en producción.
