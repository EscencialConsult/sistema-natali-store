// Perfiles de PRUEBA (mock). Sin correos ni contraseñas reales: eso llega con Supabase Auth (etapa 8).
// Quién es admin y los permisos de cada encargada están a confirmar con Natali.
export const PERFILES_SEED = [
  { id: 'p-admin', nombre: 'Natali', rol: 'admin', telefono: null },
  { id: 'p-ariel', nombre: 'Ariel Maydana', rol: 'vendedor', telefono: null },
  { id: 'p-brayan', nombre: 'Brayan Aquino', rol: 'vendedor', telefono: null },
  { id: 'p-norma', nombre: 'Norma Toloza', rol: 'vendedor', telefono: null },
  { id: 'p-maria', nombre: 'María Córdoba', rol: 'enc_deposito', telefono: null },
  { id: 'p-pamela', nombre: 'Pamela Aramayo', rol: 'enc_tienda', telefono: null },
  { id: 'p-jehovana', nombre: 'Jehovana Calla', rol: 'enc_ventas', telefono: null },
]

export const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
