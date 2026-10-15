// Matriz de permisos del panel (PROPUESTA, a confirmar con Natali: bloqueo B6). Ver docs/02-roles-y-casos-de-uso.md.
// Los roles son los que ya existen en la base compartida con el sistema de nota (decisión D4):
// `enc_tienda` y `enc_ventas` actúan como "encargada"; `vendedor` no tiene acceso al panel de la tienda.

export const ROLES = {
  admin: 'Administradora',
  enc_tienda: 'Encargada de tienda',
  enc_ventas: 'Encargada de ventas',
  enc_deposito: 'Encargada de depósito',
  vendedor: 'Vendedor/a',
}

const ENCARGADA = [
  'panel.ver',
  'catalogo.ver',
  'pedidos.ver',
  'pedidos.estado',
  'pedidos.pago_caja',
  'gastos.cargar',
  'kiosco.activar',
]

const DEPOSITO = ['panel.ver', 'catalogo.ver', 'catalogo.editar', 'stock.ver', 'stock.mover']

export const PERMISOS = {
  vendedor: [],
  enc_tienda: ENCARGADA,
  enc_ventas: ENCARGADA,
  enc_deposito: DEPOSITO,
  admin: [
    ...new Set([...ENCARGADA, ...DEPOSITO]),
    'precio.editar',
    'pedidos.cancelar',
    'pedidos.reembolsar',
    'gastos.editar',
    'reportes.ver',
    'ajustes.ver',
    'ajustes.editar',
    'usuarios.gestionar',
  ],
}

export const puede = (rol, accion) => !!rol && (PERMISOS[rol]?.includes(accion) ?? false)

// accion puede ser una sola o una lista (alcanza con una).
export const puedeAlguna = (rol, acciones) => [acciones].flat().some((a) => puede(rol, a))
