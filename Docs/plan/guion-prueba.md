# Guion de prueba del frontend (Etapa 7)

Objetivo: que Facundo (y Natali, si puede) usen el sistema como lo usaría el equipo y anoten todo lo que falle, confunda o se sienta lento. **Nada de esto toca datos reales:** todo es de demostración.

## 0. Preparación (10 min)

**Opción A — en tu PC (la más simple)**
1. En una terminal: `cd app` → `npm run dev` → abre http://localhost:5173.
2. Entrá como **Natali** (PIN `0000`) → **Ajustes** → abajo: **Cargar ventas de demostración** (una vez; si la repetís suma más).
3. Para empezar de cero: Ajustes → **Reiniciar todos los datos**.

**Opción B — en celulares reales (necesaria para probar instalación, WhatsApp y modo avión)**
La instalación como app y el botón de compartir de WhatsApp solo funcionan con **https**. Hay que publicar una versión de prueba:
1. Abrí una terminal en `app/` y corré `npm run build:demo` (genera `app/dist` con la sección de datos de demostración habilitada; la versión normal `npm run build` **no** la incluye).
2. Subir la carpeta `app/dist` a Netlify (arrastrar y soltar en https://app.netlify.com/drop, o un sitio nuevo de pruebas). El archivo `_redirects` ya está incluido para que se pueda refrescar cualquier pantalla.
3. En cada celular: abrir la dirección, entrar como Natali, **Cargar ventas de demostración**, y luego entrar con el usuario que corresponda a cada prueba.
4. Android (Chrome): menú ⋮ → *Instalar aplicación*. iPhone (Safari): Compartir → *Agregar a pantalla de inicio*.

> Cada celular tiene sus propios datos (no se sincronizan hasta la etapa 8): cargá la demo en cada uno.

**Usuarios** (todos con PIN `0000`): Ariel Maydana, Brayan Aquino, Norma Toloza (vendedores) · María Córdoba (depósito) · Pamela Aramayo (tienda) · Jehovana Calla (ventas) · Natali (administradora).

## 1. Vendedor/a — entrar como Ariel Maydana
| # | Tarea | Debería pasar |
|---|---|---|
| V1 | Entrar con el PIN equivocado y después con el correcto | Mensaje claro; entra al **buscador** |
| V2 | Un cliente pregunta por el modelo **MN-012**: buscalo escribiendo solo `12` | Aparece la foto grande, los colores con stock y el precio en 1 paso |
| V3 | Mirá las fotos del modelo y ampliá una | Se desliza con el dedo; al tocar se amplía |
| V4 | Buscá algo que no existe (`zzz`) | Mensaje "No hay ningún modelo…" |
| V5 | Hacé una venta **en dólares** de 2 modelos, 2 docenas de uno y 1 del otro, pago en efectivo | Total correcto; la moneda **US$ aparece primero** |
| V6 | Cambiá la moneda a Bs antes de confirmar | Los precios se convierten; el tipo de cambio se muestra |
| V7 | Confirmá. Mirá la nota en pantalla | Logo/nombre y **QR** arriba, ítems, total, teléfonos abajo |
| V8 | **Imprimí** la nota (o guardala en PDF) en tamaño A5 | No se corta nada; el QR escanea y abre el catálogo |
| V9 | **Compartila por WhatsApp** | En el celular se abre el menú de compartir con la imagen |
| V10 | Entrá a *Ventas*: ¿ves solo las tuyas? Probá entrar a *Inventario* escribiendo `/stock` en la barra | Solo tus ventas; "No tenés acceso" |
| V11 | Cerrá el navegador a mitad de una venta y volvé a abrir | "Recuperamos la venta que tenías a medias" |

## 2. Modo avión (celular con la app instalada)
| # | Tarea | Debería pasar |
|---|---|---|
| A1 | Con internet: *Inicio* → **Descargar fotos del catálogo** | Barra de progreso; "138 de 138 guardadas" |
| A2 | Activá modo avión y abrí la app | Abre; arriba dice **Sin conexión** |
| A3 | Buscá un modelo y hacé una venta completa | Todo funciona; la venta queda **Pendiente de enviar** |
| A4 | Desactivá el modo avión | La venta pasa a **Sincronizada** sola |

## 3. Encargada de depósito — María Córdoba
| # | Tarea | Debería pasar |
|---|---|---|
| D1 | Entrar | Arranca en **Inventario** |
| D2 | Elegí un producto, un color, y registrá una **entrada** de 24 prendas | Se suma al stock y aparece en el historial con tu nombre |
| D3 | Registrá una **salida** de más prendas de las que hay | Error claro, no deja |
| D4 | Hacé un **ajuste** por conteo real | Se registra la diferencia |
| D5 | Cargá un producto nuevo con 3 fotos y 4 colores (*Buscar → Administrar → Nuevo*) | Se crea; aparece en el buscador |
| D6 | Descargá la planilla de stock, cambiá 3 cantidades en Excel y subila | Vista previa de cambios; se aplican con historial |
| D7 | Intentá abrir *Ventas* | "No tenés acceso" |

## 4. Encargadas de ventas y de tienda — Jehovana Calla / Pamela Aramayo
| # | Tarea | Debería pasar |
|---|---|---|
| E1 | Entrar | Arrancan en **Inicio**: ventas de hoy, por vendedor, stock |
| E2 | *Ventas* → filtrá por vendedor, moneda y fechas | Los totales por moneda cambian y **no se mezclan** |
| E3 | Jehovana: **Exportar a Excel** | Se descarga; las cifras coinciden con la pantalla |
| E4 | Abrí una venta | No aparece "Anular venta" (solo la administradora) |
| E5 | Pamela: abrí *Inventario* | Ve el stock, **no** puede modificarlo |
| E6 | *Comisiones* | Ve a todo el equipo, con la comisión "pendiente de definir" |

## 5. Administradora — Natali
| # | Tarea | Debería pasar |
|---|---|---|
| N1 | *Ajustes*: cargá el tipo de cambio real, el teléfono de cada vendedor y la dirección del catálogo | Se guarda; la próxima nota sale con esos datos |
| N2 | Subí el **logo** | Sale en el encabezado de la nota |
| N3 | Anulá una venta con motivo | Nota marcada "ANULADA"; el stock vuelve |
| N4 | Cambiá el precio de una línea durante una venta | Se marca "precio modificado" |
| N5 | Importá productos desde Excel (usá la plantilla) con un error a propósito | La vista previa marca la fila con error y no la importa |

## 6. Dispositivos a cubrir
- [ ] Android de gama baja (el más lento que tengan)
- [ ] iPhone (Safari)
- [ ] PC con Chrome (impresora real A5 o "Guardar como PDF" A5)
- [ ] Una conexión mala (datos móviles débiles)

## 7. Cómo anotar
Todo lo que falle, confunda o se sienta lento va en [hallazgos-etapa-7.md](hallazgos-etapa-7.md): qué hiciste, qué esperabas, qué pasó, en qué dispositivo, y captura si se puede. Marcá como **bloqueante** lo que impide vender o imprimir.
