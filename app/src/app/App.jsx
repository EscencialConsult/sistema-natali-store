import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../components/ui/index.js'
import { lazy, Suspense } from 'react'
import { hayBackend } from '../data/supabase.js'
import AuthProviderLocal from '../features/auth/AuthProvider.jsx'
import SyncRunner from '../data/sync/SyncRunner.jsx'
import ActualizacionPWA from './ActualizacionPWA.jsx'
import AppRoutes from './AppRoutes.jsx'
import Arranque from './Arranque.jsx'
import { FaviconDinamico } from '../components/Logo.jsx'
import PrimeraCarga from './PrimeraCarga.jsx'

// La sesión real (Supabase) solo se descarga cuando hay servidor configurado.
const AuthProviderRemoto = lazy(() => import('../features/auth/AuthProviderRemoto.jsx'))
const AuthProvider = hayBackend ? AuthProviderRemoto : AuthProviderLocal

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ActualizacionPWA />
        <Arranque>
          <FaviconDinamico />
          <Suspense fallback={null}>
            <AuthProvider>
              <PrimeraCarga>
                <SyncRunner />
                <AppRoutes />
              </PrimeraCarga>
            </AuthProvider>
          </Suspense>
        </Arranque>
      </ToastProvider>
    </BrowserRouter>
  )
}
