# Etapa 9 — Migración a la cuenta del cliente, GitHub y deploy (8 h)
Leer: `_comun.md`, `../06-arquitectura.md` (estrategia de migración). Hito B: Facundo pasa accesos de GitHub.

### Tarea 9.1 · Conectar GitHub · 1 h
Estado: [ ]
**Pasos**
- [ ] 1. Facundo da el repo (URL o nombre). **Preguntar de nuevo antes de pushear** (hoy decidido: sin GitHub hasta tener más avance).
- [ ] 2. `.gitignore` (node_modules, `.env*`, dist) y revisar que no hay claves ni datos reales en el historial.
- [ ] 3. `git init` + `git remote add origin ...`; primer push solo con confirmación explícita.
- [ ] 4. Anotar la URL en `Docs/README.md` y en la nota del proyecto en `cerebro-facundo/proyectos/`; agregar línea en `proyectos-codigo/manifest.tsv`.

### Tarea 9.2 · Migración a Supabase del cliente · 4 h
Estado: [ ]
**Bloqueos**: el cliente debe crear su cuenta y dar acceso (o ejecutar el script).
**Pasos**
- [ ] 1. Checklist para el cliente: crear cuenta Supabase, proyecto, región, plan; dar acceso a Facundo como colaborador.
- [ ] 2. Aplicar migraciones en el proyecto nuevo (`supabase db push`). Verificación: esquema idéntico.
- [ ] 3. Exportar datos del proyecto genérico (solo el schema de Naty) con `pg_dump --data-only` e importar.
- [ ] 4. Copiar los archivos de Storage (script con la API de Storage, bucket por bucket) y reescribir URLs si hace falta.
- [ ] 5. Recrear usuarios en Auth (los hashes no se migran entre proyectos: reenviar invitación/restablecer contraseña).
- [ ] 6. Cambiar `.env` del frontend al proyecto nuevo y probar el guion de la etapa 7.
- [ ] 7. Comparar conteos (ventas, productos, fotos, usuarios) entre origen y destino.

### Tarea 9.3 · Deploy · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Hosting (Netlify actual o Vercel); variables de entorno en el panel, no en el repo.
- [ ] 2. Dominio/URL definitiva del catálogo → **actualizar el QR de la nota (B4)** y regenerar el PDF de prueba.
- [ ] 3. HTTPS, redirecciones SPA, caché de la PWA.
- [ ] 4. Probar instalación en los celulares reales del equipo.
- [ ] 5. Skill `checklist-post-lanzamiento` (analytics, formulario) si aplica a la vista pública.

### Tarea 9.4 · Limpieza y entrega · 1 h
Estado: [ ]
**Pasos**
- [ ] 1. Borrar los datos del cliente del proyecto genérico de Facundo (schema `modas_naty`) y revocar claves usadas.
- [ ] 2. Manual de usuario por rol (skill `generador-manuales`) y manual de desarrollador.
- [ ] 3. Entregar accesos al cliente; rotar contraseñas iniciales.
- [ ] 4. Actualizar la nota del proyecto en el cerebro y cerrar el tablero.
