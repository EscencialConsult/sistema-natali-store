# Módulo Catálogo (a cotizar)

## Necesidad
La clienta tiene una tienda con muchos modelos. Hoy el vendedor busca fotos en el celular. Quiere una web donde cargar fotos de todos los productos: el vendedor escribe el **código** y ve de inmediato **fotos y colores disponibles**.

## Funcionalidades pedidas
1. **Buscador por código** → muestra fotos y colores.
2. **Ficha de producto**: código, 1+ fotos, colores disponibles, descripción (opcional).
3. **Carga de productos**: panel para crear/editar/eliminar (código, fotos, colores).
4. **Carga masiva** (mensaje cortado, confirmar).
- Debe funcionar **junto o independiente** del ERP.
- El QR de la nota de venta apunta a este catálogo.

> **Aclaración 2026-10-08:** la página de Divas House es referencia de **DISEÑO** ("quieren una página web que sea catálogo"), no para sacar datos de texto. Análisis visual en [referencias/diseno/README.md](referencias/diseno/README.md).

## Referencia enviada por la clienta
https://divashousebolivia.com/catalogo-mayorista — "algo así sería para cotizar".
Rastrillaje completo en [referencias/divashousebolivia/](referencias/divashousebolivia/_index.md).

### Qué es el sitio de referencia
- **Divas House Bolivia** — moda femenina mayorista, Santa Cruz de la Sierra. Ventas *exclusivamente mayoristas*, envíos a Bolivia y países vecinos.
- Sitio hecho en Hostinger Website Builder, "desarrollado por DataNova IT".
- ~**140 páginas de producto** (blusas, corsets, faldas, shorts, chalecos, blazers, pantalones, vestidos de gala, cinturones, poleras, bodies, conjuntos).
- Cada ficha: nombre, subtítulo, **precio en Bs** (rango visto: Bs 720 – Bs 1440, p. ej. corset clásico Bs 780), descripción, "talla única", colores descritos en texto.
- Catálogo con **grilla paginada** (`?store-page-...=N`), página de contacto/WhatsApp, redes sociales, blog sin uso (plantillas vacías).
- Ojo: la grilla es dinámica (JS), por eso el rastrillaje capturó las fichas pero no el listado; las fichas cubren todo el contenido.

### Qué tomar y qué no
- Tomar: grilla visual de productos, ficha simple, paginación, contacto por WhatsApp.
- Diferenciar: el de Natali es **herramienta interna de venta rápida** (buscar por código en segundos, offline), no tienda pública con precios. Prioridad = buscador + fotos livianas + colores.

## Ideas técnicas para cotizar (borrador)
- PWA con caché de imágenes (mala conexión) + fotos comprimidas/miniaturas.
- Almacenamiento de fotos: Supabase Storage o similar (definir con costos).
- Panel admin con login; vista vendedor solo lectura.
