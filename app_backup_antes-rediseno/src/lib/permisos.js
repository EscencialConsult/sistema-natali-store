// Matriz de permisos (PROPUESTA, a confirmar con Natali: bloqueo B6). Ver Docs/05-equipo-y-roles.md.

export const ROLES = {
  admin: 'Administradora',
  vendedor: 'Vendedor/a',
  enc_tienda: 'Encargada de tienda',
  enc_ventas: 'Encargada de ventas',
  enc_deposito: 'Encargada de depósito',
}

const VENDEDOR = ['catalogo.ver', 'venta.crear', 'ventas.ver_propias', 'comisiones.ver_propia']

export const PERMISOS = {
  vendedor: VENDEDOR,
  enc_tienda: [...VENDEDOR, 'ventas.ver_todas', 'stock.ver', 'dashboard.ver_global'],
  enc_ventas: [...VENDEDOR, 'ventas.ver_todas', 'ventas.exportar', 'comisiones.ver_todas', 'dashboard.ver_global'],
  enc_deposito: ['catalogo.ver', 'catalogo.editar', 'stock.ver', 'stock.mover'],
  admin: [
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
    'usuarios.gestionar',
  ],
}

export const puede = (rol, accion) => !!rol && (PERMISOS[rol]?.includes(accion) ?? false)

// accion puede ser una sola o una lista (alcanza con una).
export const puedeAlguna = (rol, acciones) => [acciones].flat().some((a) => puede(rol, a))
