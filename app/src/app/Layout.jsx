import { Suspense, useEffect, useState } from 'react'
import { Ellipsis, LogOut } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { Sheet, Skeleton, useToast } from '../components/ui/index.js'
import { useAuth } from '../features/auth/AuthContext.js'
import { cn } from '../lib/cn.js'
import { puedeAlguna, ROLES } from '../lib/permisos.js'
import ConexionPildora from './ConexionPildora.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { PANTALLAS } from './navegacion.js'

const MAX_EN_BARRA = 5

function Item({ pantalla, lateral, onClick }) {
  const Icono = pantalla.icono
  return (
    <NavLink
      to={pantalla.ruta}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center transition-colors',
          lateral
            ? 'min-h-11 gap-3 rounded-control px-3 text-base'
            : 'min-h-14 flex-col justify-center gap-0.5 text-xs',
          isActive ? 'bg-superficie-2 font-medium text-texto' : 'text-texto-suave hover:text-texto',
        )
      }
    >
      <Icono size={lateral ? 20 : 22} strokeWidth={1.75} aria-hidden />
      {pantalla.etiqueta}
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
  const [masAbierto, setMasAbierto] = useState(false)
  const { pathname } = useLocation()
  const actual = PANTALLAS.find((p) => pathname === p.ruta || pathname.startsWith(`${p.ruta}/`))
  useEffect(() => {
    document.title = actual ? `${actual.etiqueta} · Modas Naty` : 'Modas Naty'
  }, [actual])
  const visibles = PANTALLAS.filter((p) => puedeAlguna(usuario.rol, p.accion))
  const enBarra = visibles.length > MAX_EN_BARRA ? visibles.slice(0, MAX_EN_BARRA - 1) : visibles
  const enMas = visibles.slice(enBarra.length)

  return (
    <div className="min-h-dvh md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-1 border-r border-borde bg-superficie p-3 md:flex">
        <Logo className="px-3 py-4" />
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {visibles.map((p) => <Item key={p.ruta} pantalla={p} lateral />)}
        </nav>
        <div className="border-t border-borde px-3 pt-3 text-sm">
          <p className="font-medium">{usuario.nombre}</p>
          <p className="text-texto-suave">{ROLES[usuario.rol]}</p>
          <button type="button" onClick={cerrarSesion} className="mt-2 inline-flex min-h-11 items-center gap-2 text-texto-suave hover:text-texto">
            <LogOut size={18} strokeWidth={1.75} aria-hidden /> Salir
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-borde bg-superficie px-4">
        <Logo className="md:hidden" />
        <div className="ml-auto flex items-center gap-2">
          <ConexionPildora />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl p-4 pb-28 md:p-8">
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
