# Etapa 8 — Backend: Supabase (18 h)
Requiere: frontend aprobado (Etapa 7) y accesos del proyecto Supabase genérico de Facundo.
Leer: `_comun.md`, `../06-arquitectura.md` (modelo, migración). Skill de apoyo: `supabase-automatizacion-skill`.
Regla: **todo cambio de base es una migración SQL versionada** (así se replica en la cuenta del cliente).

### Tarea 8.1 · Proyecto y entorno · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Recibir de Facundo URL + anon key + (para migraciones) acceso al CLI/DB. **Nunca** guardar service_role en el frontend ni en el repo.
- [ ] 2. `.env.local` (ignorado por git) con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; `.env.example` sin valores.
- [ ] 3. `supabase init` en `app/supabase/`; vincular al proyecto.
- [ ] 4. Cliente `src/data/supabase.js`.
- [ ] 5. Usar un **schema o prefijo propio** (`modas_naty`) porque el proyecto genérico es compartido con otros; documentarlo. Verificación: no toca tablas de otros proyectos.

### Tarea 8.2 · Migraciones: esquema, índices, RLS · 5 h
Estado: [ ]
**Pasos**
- [ ] 1. `0001_esquema.sql`: tablas del modelo (perfiles, categorias, productos, producto_colores, producto_fotos, ventas, venta_items, movimientos_stock, config), uuid, timestamps, enums de rol/moneda/pago, checks (cantidad > 0, centavos enteros).
- [ ] 2. `0002_indices.sql`: código único, fechas, vendedor, sync.
- [ ] 3. `0003_rls.sql`: RLS en todas las tablas según matriz de permisos (vendedor solo ve sus ventas; catálogo legible por anónimo solo la vista pública).
- [ ] 4. Vista/función pública `catalogo_publico` sin datos internos para la ruta `/c`.
- [ ] 5. Triggers: stock calculado desde movimientos; `numero` de nota por vendedor.
- [ ] 6. Seed SQL de categorías y config; script para cargar la biblioteca provisional.
- [ ] 7. Pruebas de RLS con un usuario de cada rol (consultas que deben fallar y que deben pasar). Verificación: tabla de resultados guardada.

### Tarea 8.3 · Auth y perfiles reales · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Supabase Auth con email + contraseña. Crear los usuarios del cuadro con **contraseñas nuevas** y cambio obligatorio en el primer ingreso (no reutilizar las del cuadro).
- [ ] 2. Trigger que crea el perfil con su rol al alta.
- [ ] 3. Cambiar `AuthProvider` de mock a Supabase sin tocar pantallas.
- [ ] 4. Sesión persistente offline (el vendedor sin red sigue logueado); renovar token al volver la red.
- [ ] 5. Verificar el email de Jehovana (posible error de tipeo) antes de crear su usuario.

### Tarea 8.4 · Storage de fotos · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Bucket `productos` (lectura pública, escritura solo admin/depósito) creado por migración.
- [ ] 2. Subida de las fotos ya comprimidas desde el admin (3.4) con ruta `productos/<codigo>/<n>.webp`.
- [ ] 3. Subir la biblioteca provisional como datos de prueba.
- [ ] 4. Miniaturas con transformación de imágenes de Supabase o generadas al subir.
- [ ] 5. Documentar cuota/costo del plan al cotizar.

### Tarea 8.5 · Repositorios remotos + sincronización · 5 h
Estado: [ ]
**Pasos**
- [ ] 1. Implementar cada repositorio contra Supabase respetando la **misma interfaz** que los locales.
- [ ] 2. Descarga inicial y actualizaciones incrementales (por `updated_at`) hacia IndexedDB; lecturas siguen saliendo de lo local.
- [ ] 3. `cola_sync` real: enviar ventas pendientes en orden, idempotente (id UUID → reintentar no duplica), marcar `synced`.
- [ ] 4. Conflictos: stock se sincroniza por movimientos (no se pisa el valor); si dos dispositivos venden lo mismo, ambos descuentan.
- [ ] 5. Errores: venta rechazada por la base → queda visible como "Con problema" con el mensaje, nunca se descarta en silencio.
- [ ] 6. Fotos: URLs de Storage con caché del service worker.

### Tarea 8.6 · Pruebas offline → online · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Vender 5 notas offline en un celular, volver online: aparecen en el admin desde otra PC.
- [ ] 2. Cortar la red a mitad de sincronización: no se duplican ni se pierden.
- [ ] 3. Dos vendedores vendiendo el mismo producto a la vez.
- [ ] 4. Revisar RLS desde el cliente real (un vendedor no ve ventas ajenas).
- [ ] 5. Medir tiempos con red lenta simulada.

**Cierre**: todas las pruebas pasan; migraciones reproducibles desde cero en un proyecto vacío (`supabase db reset`). Pedir autorización Etapa 9.
