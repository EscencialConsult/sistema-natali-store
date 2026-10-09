# Plan de rediseño "de tienda" — Modas Naty

Resultado del duelo Claude vs Codex (sesión `20261008-2105-rediseno-tienda`, 3 rondas). Base: Belleza 40 / Funcionalidad 82 / Agilidad 60.

## Dirección
Tienda amable: fondo crema, tarjetas blancas con sombra suave y radio 16, campos rellenos tonales, **sin bordes decorativos** (borde solo como indicador de estado/foco), compacto: 44 px en acciones repetidas, 40 px en filtros/secundarios, nunca 36.

Paleta (contrastes verificados): crema `#FBF7F3`, blanco, campo `#F3EEE9`, tinte `#F6E8EF`, texto `#2A2230`, suave `#5C5663`, tenue `#625B68`, primario `#8A3A63` (hover `#732F52`), sobre-tinte `#6E2A4D`, línea-de-campo `#857C8A`. Semánticos y WhatsApp sin cambios.

## Decisiones del duelo
- Campo = relleno + indicador inferior 2 px (`#857C8A`, 3,47:1). Foco = anillo ciruela 2 px.
- Recetas como constantes de clases atómicas (`ui/estilos.js`). **Sin** tailwind-merge ni `@utility`.
- Selección (anillo interior + chapa con check opaca) distinta del foco (outline exterior con espacio reservado).
- Contrato de alturas: `--reserva-inferior` medida en runtime; toast + aviso PWA en un contenedor apilado.
- Select: índice acotado, `aria-activedescendant` solo con nodo existente; Modal con `aria-labelledby`.
- Fuera de alcance: `nota.css`, portal de impresión, `compartir.js`, fuentes. Páginas A5 medidas antes/después.

## Etapas
- **E0** Base: DESIGN.md actualizado, páginas reales de la nota por fixture, inventario de bordes funcionales.
- **E1** Tokens + `estilos.js` + `ui/*` (Button, Input, Select, Modal, Tabs, Badge, Toast, Galería, chips).
- **E2** Cáscara: Layout, barra inferior flotante, contenedor de avisos, reserva medida.
- **E3** Tienda: grilla, `ProductoCard`, ficha, galería, buscador, `CatalogoPublico`.
- **E4** Venta: `LineaVenta` compacta, `AgregarSheet`, barra de total.
- **E5** Gestión: Inicio, Ventas, Inventario, Comisiones, Ajustes, Admin, Login.
- **E6** Cierre: capturas "despues", axe (wcag2a/aa, 21, 22aa), 92 tests + lint + build, teclado, 320 px, zoom 200 %, colores forzados, nota A5 (PDF y PNG), re-puntaje (máx. 3 pasadas; una falla AA bloquea el cierre).

Restore point: commit `f103110` (la carpeta `app_backup_antes-rediseno/` se borró el 2026-10-09; el código previo al rediseño está en ese commit).
