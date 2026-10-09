import { LayoutDashboard, Package, ReceiptText, ScrollText, Search, Settings, UserCog, Wallet } from 'lucide-react'

import { puede } from '../lib/permisos.js'

// Una sola definición de pantallas: la usan la barra lateral, la barra inferior y las rutas.
// accion: permiso(s) necesario(s); alcanza con tener uno.
export const PANTALLAS = [
  { ruta: '/inicio', etiqueta: 'Inicio', icono: LayoutDashboard, accion: ['dashboard.ver_global', 'ventas.ver_propias'] },
  { ruta: '/catalogo', etiqueta: 'Buscar', icono: Search, accion: 'catalogo.ver' },
  { ruta: '/venta', etiqueta: 'Venta', icono: ReceiptText, accion: 'venta.crear' },
  { ruta: '/ventas', etiqueta: 'Ventas', icono: ScrollText, accion: ['ventas.ver_propias', 'ventas.ver_todas'] },
  { ruta: '/stock', etiqueta: 'Inventario', icono: Package, accion: 'stock.ver' },
  { ruta: '/comisiones', etiqueta: 'Comisiones', icono: Wallet, accion: ['comisiones.ver_propia', 'comisiones.ver_todas'] },
  { ruta: '/usuarios', etiqueta: 'Usuarios', icono: UserCog, accion: 'usuarios.gestionar' },
  { ruta: '/ajustes', etiqueta: 'Ajustes', icono: Settings, accion: 'ajustes.ver' },
]

// Primera pantalla al entrar, según el rol.
// Quien ve todo arranca en el resumen del día; las vendedoras, en el buscador (su herramienta principal).
export const rutaInicio = (rol) => (rol === 'enc_deposito' ? '/stock' : puede(rol, 'dashboard.ver_global') ? '/inicio' : '/catalogo')
