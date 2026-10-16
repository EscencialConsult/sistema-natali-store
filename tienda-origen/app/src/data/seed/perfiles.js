// Perfiles de PRUEBA (mock) del panel. Sin correos ni contraseñas reales: eso llega con Supabase Auth (etapa 4).
// Los roles son los que ya existen en la base compartida con el sistema de nota (decisión D4); ver lib/permisos.js.
export const PERFILES_SEED = [
  { id: 'p-admin', nombre: 'Natali', rol: 'admin', telefono: null },
  { id: 'p-pamela', nombre: 'Pamela Aramayo', rol: 'enc_tienda', telefono: null },
  { id: 'p-maria', nombre: 'María Córdoba', rol: 'enc_deposito', telefono: null },
]

export const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
