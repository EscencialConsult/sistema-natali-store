import { Suspense, useEffect, useState } from 'react'
import { Ellipsis, LogOut } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { Avatar, Sheet, Skeleton, useToast } from '../components/ui/index.js'
import { useAuth } from '../features/auth/AuthContext.js'
import { cn } from '../lib/cn.js'
import { puedeAlguna, ROLES } from '../lib/permisos.js'
import { useConexion } from '../lib/useConexion.js'
import AvisoAlmacenamiento from '../features/almacenamiento/AvisoAlmacenamiento.jsx'
import ConexionPildora, { AvisoConexion } from './ConexionPildora.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { PANTALLAS, repartirBarra } from './navegacion.js'


function ItemLateral({ pantalla, onClick }) {
  const Icono = pantalla.icono
  return (
    <NavLink
      to={pantalla.ruta}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.9375rem] transition-colors duration-150',
          isActive ? 'bg-tinte font-medium text-sobre-tinte' : 'text-texto-suave hover:bg-superficie-2 hover:text-texto',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icono size={20} strokeWidth={isActive ? 2 : 1.75} aria-hidden className={isActive ? 'text-tinta' : ''} />
          {pantalla.etiqueta}
        </>
      )}
    </NavLink>
  )
}

function ItemBarra({ pantalla }) {
  const Icono = pantalla.icono
  return (
    <NavLink to={pantalla.ruta} className="group flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium">
      {({ isActive }) => (
        <>
          <span className={cn('flex h-7 w-12 items-center justify-center rounded-pildora transition-colors duration-150', isActive ? 'bg-tinte text-tinta' : 'text-texto-suave')}>
            <Icono size={20} strokeWidth={isActive ? 2 : 1.75} aria-hidden />
          </span>
          <span className={isActive ? 'text-texto' : 'text-texto-suave'}>{pantalla.etiqueta}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { usuario, cerrarSesion: cerrar } = useAuth()
  const avisar = useToast()
  const cerrarSesion = async () => {
    const r = await cerrar()
    if (r?.ok === false) avisar(r.motivo, 'error')
  }
  const { estado: conexion, restablecida } = useConexion()
  const [masAbierto, setMasAbierto] = useState(false)
  const { pathname } = useLocation()
  const actual = PANTALLAS.find((p) => pathname === p.ruta || pathname.startsWith(`${p.ruta}/`))
  useEffect(() => {
    document.title = actual ? `${actual.etiqueta} · Modas Naty` : 'Modas Naty'
  }, [actual])
  const visibles = PANTALLAS.filter((p) => puedeAlguna(usuario.rol, p.accion))
  // "Más" va SIEMPRE en la barra del celular: ahí están la persona y "Cerrar sesión" (con 5 pantallas no había cómo salir).
  const { enBarra, enMas } = repartirBarra(visibles)
  const masActivo = enMas.some((p) => p === actual)

  return (
    <div className="min-h-dvh md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-borde bg-superficie md:flex">
        <div className="px-5 pb-6 pt-6">
          <Logo conBajada />
        </div>
        <p className="px-6 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-texto-tenue">Menú</p>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {visibles.map((p) => <ItemLateral key={p.ruta} pantalla={p} />)}
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-tarjeta bg-superficie-2 p-3">
          <Avatar nombre={usuario.nombre} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{usuario.nombre}</p>
            <p className="truncate text-xs text-texto-suave">{ROLES[usuario.rol]}</p>
          </div>
          <button type="button" onClick={cerrarSesion} aria-label="Salir" title="Salir" className="flex size-11 shrink-0 items-center justify-center rounded-control text-texto-suave transition-colors hover:bg-superficie hover:text-texto">
            <LogOut size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </aside>

      <header className={cn('sticky top-0 z-20 border-b backdrop-blur-md transition-colors duration-300', conexion === 'sin_conexion' ? 'border-error/30 bg-error-fondo/95' : 'border-borde/80 bg-fondo/85')}>
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Logo className="md:hidden" />
          <p className="hidden text-sm text-texto-suave md:block">
            {actual ? <><span className="text-texto-tenue">Modas Naty /</span> <span className="font-medium text-texto">{actual.etiqueta}</span></> : 'Modas Naty'}
          </p>
          <div className="flex items-center gap-2">
            <AvisoAlmacenamiento />
            <ConexionPildora estado={conexion} />
          </div>
        </div>
        <AvisoConexion estado={conexion} restablecida={restablecida} />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8 md:pb-16 md:pt-8">
        <ErrorBoundary>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-20 grid border-t border-borde/80 bg-superficie/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(42_34_48/0.12)] backdrop-blur-md md:hidden"
        style={{ gridTemplateColumns: `repeat(${enBarra.length + 1}, minmax(0, 1fr))` }}
      >
        {enBarra.map((p) => <ItemBarra key={p.ruta} pantalla={p} />)}
        <button type="button" onClick={() => setMasAbierto(true)} aria-current={masActivo || undefined} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium">
          <span className={cn('flex h-7 w-12 items-center justify-center rounded-pildora', masActivo ? 'bg-tinte text-tinta' : 'text-texto-suave')}>
            <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <span className={masActivo ? 'text-texto' : 'text-texto-suave'}>Más</span>
        </button>
      </nav>

      <Sheet abierto={masAbierto} onCerrar={() => setMasAbierto(false)} titulo="Más opciones">
        <div className="flex flex-col gap-1">
          <div className="mb-3 flex items-center gap-3 rounded-tarjeta bg-superficie-2 p-3">
            <Avatar nombre={usuario.nombre} />
            <div className="min-w-0">
              <p className="truncate font-medium">{usuario.nombre}</p>
              <p className="truncate text-sm text-texto-suave">{ROLES[usuario.rol]}</p>
            </div>
          </div>
          {enMas.map((p) => <ItemLateral key={p.ruta} pantalla={p} onClick={() => setMasAbierto(false)} />)}
          <button type="button" onClick={cerrarSesion} className="mt-1 flex min-h-11 items-center gap-3 rounded-control px-3 text-[0.9375rem] text-error hover:bg-error-fondo">
            <LogOut size={20} strokeWidth={1.75} aria-hidden /> Cerrar sesión
          </button>
        </div>
      </Sheet>
    </div>
  )
}
