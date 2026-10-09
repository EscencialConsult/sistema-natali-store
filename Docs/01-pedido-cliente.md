# Pedido de la clienta (recibido 2026-10-08)

Fuente: mensajes de WhatsApp reenviados con observaciones de Natali. **El texto original estaba cortado** (ver "Faltantes").

## Contexto de uso
- La app web se usa desde **computadora y celular**.
- **Conexión a internet baja o casi nula** → exige modo offline / sincronización posterior.
- La mayoría de las ventas son en **USD**: el botón USD va **primero**; **Bs queda al final**.

## Cambios solicitados al ERP

### 1. Formato de impresión de la nota de venta
- Layout **A5 (148 × 210 mm)**, tamaño hoja de cuaderno.
- Encabezado: **logo de la clienta**.
- Pie: **teléfonos de los vendedores y del encargado de tienda**.
- **Código QR** que lleve al catálogo de la tienda (aclaración 2026-10-08: va en la nota **aparte del logo**, es decir, logo y QR conviven).
- Criterio de aceptación: al imprimir o bajar PDF en A5 no se corta contenido; logo, teléfonos y QR se ven completos.

### 2. Cálculo de comisión de vendedores
- Texto cortado: "Solo se vende por docena o …" → **FALTA el resto** (pedírselo a Natali).

## Módulo nuevo: Catálogo (cotizar)
Funciona junto o independiente del ERP. Ver [03-modulo-catalogo.md](03-modulo-catalogo.md).

## Faltantes del mensaje original
- Resto del punto 2 (comisión).
- Resto de la funcionalidad 4 del catálogo ("Carga ma…", probablemente carga masiva).
- Posibles puntos 3+ del ERP.
- Pregunta pendiente que hizo quien reenvía: **dónde se guarda la información y por cuánto tiempo** (para aclararle a la clienta).

## Actualización 2026-10-09 (pedido completo reenviado)
- **Punto 2 completo — comisión**: solo se vende por docena o media docena. Docena = USD 1,00; media docena = USD 0,50. Siempre en dólares, automática por vendedor. Aceptación: 3 docenas + 2 medias = USD 4,00. Decisiones: las anuladas no suman; período elegible (hoy / 7 días / mes / todo). Implementado en `app/src/lib/comisiones.js` (+ tests).
- **Punto 3 — colaboradores y acceso por rol**: +2 vendedores (los da de alta la superadmin desde *Usuarios*), nombre y permisos dentro del ERP, sin depender de Gmail, **ingreso con CI + contraseña**.
- **Monedas**: se mantiene el tipo de cambio solo para convertir el precio de lista (USD) a Bs/ARS; **nunca se suman monedas distintas**. Todo listado con dinero tiene filtro por moneda.
- **Nota**: sigue en A5 (descartado el formato ticketera 80 mm). Se agregan correo, dirección y método de entrega (Personal / Tienda / Domicilio / Envío) del modelo que pasó la clienta. El logo lo sube la clienta en Ajustes.
- **Un solo local**: los vendedores venden en la calle desde el celular y el pasador retira en la tienda; la encargada de tienda ve las notas de todos los vendedores.
- A la clienta le gustó mucho el módulo de Stock.
