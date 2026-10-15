import { lazy, Suspense } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
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
import { esRutaTienda } from '../features/tienda/rutas.js'

// Tienda pública (/tienda/*): se monta ANTES de Arranque, AuthProvider, PrimeraCarga y SyncRunner,
// para no tocar la base local ni la cola de sincronización de la app interna. Ver Docs/tienda/PLAN.md (D2).
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

function Selector() {
  const { pathname } = useLocation()
  if (esRutaTienda(pathname)) {
    return (
      <Suspense fallback={null}>
        <TiendaApp />
      </Suspense>
    )
  }
  return <AppInterna />
}

export default function App() {
  if (!hayBackend) return <SinServidor />
  return (
    <BrowserRouter>
      <Selector />
    </BrowserRouter>
  )
}
