import { BookOpen, ClipboardList, LayoutDashboard, Package, Receipt, Search, Settings, Shirt, TrendingUp, Users, Wallet } from 'lucide-react'

import { puede, puedeAlguna } from '../lib/permisos.js'

// Zonas de la app (ver docs/04-arquitectura.md, "Rutas"): el sitio público vive en la raíz, el kiosco en /kiosco
// y el panel de administración en /administracion (su raíz es el login).
export const BASE_PANEL = '/administracion'
export const BASE_KIOSCO = '/kiosco'

// Menú del sitio público.
export const MENU_SITIO = [
  { ruta: '/', etiqueta: 'Inicio' },
  { ruta: '/catalogo', etiqueta: 'Catálogo' },
  { ruta: '/quienes-somos', etiqueta: 'Quiénes somos' },
  { ruta: '/contacto', etiqueta: 'Contacto' },
  { ruta: '/ayuda', etiqueta: 'Ayuda' },
]

// Registro de pantallas del panel: genera las RUTAS (ninguna URL se pierde aunque salga del menú).
// accion: permiso(s) necesario(s); alcanza con tener uno.
// menu: dónde aparece. 'principal' = barra; 'mas' = grupo secundario; null = solo se llega desde otra pantalla
// (Buscar y Stock viven como pestañas de Productos).
export const PANTALLAS = [
  { ruta: `${BASE_PANEL}/inicio`, etiqueta: 'Inicio', icono: LayoutDashboard, accion: ['reportes.ver', 'pedidos.ver'], menu: 'principal' },
  { ruta: `${BASE_PANEL}/pedidos`, etiqueta: 'Pedidos', icono: ClipboardList, accion: 'pedidos.ver', menu: 'principal' },
  { ruta: `${BASE_PANEL}/productos`, etiqueta: 'Productos', icono: Shirt, accion: 'catalogo.ver', menu: 'principal', tambien: [`${BASE_PANEL}/stock`, `${BASE_PANEL}/buscar`, `${BASE_PANEL}/categorias`] },
  { ruta: `${BASE_PANEL}/buscar`, etiqueta: 'Buscar', icono: Search, accion: 'catalogo.ver', menu: null },
  { ruta: `${BASE_PANEL}/stock`, etiqueta: 'Stock', icono: Package, accion: 'stock.ver', menu: 'mas' },
  { ruta: `${BASE_PANEL}/gastos`, etiqueta: 'Gastos', icono: Receipt, accion: ['gastos.cargar', 'gastos.editar'], menu: 'principal' },
  { ruta: `${BASE_PANEL}/reportes`, etiqueta: 'Reportes', icono: TrendingUp, accion: 'reportes.ver', menu: 'mas' },
  { ruta: `${BASE_PANEL}/cobros`, etiqueta: 'Cobros', icono: Wallet, accion: 'reportes.ver', menu: 'mas' },
  { ruta: `${BASE_PANEL}/ayuda`, etiqueta: 'Ayuda', icono: BookOpen, accion: 'panel.ver', menu: null },
  { ruta: `${BASE_PANEL}/guia-mercado-pago`, etiqueta: 'Guía de Mercado Pago', icono: BookOpen, accion: ['reportes.ver', 'ajustes.ver', 'pedidos.ver'], menu: null },
  { ruta: `${BASE_PANEL}/usuarios`, etiqueta: 'Usuarios', icono: Users, accion: 'usuarios.gestionar', menu: 'mas' },
  { ruta: `${BASE_PANEL}/configuracion`, etiqueta: 'Configuración', icono: Settings, accion: 'ajustes.ver', menu: 'mas' },
]

// Primera pantalla al entrar al panel, según el rol: la administración ve las cifras del día,
// la encargada va derecho a los pedidos y depósito a los productos.
export function rutaInicio(rol) {
  if (puede(rol, 'reportes.ver')) return `${BASE_PANEL}/inicio`
  if (puede(rol, 'pedidos.ver')) return `${BASE_PANEL}/pedidos`
  return `${BASE_PANEL}/productos`
}

// Menú según el rol: las entradas principales que puede ver; si quedan menos de 4, se completan con las secundarias
// (así depósito ve Productos y Stock en la barra, sin un "Más" casi vacío).
export const MIN_PRINCIPAL = 4
export function menuDe(rol) {
  const visibles = PANTALLAS.filter((p) => p.menu && puedeAlguna(rol, p.accion))
  const principal = visibles.filter((p) => p.menu === 'principal')
  const mas = visibles.filter((p) => p.menu === 'mas')
  while (principal.length < MIN_PRINCIPAL && mas.length) principal.push(mas.shift())
  return { principal, mas }
}
