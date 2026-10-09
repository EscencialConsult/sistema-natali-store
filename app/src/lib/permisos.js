// Matriz de permisos (PROPUESTA, a confirmar con Natali: bloqueo B6). Ver Docs/05-equipo-y-roles.md.

export const ROLES = {
  superadmin: 'Superadministrador/a',
  admin: 'Administradora',
  vendedor: 'Vendedor/a',
  enc_tienda: 'Encargada de tienda',
  enc_ventas: 'Encargada de ventas',
  enc_deposito: 'Encargada de depósito',
}

const VENDEDOR = ['catalogo.ver', 'venta.crear', 'ventas.ver_propias', 'comisiones.ver_propia']
const ADMIN = [
  ...VENDEDOR,
  'catalogo.editar',
  'ventas.ver_todas',
  'ventas.anular',
  'ventas.exportar',
  'precio.editar',
  'stock.ver',
  'stock.mover',
  'comisiones.ver_todas',
  'dashboard.ver_global',
  'ajustes.ver',
  'ajustes.editar',
]

export const PERMISOS = {
  vendedor: VENDEDOR,
  enc_tienda: [...VENDEDOR, 'ventas.ver_todas', 'stock.ver', 'dashboard.ver_global'],
  enc_ventas: [...VENDEDOR, 'ventas.ver_todas', 'ventas.exportar', 'comisiones.ver_todas', 'dashboard.ver_global'],
  enc_deposito: ['catalogo.ver', 'catalogo.editar', 'stock.ver', 'stock.mover'],
  admin: ADMIN,
  // Única que da de alta usuarios, asigna roles, restablece contraseñas y borra datos (limpieza de almacenamiento).
  superadmin: [...ADMIN, 'usuarios.gestionar', 'datos.borrar'],
}

// Qué ve cada rol, en palabras (pantalla de usuarios).
export const DESCRIPCION_ROL = {
  superadmin: 'Todo el sistema, más la gestión de usuarios y roles y la limpieza de datos.',
  admin: 'Todo el negocio: ventas, catálogo, stock, comisiones y ajustes.',
  enc_ventas: 'Vende, ve todas las ventas, exporta y ve comisiones del equipo.',
  enc_tienda: 'Vende, ve todas las ventas y consulta el stock.',
  enc_deposito: 'Edita el catálogo y mueve el stock. No vende.',
  vendedor: 'Busca modelos, vende y ve sus propias ventas y comisión.',
}

export const puede = (rol, accion) => !!rol && (PERMISOS[rol]?.includes(accion) ?? false)

// accion puede ser una sola o una lista (alcanza con una).
export const puedeAlguna = (rol, acciones) => [acciones].flat().some((a) => puede(rol, a))
