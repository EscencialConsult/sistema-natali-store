# Mensaje para Renzo (listo para pegar)

Written for: Renzo, programador del sistema de notas. Texto corto para WhatsApp; el detalle técnico va en los archivos que se mencionan.

---

Hola Renzo, te cuento qué hice sobre tu sistema para sumarle el catálogo online de Natali, y necesito tres cosas tuyas.

**Qué hice**
- Rama `feature/tienda-online`, que sale de tu `main`. No modifiqué ninguna tabla, función, política ni dato tuyo: solo agrego objetos nuevos con prefijo `tienda_` (dos tablas y dos vistas públicas).
- Tu sistema pasa a vivir en `/admin` (con `basename`) y la raíz del sitio es la tienda. Los QR viejos que apuntan a `/c` redirigen a la tienda.
- Toqué solo cuatro archivos tuyos y están anotados en `Docs/tienda/CAMBIOS-EN-ARCHIVOS-DE-RENZO.md`: `App.jsx`, `AjustesPage.jsx` (un bloque que muestra el Gestor web solo al superadmin, y un texto), `vite.config.js` (manifiesto de la app) y `_redirects`. También reemplacé los íconos de la app por el logo real.
- Probé el esquema contra tu base en modo solo lectura: se aplicó dentro de una transacción y se revirtió, y tus objetos quedaron idénticos. Tus 118 tests pasan.

**Lo que necesito de vos**
1. **¿En qué sitio de Netlify está hoy publicado el sistema?** Tiene que ser el mismo donde va `modas-naty.netlify.app`.
2. **Revisá `Docs/tienda/CONTRATO.md`.** Lista las columnas y claves tuyas que la tienda lee (productos, fotos, categorías y algunas claves de configuración). Pedido: avisame antes de renombrar o quitar alguna.
3. **Backups:** ¿ese proyecto de Supabase tiene Backups activos? Hoy el único respaldo es uno de las tablas que saqué yo.

**Un aviso**
La app instalada en los celulares del equipo pasa a abrirse desde `/admin/`. Dejé una redirección para los íconos viejos, pero conviene avisarles y publicar fuera de horario de ventas.

Cuando lo revises, el procedimiento de publicación está en `Docs/tienda/PUBLICACION.md`.
