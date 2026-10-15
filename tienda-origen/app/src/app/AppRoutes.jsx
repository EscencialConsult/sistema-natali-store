import { lazy, Suspense } from 'react'
import { Compass } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { BotonLink, EmptyState, Skeleton } from '../components/ui/index.js'
import { hayBackend } from '../data/supabase.js'
import { useAuth } from '../features/auth/AuthContext.js'
import LoginPage from '../features/auth/LoginPage.jsx'
import LoginRemoto from '../features/auth/LoginRemoto.jsx'
import RutaProtegida from '../features/auth/RutaProtegida.jsx'
import InicioPage from '../features/sitio/InicioPage.jsx'
import NoEncontradaSitio from '../features/sitio/NoEncontradaSitio.jsx'
import LayoutSitio from './layouts/LayoutSitio.jsx'
import { BASE_KIOSCO, BASE_PANEL, PANTALLAS, rutaInicio } from './navegacion.js'
import RutaKiosco from './RutaKiosco.jsx'
import { useSoloNoIndex } from '../lib/seo.js'

// Tres zonas con carga diferida por zona: quien entra a la tienda no baja el código del panel ni del kiosco.
const LayoutKiosco = lazy(() => import('./layouts/LayoutKiosco.jsx'))
const LayoutPanel = lazy(() => import('./layouts/LayoutPanel.jsx'))

// Sitio público.
const CatalogoPage = lazy(() => import('../features/catalogo/tienda/CatalogoPage.jsx'))
const ProductoPage = lazy(() => import('../features/catalogo/tienda/ProductoPage.jsx'))
const QuienesSomosPage = lazy(() => import('../features/sitio/QuienesSomosPage.jsx'))
const ContactoPage = lazy(() => import('../features/sitio/ContactoPage.jsx'))
const LegalPage = lazy(() => import('../features/sitio/LegalPage.jsx'))
const CarritoPage = lazy(() => import('../features/carrito/CarritoPage.jsx'))
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage.jsx'))
const PedidoPage = lazy(() => import('../features/checkout/PedidoPage.jsx'))
const GuiaClientePage = lazy(() => import('../features/ayuda/GuiaClientePage.jsx'))
const EjemploPedidoPage = lazy(() => import('../features/checkout/EjemploPedidoPage.jsx'))
const SeguimientoPage = lazy(() => import('../features/checkout/SeguimientoPage.jsx'))
const PasarelaPrueba = lazy(() => import('../features/checkout/PasarelaPrueba.jsx'))

// Panel (heredado del sistema de nota; el resto llega en la etapa 7).
const BuscadorPage = lazy(() => import('../features/catalogo/BuscadorPage.jsx'))
const InventarioPage = lazy(() => import('../features/inventario/InventarioPage.jsx'))
const ImportarStockPage = lazy(() => import('../features/inventario/ImportarStockPage.jsx'))
const ConfiguracionPage = lazy(() => import('../features/panel/configuracion/ConfiguracionPage.jsx'))
const InicioPanelPage = lazy(() => import('../features/panel/inicio/InicioPanelPage.jsx'))
const PedidosPage = lazy(() => import('../features/panel/pedidos/PedidosPage.jsx'))
const PedidoDetalle = lazy(() => import('../features/panel/pedidos/PedidoDetalle.jsx'))
const GastosPage = lazy(() => import('../features/panel/gastos/GastosPage.jsx'))
const ReportesPage = lazy(() => import('../features/panel/reportes/ReportesPage.jsx'))
const GuiaPanelPage = lazy(() => import('../features/ayuda/GuiaPanelPage.jsx'))
const CobrosPage = lazy(() => import('../features/panel/cobros/CobrosPage.jsx'))
const GuiaMercadoPagoPage = lazy(() => import('../features/panel/cobros/GuiaMercadoPagoPage.jsx'))
const UsuariosPage = lazy(() => import('../features/panel/usuarios/UsuariosPage.jsx'))
const CategoriasPage = lazy(() => import('../features/catalogo/admin/CategoriasPage.jsx'))

// Kiosco
const ActivarPage = lazy(() => import('../features/kiosco/ActivarPage.jsx'))
const BienvenidaPage = lazy(() => import('../features/kiosco/BienvenidaPage.jsx'))
const CatalogoKiosco = lazy(() => import('../features/kiosco/CatalogoKiosco.jsx'))
const ProductoKiosco = lazy(() => import('../features/kiosco/ProductoKiosco.jsx'))
const CarritoKiosco = lazy(() => import('../features/kiosco/CarritoKiosco.jsx'))
const ConfirmarKiosco = lazy(() => import('../features/kiosco/ConfirmarKiosco.jsx'))
const PagarPage = lazy(() => import('../features/kiosco/PagarPage.jsx'))
const GraciasPage = lazy(() => import('../features/kiosco/GraciasPage.jsx'))
const AdminListado = lazy(() => import('../features/catalogo/admin/AdminListado.jsx'))
const ProductoFormPage = lazy(() => import('../features/catalogo/admin/ProductoFormPage.jsx'))
const ImportarPage = lazy(() => import('../features/catalogo/admin/ImportarPage.jsx'))


