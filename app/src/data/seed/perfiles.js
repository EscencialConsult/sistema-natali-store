// Perfiles de PRUEBA (modo sin servidor). Con Supabase los usuarios y contraseñas los maneja Supabase Auth.
// Los CI son de DEMOSTRACIÓN (no son los reales): los reales los carga la superadmin desde Usuarios.
export const PERFILES_SEED = [
  { id: 'p-super', nombre: 'Superadministrador', ci: '1000000', rol: 'superadmin', telefono: null },
  { id: 'p-admin', nombre: 'Natali', ci: '1000001', rol: 'admin', telefono: null },
  { id: 'p-ariel', nombre: 'Ariel Maydana', ci: '1000002', rol: 'vendedor', telefono: null },
  { id: 'p-brayan', nombre: 'Brayan Aquino', ci: '1000003', rol: 'vendedor', telefono: null },
  { id: 'p-norma', nombre: 'Norma Toloza', ci: '1000004', rol: 'vendedor', telefono: null },
  { id: 'p-maria', nombre: 'María Córdoba', ci: '1000005', rol: 'enc_deposito', telefono: null },
  { id: 'p-pamela', nombre: 'Pamela Aramayo', ci: '1000006', rol: 'enc_tienda', telefono: null },
  { id: 'p-jehovana', nombre: 'Jehovana Calla', ci: '1000007', rol: 'enc_ventas', telefono: null },
]

// Contraseña inicial de los usuarios de prueba. Se cambia desde Usuarios (superadmin).
export const CLAVE_INICIAL = import.meta.env.VITE_CLAVE_INICIAL || 'naty2026'

export const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
