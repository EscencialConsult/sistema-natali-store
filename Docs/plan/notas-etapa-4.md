# Notas de cierre — Etapa 4: Nueva venta + nota A5 (2026-10-08)

Verificación: lint sin avisos · build OK · 38 tests · recorrido manual en celular (venta de 2 productos en USD → nota) · **PDF A5 generados y revisados** en `Docs/cliente/pruebas-nota/` (3, 15 y 40 ítems) · QR escaneado (decodificado) desde el PDF.

## Criterio de aceptación del pedido (punto 1) — resultado
| Criterio | Resultado |
|---|---|
| Layout A5 (148 × 210 mm) | PDF de 148,2 × 209,9 mm, 1 hoja con 3 ítems |
| No se corta contenido | 15 ítems → 2 hojas (8 + 7 filas); 40 ítems → 4 hojas (8 + 11 + 11 + 10 filas): ninguna fila perdida, total en la última hoja |
| Logo en el encabezado | En cada hoja (hoy el nombre del negocio como texto; el logo se sube en Ajustes) |
| QR aparte del logo, al catálogo | En el encabezado de cada hoja; decodifica a la URL cargada en Ajustes |
| Teléfonos de vendedores y encargada de tienda en el pie | En el pie de cada hoja, tomados de Ajustes → Teléfonos del equipo |

Se corrigió en el camino: la línea "N docenas · N prendas" quedaba sola en una hoja extra; ahora va dentro del bloque TOTAL.

## Qué se hizo
- **Ajustes** (`/ajustes`, solo lectura para quien no sea admin): nombre y logo, tipo de cambio (Bs y ARS por 1 US$), URL del catálogo (QR), WhatsApp de la tienda, mostrar precios en el público, teléfonos del equipo, umbral de stock bajo.
- **Nueva venta** (`/venta`): moneda con USD primero y Bs último → buscar por código → elegir color y docenas (muestra el stock) → cliente opcional → efectivo/transferencia → total fijo abajo → Confirmar. Borrador guardado en el dispositivo (se recupera si se cierra la app). Aviso y confirmación si pide más de lo que hay en stock. Quien tenga permiso `precio.editar` (admin) puede cambiar el precio de una línea. Al cambiar de moneda se vuelve a los precios de lista.
- **Guardar**: una sola transacción (nota + ítems + descuento de stock + cola de sincronización). Cada ítem guarda copia de código, nombre y color: la nota no cambia aunque el producto se edite después.
- **Nota** (`/ventas/:id`): vista previa, Imprimir/Guardar PDF (`window.print()` con hoja A5), Compartir por WhatsApp (imagen PNG de la nota generada en el dispositivo; en celular abre el menú de compartir con archivo, en escritorio descarga la imagen y abre el chat con el resumen en texto). Si falta la URL del catálogo avisa que sale sin QR.

## A tener en cuenta
- **Unidad de venta**: hoy solo docenas (el esquema ya soporta "unidad"). Depende de B1 ("solo se vende por docena o …"): cuando Natali complete la frase, se habilita.
- **Tipo de cambio de ejemplo** (6,96 Bs / 1400 ARS): hasta que Natali defina cómo lo maneja (B5), Ajustes lo marca como ejemplo.
- La imagen para WhatsApp de una nota larga (más de una hoja) sale como una sola imagen alta.
- Impresión probada con el motor de Chrome (PDF). Falta probar una **impresora real** y el menú de compartir en un Android/iPhone reales (etapa 7).
- Los PDF de prueba usan datos de ejemplo (URL `https://modasnaty.example/c`, teléfonos inventados).
- Bloqueos abiertos: B1 comisión · B2 logo · B3 teléfonos reales · B4 URL real del catálogo · B5 tipo de cambio · B6 permisos · B7 carga masiva.