const PAGINAS_PANEL = {
  [`${BASE_PANEL}/inicio`]: InicioPanelPage,
  [`${BASE_PANEL}/pedidos`]: PedidosPage,
  [`${BASE_PANEL}/productos`]: AdminListado,
  [`${BASE_PANEL}/buscar`]: BuscadorPage,
  [`${BASE_PANEL}/stock`]: InventarioPage,
  [`${BASE_PANEL}/gastos`]: GastosPage,
  [`${BASE_PANEL}/reportes`]: ReportesPage,
  [`${BASE_PANEL}/ayuda`]: GuiaPanelPage,
  [`${BASE_PANEL}/cobros`]: CobrosPage,
  [`${BASE_PANEL}/guia-mercado-pago`]: GuiaMercadoPagoPage,
  [`${BASE_PANEL}/usuarios`]: UsuariosPage,
  [`${BASE_PANEL}/configuracion`]: ConfiguracionPage,
}

// La raíz del panel ES el login; con sesión abierta lleva a la primera pantalla del rol.
function RaizPanel() {
  useSoloNoIndex()
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (usuario) return <Navigate to={rutaInicio(usuario.rol)} replace />
  return hayBackend ? <LoginRemoto /> : <LoginPage />
}

function NoEncontrada({ volverA = '/', etiqueta = 'Ir al inicio' }) {
  return (
    <EmptyState
      icono={Compass}
      titulo="No encontramos esa página"
      accion={<BotonLink to={volverA} variante="secundario">{etiqueta}</BotonLink>}
    />
  )
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className="m-4 h-40" />}>
      <Routes>
        {/* Sitio público */}
        <Route element={<LayoutSitio />}>
          <Route path="/" element={<InicioPage />} />
          <Route path="/quienes-somos" element={<QuienesSomosPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/legales/:slug" element={<LegalPage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/catalogo/:categoria" element={<CatalogoPage />} />
          <Route path="/p/:slug" element={<ProductoPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pedido/:codigo" element={<PedidoPage />} />
          <Route path="/pago-prueba/:codigo" element={<PasarelaPrueba />} />
          <Route path="/seguimiento" element={<SeguimientoPage />} />
          <Route path="/ejemplo-pedido" element={<EjemploPedidoPage />} />
          <Route path="/ayuda" element={<GuiaClientePage />} />
          <Route path="*" element={<NoEncontradaSitio />} />
        </Route>

        {/* Kiosco: dispositivo activado con PIN, sin sesión de persona */}
        <Route path={BASE_KIOSCO} element={<LayoutKiosco />}>
          <Route path="activar" element={<ActivarPage />} />
          <Route element={<RutaKiosco />}>
            <Route index element={<BienvenidaPage />} />
            <Route path="catalogo" element={<CatalogoKiosco />} />
            <Route path="p/:slug" element={<ProductoKiosco />} />
            <Route path="carrito" element={<CarritoKiosco />} />
            <Route path="confirmar" element={<ConfirmarKiosco />} />
            <Route path="pagar/:id" element={<PagarPage />} />
            <Route path="gracias/:id" element={<GraciasPage />} />
          </Route>
          <Route path="*" element={<NoEncontrada volverA={BASE_KIOSCO} etiqueta="Volver al kiosco" />} />
        </Route>

        {/* Panel de administración */}
        <Route path={BASE_PANEL} element={<RaizPanel />} />
        <Route element={<RutaProtegida />}>
          <Route element={<LayoutPanel />}>
            {PANTALLAS.map((p) => {
              const Pagina = PAGINAS_PANEL[p.ruta]
              return (
                <Route key={p.ruta} element={<RutaProtegida accion={p.accion} />}>
                  <Route path={p.ruta} element={<Pagina />} />
                </Route>
              )
            })}
            <Route element={<RutaProtegida accion="stock.mover" />}>
              <Route path={`${BASE_PANEL}/stock/importar`} element={<ImportarStockPage />} />
            </Route>
            <Route element={<RutaProtegida accion="pedidos.ver" />}>
              <Route path={`${BASE_PANEL}/pedidos/:id`} element={<PedidoDetalle />} />
            </Route>
            <Route element={<RutaProtegida accion="catalogo.editar" />}>
              <Route path={`${BASE_PANEL}/categorias`} element={<CategoriasPage />} />
              <Route path={`${BASE_PANEL}/productos/nuevo`} element={<ProductoFormPage />} />
              <Route path={`${BASE_PANEL}/productos/importar`} element={<ImportarPage />} />
              <Route path={`${BASE_PANEL}/productos/:id`} element={<ProductoFormPage />} />
            </Route>
            <Route path={`${BASE_PANEL}/*`} element={<NoEncontrada volverA={BASE_PANEL} etiqueta="Ir al panel" />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
