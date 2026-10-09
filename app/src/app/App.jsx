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

export default function App() {
  if (!hayBackend) return <SinServidor />
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
