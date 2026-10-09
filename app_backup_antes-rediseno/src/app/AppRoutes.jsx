import { lazy, Suspense } from 'react'
import { Compass, Hammer } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { Button, EmptyState, Skeleton } from '../components/ui/index.js'
import { useAuth } from '../features/auth/AuthContext.js'
import LoginPage from '../features/auth/LoginPage.jsx'
import LoginRemoto from '../features/auth/LoginRemoto.jsx'
import { hayBackend } from '../data/supabase.js'
import RutaProtegida from '../features/auth/RutaProtegida.jsx'
import BuscadorPage from '../features/catalogo/BuscadorPage.jsx'
import NuevaVentaPage from '../features/ventas/NuevaVentaPage.jsx'
import Layout from './Layout.jsx'
import { PANTALLAS, rutaInicio } from './navegacion.js'

// Lo que se usa todo el día (buscar y vender) va en el paquete principal; el resto se baja a pedido.
// Con la app instalada, el service worker guarda todos los paquetes: igual funciona sin internet.
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage.jsx'))
const VentasPage = lazy(() => import('../features/ventas/VentasPage.jsx'))
const NotaPage = lazy(() => import('../features/nota/NotaPage.jsx'))
const InventarioPage = lazy(() => import('../features/inventario/InventarioPage.jsx'))
const ImportarStockPage = lazy(() => import('../features/inventario/ImportarStockPage.jsx'))
const ComisionesPage = lazy(() => import('../features/comisiones/ComisionesPage.jsx'))
const AjustesPage = lazy(() => import('../features/ajustes/AjustesPage.jsx'))
const AdminListado = lazy(() => import('../features/catalogo/admin/AdminListado.jsx'))
const ProductoFormPage = lazy(() => import('../features/catalogo/admin/ProductoFormPage.jsx'))
const ImportarPage = lazy(() => import('../features/catalogo/admin/ImportarPage.jsx'))
const CatalogoPublico = lazy(() => import('../features/catalogo/publico/CatalogoPublico.jsx'))

// Solo existe en desarrollo: en el build de producción se elimina junto con el seed que importa.
const Muestra = import.meta.env.DEV ? lazy(() => import('./Muestra.jsx')) : null

const PAGINAS = {
  '/inicio': DashboardPage,
  '/catalogo': BuscadorPage,
  '/venta': NuevaVentaPage,
  '/ventas': VentasPage,
  '/stock': InventarioPage,
  '/comisiones': ComisionesPage,
  '/ajustes': AjustesPage,
}

function Pendiente({ pantalla }) {
  return <EmptyState icono={Hammer} titulo={pantalla.etiqueta} texto="Esta pantalla todavía no está disponible." />
}

// La raíz es el login; con sesión abierta lleva a la primera pantalla del rol.
function Raiz() {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (usuario) return <Navigate to={rutaInicio(usuario.rol)} replace />
  return hayBackend ? <LoginRemoto /> : <LoginPage />
}

function NoEncontrada() {
  return (
    <EmptyState
      icono={Compass}
      titulo="No encontramos esa página"
      accion={<Link to="/"><Button variante="secundario">Ir al inicio</Button></Link>}
    />
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-40" />}>
      <Routes>
        <Route path="/" element={<Raiz />} />
        <Route path="/c" element={<CatalogoPublico />} />
        <Route element={<RutaProtegida />}>
          <Route element={<Layout />}>
            {PANTALLAS.map((p) => {
              const Pagina = PAGINAS[p.ruta]
              return (
                <Route key={p.ruta} element={<RutaProtegida accion={p.accion} />}>
                  <Route path={p.ruta} element={Pagina ? <Pagina /> : <Pendiente pantalla={p} />} />
                </Route>
              )
            })}
            <Route element={<RutaProtegida accion={['ventas.ver_propias', 'ventas.ver_todas']} />}>
              <Route path="/ventas/:id" element={<NotaPage />} />
            </Route>
            <Route element={<RutaProtegida accion="stock.mover" />}>
              <Route path="/stock/importar" element={<ImportarStockPage />} />
            </Route>
            <Route element={<RutaProtegida accion="catalogo.editar" />}>
              <Route path="/catalogo/admin" element={<AdminListado />} />
              <Route path="/catalogo/admin/nuevo" element={<ProductoFormPage />} />
              <Route path="/catalogo/admin/importar" element={<ImportarPage />} />
              <Route path="/catalogo/admin/:id" element={<ProductoFormPage />} />
            </Route>
            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Route>
        {Muestra && <Route path="/muestra" element={<Muestra />} />}
      </Routes>
    </Suspense>
  )
}
