import { lazy, Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ServerCrash } from 'lucide-react'
import { EmptyState, ToastProvider } from '../components/ui/index.js'
import { hayBackend } from '../data/supabase.js'
import AuthProvider from '../features/auth/AuthProviderRemoto.jsx'
import SyncRunner from '../data/sync/SyncRunner.jsx'
import ActualizacionPWA from './ActualizacionPWA.jsx'
import AppRoutes from './AppRoutes.jsx'
import Arranque from './Arranque.jsx'
import { FaviconDinamico } from '../components/Logo.jsx'
import PrimeraCarga from './PrimeraCarga.jsx'
import { BASE_ADMIN, esRutaAdmin } from '../features/tienda/rutas.js'

// Sitio: la raíz (/) es la tienda pública y este sistema vive en /admin (decisión D20).
// La tienda no pasa por Arranque, AuthProvider, PrimeraCarga ni SyncRunner: no toca la base local ni la cola de
// sincronización de la app interna (D2). Pasar de una a otra es una carga de página completa.
const TiendaApp = lazy(() => import('../features/tienda/TiendaApp.jsx'))

// Todo viene de Supabase: sin las variables de conexión la app no puede funcionar (no hay modo de prueba).
function SinServidor() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        icono={ServerCrash}
        titulo="Falta configurar el servidor"
        texto="Esta instalación no tiene la conexión con la base de datos (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). Avisale a tu proveedor."
      />
    </main>
  )
}

function AppInterna() {
  return (
    <ToastProvider>
      <ActualizacionPWA />
      <Arranque>
        <FaviconDinamico />
        <AuthProvider>
          <PrimeraCarga>
            <SyncRunner />
            <AppRoutes />
          </PrimeraCarga>
        </AuthProvider>
      </Arranque>
    </ToastProvider>
  )
}

export default function App() {
  if (!hayBackend) return <SinServidor />
  const admin = esRutaAdmin(window.location.pathname)
  return (
    <BrowserRouter basename={admin ? BASE_ADMIN : undefined}>
      {admin ? (
        <AppInterna />
      ) : (
        <Suspense fallback={null}>
          <TiendaApp />
        </Suspense>
      )}
    </BrowserRouter>
  )
}
