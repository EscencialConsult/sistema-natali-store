import { useEffect } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { MessageCircle, ServerCrash, ShoppingBag } from 'lucide-react'
import { EmptyState } from '../../components/ui/index.js'
import { useAjustes } from './data/catalogo.js'
import { useCarrito } from './data/carritoStore.js'
import { hayBackendPublico } from './data/clientePublico.js'
import { AjustesTienda, enlaceWhatsApp } from './contexto.js'
import { BASE_TIENDA, RUTA_COMO_COMPRAR, RUTA_DONDE_ESTAMOS, RUTA_PEDIDO } from './rutas.js'
import CatalogoPage from './CatalogoPage.jsx'
import { ComoComprarPage, DondeEstamosPage } from './InfoPages.jsx'
import PedidoPage from './PedidoPage.jsx'
import ProductoPage from './ProductoPage.jsx'

function Marco({ children }) {
  const a = useAjustes()
  const ajustes = a.datos
  const nombre = ajustes?.negocio_nombre || 'Modas Naty'
  const wa = enlaceWhatsApp(ajustes?.whatsapp_tienda)
  const cantidadModelos = useCarrito().lineas.length

  useEffect(() => {
    document.title = `Catálogo mayorista · ${nombre}`
  }, [nombre])

  return (
    <AjustesTienda.Provider value={{ ajustes, cargando: a.cargando, enCache: a.enCache, error: a.error }}>
      <div className="min-h-dvh bg-fondo">
        <p className="bg-pie px-4 py-2 text-center text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-sobre-tinta/80">
          Venta mayorista · Precios por docena
        </p>
        <header className="sticky top-0 z-20 border-b border-borde/80 bg-fondo/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
            <Link to={BASE_TIENDA} aria-label={`${nombre}: ir al catálogo`} className="inline-flex items-center">
              <img src="/brand/isotipo.png" width="240" height="134" alt={nombre} className="h-9 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <Link to={RUTA_PEDIDO} className="relative inline-flex min-h-11 items-center gap-2 rounded-pildora bg-superficie px-4 text-sm font-medium">
                <ShoppingBag size={18} strokeWidth={1.75} aria-hidden /> Mi pedido
                {cantidadModelos > 0 && <span className="rounded-full bg-tinta px-2 text-xs text-sobre-tinta" aria-label={`${cantidadModelos} modelos`}>{cantidadModelos}</span>}
              </Link>
              {wa && (
                <a href={wa} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-pildora bg-whatsapp px-4 text-sm font-medium text-sobre-tinta shadow-boton hover:brightness-95">
                  <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Consultar
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 md:px-8 md:pt-12">{children}</main>
        <footer className="bg-pie px-4 py-10 text-center text-sm text-sobre-tinta/70">
          <p className="font-titulo text-lg font-semibold text-sobre-tinta">{nombre}</p>
          <p className="mt-1">Catálogo mayorista</p>
          <nav aria-label="Información" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to={BASE_TIENDA} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Catálogo</Link>
            <Link to={RUTA_COMO_COMPRAR} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Cómo comprar</Link>
            <Link to={RUTA_DONDE_ESTAMOS} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Dónde estamos</Link>
          </nav>
        </footer>
      </div>
    </AjustesTienda.Provider>
  )
}

// Se monta fuera de Arranque, AuthProvider y SyncRunner: no toca la base local ni la cola de Renzo.
export default function TiendaApp() {
  if (!hayBackendPublico) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <EmptyState icono={ServerCrash} titulo="El catálogo no está disponible" texto="Volvé a intentar en unos minutos." />
      </main>
    )
  }
  return (
    <Marco>
      <Routes>
        <Route path={BASE_TIENDA} element={<CatalogoPage />} />
        <Route path={`${BASE_TIENDA}/p/:id`} element={<ProductoPage />} />
        <Route path={RUTA_PEDIDO} element={<PedidoPage />} />
        <Route path={RUTA_COMO_COMPRAR} element={<ComoComprarPage />} />
        <Route path={RUTA_DONDE_ESTAMOS} element={<DondeEstamosPage />} />
        <Route path={`${BASE_TIENDA}/*`} element={<Navigate to={BASE_TIENDA} replace />} />
      </Routes>
    </Marco>
  )
}
