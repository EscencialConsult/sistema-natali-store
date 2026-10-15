# Etapa 9 — Pruebas con la clienta, deploy, dominio, post-lanzamiento y migración (12 h)
Leer: `_comun.md`, `../SISTEMA DE NOTA/Docs/plan/guion-prueba.md` (formato del guion por rol), `../SISTEMA DE NOTA/app/supabase/README.md` (migración), skill `checklist-post-lanzamiento`, `docs/pagos/PAGOKIT_PRODUCTION_CHECKLIST.md`.
Principio: **la tienda sale cuando Natali compró, cobró, imprimió y cerró un día con sus propios datos.**

### Tarea 9.1 · Guion de prueba y sesión con Natali · 3 h
Estado: [ ]
**Archivos**: `docs/plan/guion-prueba.md` (por rol: compradora en celular, persona en el kiosco, encargada, depósito, Natali), datos reales cargados (productos publicados con precio, textos, logo, datos del local).
**Alcance**: sesión guiada (presencial o por videollamada con el kiosco del lado de Natali); registrar cada observación en `hallazgos-etapa-9.md` con prioridad; pago real de monto mínimo por cada medio activo; impresión real.
**Bloqueos**: todos los B-* cerrados; agenda.

### Tarea 9.2 · Correcciones · 3 h
Estado: [ ]
**Alcance**: corregir hallazgos de prioridad alta y media; los bajos quedan listados como v1.1.
**Bloqueos**: resultado de 9.1.

### Tarea 9.3 · GitHub, Netlify y dominio · 2 h
Estado: [ ]
**Archivos**: `.gitignore` (verificado: sin `.env`, sin comprobantes, sin `.pagokit/`), `netlify.toml` (base `app`, functions, redirects SPA, cabeceras de seguridad: CSP razonable, `X-Frame-Options` salvo en `/kiosco` si se embebe), `docs/deploy.md`.
**Alcance**: repo en GitHub (pregunta pendiente a Facundo; nombre propuesto `EscencialConsult/tienda-natali-online`), registrar en `cerebro-facundo/proyectos-codigo/manifest.tsv` y en la nota del proyecto; sitio de Netlify nuevo (distinto del sistema de nota) con variables por contexto (producción y deploy-preview, incluidas las de la pasarela y `service_role`); dominio de Natali (B-D1) con DNS (si es de Hostinger, skill `mcp-hostinguer`); HTTPS; URL del webhook de producción registrada en la pasarela.
**Criterios de aceptación**
- [ ] Deploy desde `main` reproducible; un push a una rama genera deploy-preview con sandbox de pagos.
**Bloqueos**: decisión de GitHub; B-D1.

### Tarea 9.4 · Checklist post-lanzamiento · 1 h
Estado: [ ]
**Alcance**: skill `checklist-post-lanzamiento`: Search Console (propiedad y sitemap), Analytics, Microsoft Clarity, Meta Pixel si Natali hace pauta; separar lo que resuelve código (scripts, con consentimiento) de los trámites manuales de cuenta que hace Facundo; probar el flujo de compra en producción con un pedido real y cancelarlo.
**Bloqueos**: cuentas de Google/Meta de Natali.

### Tarea 9.5 · Migración a la cuenta de la clienta y limpieza · 3 h
Estado: [ ]
**Archivos**: `docs/migracion.md` (pasos para los dos sistemas juntos, ya que comparten catálogo), scripts de export/import de `naty_*` y `tienda_*`, copia de Storage (`naty_productos`, `tienda_comprobantes`).
**Alcance**: proyecto Supabase de Natali; aplicar `naty_schema.sql` y `tienda_schema.sql`; copiar datos y archivos; recrear usuarios internos; cambiar variables en Netlify de los dos sitios; comparar conteos; borrar `naty_*` y `tienda_*` de la instancia compartida y marcar ambos proyectos como `archivado` en `proyectos`; manual de usuario con la skill `generador-manuales` si Facundo lo pide (preguntar).
**Criterios de aceptación**
- [ ] Un pedido completo (compra, pago, ticket, cambio de estado) funciona contra la cuenta de Natali antes de borrar la provisoria.
**Bloqueos**: cuenta de Supabase de Natali; coordinación con el cierre del sistema de nota.

**Cierre de etapa y del proyecto**: `notas-etapa-9.md`; actualizar `docs/README.md` (estado "publicado", URLs), la nota del cerebro y `log.md`; lista v1.1 en `docs/backlog-v1.1.md`.
