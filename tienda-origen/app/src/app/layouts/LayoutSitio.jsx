import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Skeleton } from '../../components/ui/index.js'
import BotonWhatsApp from '../../features/sitio/BotonWhatsApp.jsx'
import Cabecera from '../../features/sitio/Cabecera.jsx'
import AvisoSinConexion from '../../features/sitio/AvisoSinConexion.jsx'
import Pie from '../../features/sitio/Pie.jsx'
import ErrorBoundary from '../ErrorBoundary.jsx'

// Cáscara del sitio público: salto al contenido, cabecera con menú y carrito, contenido, pie oscuro, WhatsApp flotante.
export default function LayoutSitio() {
  return (
    <div className="flex min-h-dvh flex-col bg-fondo">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-superficie focus:px-4 focus:py-2">
        Ir al contenido
      </a>
      <Cabecera />
      <AvisoSinConexion />
      <main id="contenido" className="mx-auto min-h-[70dvh] w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-10">
        <ErrorBoundary>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Pie />
      <BotonWhatsApp />
    </div>
  )
}
