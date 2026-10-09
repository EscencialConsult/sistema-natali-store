# Etapa 2 — Acceso, roles y estructura (8 h)
Leer: `_comun.md`, `../05-equipo-y-roles.md`.

### Tarea 2.1 · Login local (mock) · 2 h
Estado: [ ]
**Pasos**
- [ ] 1. Seed de perfiles: los 6 del cuadro + admin (Natali, a confirmar). **Sin contraseñas reales**: login por selección de usuario + PIN de prueba solo en dev. Verificación: 7 perfiles.
- [ ] 2. Pantalla de login como ruta raíz (kit-de-marca): elegir usuario → entrar. Estados error/carga.
- [ ] 3. `AuthProvider` + ruta protegida; sesión guardada local. Verificación: recargar mantiene sesión; salir la borra.
- [ ] 4. Misma interfaz que usará Supabase Auth (`iniciarSesion/cerrarSesion/usuarioActual`).
**Criterios de aceptación**
- [ ] Sin sesión no se ve ninguna pantalla interna.

### Tarea 2.2 · Matriz de permisos · 2 h
Estado: [ ]
**Bloqueos**: B6. Empezar con propuesta marcada "a confirmar".
**Pasos**
- [ ] 1. Propuesta: vendedor (catálogo, nueva venta, mis ventas, mi comisión) · enc. tienda (lo del vendedor + ventas de todos) · enc. ventas (ventas de todos, comisiones, exportar) · enc. depósito (catálogo, inventario) · admin (todo, ajustes, usuarios).
- [ ] 2. Implementar en `lib/permisos.js` como tabla rol → acciones. Verificación: test por rol.
- [ ] 3. Ocultar navegación no permitida y bloquear la ruta (no solo esconder el botón).
- [ ] 4. Documentar la matriz en `../05-equipo-y-roles.md` y pedir confirmación a Natali.

### Tarea 2.3 · Layout y navegación · 3 h
Estado: [ ]
**Pasos**
- [ ] 1. Celular: barra inferior de 4–5 accesos (Buscar, Venta, Ventas, Más). Escritorio: barra lateral. "Buscar" (catálogo) primero para el vendedor.
- [ ] 2. Cabecera con logo (placeholder hasta B2), nombre del usuario y salir.
- [ ] 3. Estados globales: carga de ruta, 404, error.
- [ ] 4. Revisar a 390px, 768px y 1440px. Verificación: sin scroll horizontal.

### Tarea 2.4 · Indicador de conexión · 1 h
Estado: [ ]
**Pasos**
- [ ] 1. Hook `useConexion` (online/offline + prueba de red lenta con un fetch pequeño con timeout).
- [ ] 2. Píldora "Conectado / Conexión lenta / Sin conexión" en la cabecera + contador de ventas pendientes de sincronizar.
- [ ] 3. Toast al volver la conexión ("N ventas sincronizadas").

**Cierre**: probar los 7 usuarios y sus menús; build+lint. Pedir autorización Etapa 3.
