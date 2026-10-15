import { Suspense, useEffect, useState } from 'react'
import { BookOpen, Ellipsis, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../../components/Logo.jsx'
import { Sheet, Skeleton, useToast } from '../../components/ui/index.js'
import { useAuth } from '../../features/auth/AuthContext.js'
import { cn } from '../../lib/cn.js'
import { ROLES } from '../../lib/permisos.js'
import ConexionPildora from '../ConexionPildora.jsx'
import ErrorBoundary from '../ErrorBoundary.jsx'
import { menuDe, PANTALLAS } from '../navegacion.js'
import { useSoloNoIndex } from '../../lib/seo.js'

function Item({ pantalla, lateral, compacto = false, onClick }) {
  const Icono = pantalla.icono
  const { pathname } = useLocation()
  // Productos queda marcado también en sus pestañas (Stock, Buscar) salvo que Stock tenga su propia entrada visible.
  const tambien = (pantalla.tambien ?? []).some((r) => pathname === r || pathname.startsWith(`${r}/`))
  return (
    <NavLink
      to={pantalla.ruta}
      onClick={onClick}
      title={compacto ? pantalla.etiqueta : undefined}
      aria-label={compacto ? pantalla.etiqueta : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center transition-colors',
          lateral
            ? compacto
              ? 'min-h-11 justify-center rounded-control'
              : 'min-h-11 gap-3 rounded-control px-3 text-base'
            : 'min-h-14 flex-col justify-center gap-0.5 text-xs',
          isActive || tambien ? 'bg-superficie-2 font-medium text-texto' : 'text-texto-suave hover:text-texto',
        )
      }
    >
      <Icono size={lateral ? 20 : 22} strokeWidth={1.75} aria-hidden />
      {!compacto && pantalla.etiqueta}
    </NavLink>
  )
}

const CLAVE_MENU = 'panel.menu_compacto'

// Cáscara del panel de administración (heredada del sistema de nota): barra lateral en escritorio, barra inferior en celular.
// En escritorio el menú se contrae a una columna de íconos (y se recuerda): el contenido gana ancho sin perder la navegación.
export default function LayoutPanel() {
  useSoloNoIndex()
  const { usuario, cerrarSesion: cerrar } = useAuth()
  const avisar = useToast()
  const cerrarSesion = async () => {
    const r = await cerrar()
    if (r?.ok === false) avisar(r.motivo, 'error')
  }
  const [masAbierto, setMasAbierto] = useState(false)
  const [compacto, setCompacto] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_MENU) === '1'
    } catch {
      return false
    }
  })
  const alternarMenu = () =>
    setCompacto((c) => {
      try {
        localStorage.setItem(CLAVE_MENU, c ? '0' : '1')
      } catch {
        /* sin almacenamiento: queda solo para esta sesión */
      }
      return !c
    })
  const { pathname } = useLocation()
  const actual = PANTALLAS.find((p) => pathname === p.ruta || pathname.startsWith(`${p.ruta}/`))
  useEffect(() => {
    document.title = actual ? `${actual.etiqueta} · Administración · Modas Naty` : 'Administración · Modas Naty'
  }, [actual])
  const { principal: enBarra, mas: enMas } = menuDe(usuario.rol)

  return (
    <div className={cn('min-h-dvh transition-[padding] duration-200', compacto ? 'md:pl-16' : 'md:pl-60')}>
      <aside className={cn('fixed inset-y-0 left-0 hidden flex-col gap-1 border-r border-borde bg-superficie p-3 transition-[width] duration-200 md:flex', compacto ? 'w-16' : 'w-60')}>
        <div className={cn('py-4', compacto ? 'flex justify-center' : 'px-3')}>
          <Logo variante={compacto ? 'iso' : 'horizontal'} className={compacto ? 'h-6' : undefined} />
        </div>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {enBarra.map((p) => <Item key={p.ruta} pantalla={p} lateral compacto={compacto} />)}
          {enMas.length > 0 && (
            <>
              {compacto ? <hr className="my-3 border-borde" /> : <p className="mt-5 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-texto-tenue">Administración</p>}
              {enMas.map((p) => <Item key={p.ruta} pantalla={p} lateral compacto={compacto} />)}
            </>
          )}
        </nav>
        <div className={cn('border-t border-borde pt-3 text-sm', compacto ? 'flex flex-col items-center' : 'px-3')}>
          {!compacto && (
            <>
              <p className="font-medium">{usuario.nombre}</p>
              <p className="text-texto-suave">{ROLES[usuario.rol]}</p>
            </>
          )}
          <button
            type="button"
            onClick={cerrarSesion}
            title="Salir"
            aria-label={compacto ? 'Salir' : undefined}
            className={cn('inline-flex min-h-11 items-center gap-2 text-texto-suave hover:text-texto', !compacto && 'mt-2')}
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden /> {!compacto && 'Salir'}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-borde bg-superficie px-4">
        <button
          type="button"
          onClick={alternarMenu}
          aria-pressed={compacto}
          aria-label={compacto ? 'Expandir el menú' : 'Contraer el menú'}
          title={compacto ? 'Expandir el menú' : 'Contraer el menú'}
          className="hidden min-h-11 min-w-11 items-center justify-center rounded-control text-texto-suave hover:text-texto md:inline-flex"
        >
          {compacto ? <PanelLeftOpen size={20} strokeWidth={1.75} aria-hidden /> : <PanelLeftClose size={20} strokeWidth={1.75} aria-hidden />}
        </button>
        <Logo className="md:hidden" />
        <div className="ml-auto flex items-center gap-2">
          <NavLink to="/administracion/ayuda" className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm text-texto-suave hover:text-texto">
            <BookOpen size={18} strokeWidth={1.75} aria-hidden /> Ayuda
          </NavLink>
          <ConexionPildora />
        </div>
      </header>

      <main className={cn('mx-auto w-full p-4 pb-28 transition-[max-width] duration-200 md:p-8', compacto ? 'max-w-7xl' : 'max-w-5xl')}>
        <ErrorBoundary>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ gridTemplateColumns: `repeat(${enBarra.length + (enMas.length ? 1 : 0)}, minmax(0, 1fr))` }}
      >
        {enBarra.map((p) => <Item key={p.ruta} pantalla={p} />)}
        {enMas.length > 0 && (
          <button type="button" onClick={() => setMasAbierto(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-texto-suave">
            <Ellipsis size={22} strokeWidth={1.75} aria-hidden />
            Más
          </button>
        )}
      </nav>

      <Sheet abierto={masAbierto} onCerrar={() => setMasAbierto(false)} titulo={usuario.nombre}>
        <div className="flex flex-col gap-1">
          <p className="pb-2 text-sm text-texto-suave">{ROLES[usuario.rol]}</p>
          {enMas.map((p) => <Item key={p.ruta} pantalla={p} lateral onClick={() => setMasAbierto(false)} />)}
          <button type="button" onClick={cerrarSesion} className="flex min-h-11 items-center gap-3 rounded-control px-3 text-base text-texto-suave">
            <LogOut size={20} strokeWidth={1.75} aria-hidden /> Salir
          </button>
        </div>
      </Sheet>
    </div>
  )
}
