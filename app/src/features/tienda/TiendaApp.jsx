import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { MessageCircle, Search, ServerCrash, ShoppingBag } from 'lucide-react'
import { EmptyState } from '../../components/ui/index.js'
import { useAjustes, useConfigTienda, useVendedores } from './data/catalogo.js'
import { validarEstadoTienda, validarLocales, vendedoresDe } from './lib/configTienda.js'
import { textosDe } from './lib/textos.js'
import { esErrorSinTabla } from './lib/errores.js'
import { useCarrito } from './data/carritoStore.js'
import { hayBackendPublico } from './data/clientePublico.js'
import { AjustesTienda, enlaceWhatsApp } from './contexto.js'
import { BASE_ADMIN, RUTA_AYUDA, RUTA_CATALOGO, RUTA_CONTACTO, RUTA_INICIO, RUTA_PEDIDO, RUTA_PRODUCTO, RUTA_QUIENES_SOMOS, RUTAS_ANTERIORES } from './rutas.js'
import CatalogoPage from './publico/CatalogoPage.jsx'
import { DecorCatalogo, DecorInicio } from './publico/Decoraciones.jsx'
import AvisoAgregado from './publico/AvisoAgregado.jsx'
import HomePage from './publico/HomePage.jsx'
import MantenimientoPage from './publico/MantenimientoPage.jsx'
import { AyudaPage, ContactoPage, QuienesSomosPage } from './publico/InfoPages.jsx'
import Pie from './publico/Pie.jsx'
import PedidoPage from './publico/PedidoPage.jsx'
import ProductoPage from './publico/ProductoPage.jsx'
import './tienda.css'

const ENLACES = [
  { a: RUTA_INICIO, texto: 'Inicio', fin: true },
  { a: RUTA_CATALOGO, texto: 'Catálogo' },
  { a: RUTA_QUIENES_SOMOS, texto: 'Quiénes somos' },
  { a: RUTA_CONTACTO, texto: 'Contacto' },
  { a: RUTA_AYUDA, texto: 'Ayuda' },
]

const claseEnlace = ({ isActive }) =>
  `inline-flex min-h-11 shrink-0 items-center border-b-2 text-sm transition-colors ${
    isActive ? 'border-(--t-vino) font-medium text-(--t-tinta)' : 'border-transparent t-suave hover:text-(--t-tinta)'
  }`

function Marco({ children }) {
  const a = useAjustes()
  const ajustes = a.datos
  const nombre = ajustes?.negocio_nombre || 'Modas Naty'
  // El WhatsApp principal es el de la tienda; si todavía no está cargado, el de la primera encargada de la lista de contactos.
  const c = useConfigTienda()
  const config = c.datos
  const vend = useVendedores()
  const vendedores = vendedoresDe(vend.datos, config)
  const principal = ajustes?.whatsapp_tienda || vendedores[0]?.telefono
  const t = textosDe(config)
  const wa = enlaceWhatsApp(principal)
  const locales = validarLocales(config?.locales).valor
  const cantidadModelos = useCarrito().lineas.length
  // Cada vez que algo llega al pedido, el ícono da un saltito (la clave reinicia la animación).
  const [bump, setBump] = useState(0)
  const alLlegar = useCallback(() => setBump((n) => n + 1), [])
  const { pathname, search } = useLocation()

  // Vista previa para el equipo: con ?previa=1 esta pestaña ve la tienda abierta aunque esté cerrada al público.
  const previa = useMemo(() => {
    const pedida = new URLSearchParams(search).get('previa') === '1'
    try {
      if (pedida) sessionStorage.setItem('tienda-previa', '1')
      return sessionStorage.getItem('tienda-previa') === '1'
    } catch {
      return pedida
    }
  }, [search])
  const estadoTienda = validarEstadoTienda(config?.tienda).valor
  // Cerrada por la administración, o todavía sin activar en la base (la tabla no existe): pantalla de mantenimiento.
  const cerrada = estadoTienda.cerrada || (!config && esErrorSinTabla(c.error))
  // Primera visita sin copia local: se espera la configuración para no mostrar la tienda y taparla un instante después.
  const primeraCarga = c.cargando && !config && !c.error

  useEffect(() => {
    document.title = `Catálogo mayorista · ${nombre}`
  }, [nombre])

  useEffect(() => {
    // La app instalada (PWA) es la del equipo: si alguien la abre desde un ícono viejo que apunta a la raíz, va al sistema.
    const instalada = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (instalada && window.location.pathname === '/') window.location.replace(`${BASE_ADMIN}/`)
    // El manifiesto es del sistema interno: la tienda pública no se ofrece como app instalable.
    document.querySelector('link[rel="manifest"]')?.remove()
  }, [])

  if (primeraCarga) {
    return (
      <main className="tienda flex min-h-dvh items-center justify-center" aria-busy="true" aria-label="Cargando">
        <img src="/brand/isotipo.png" width="240" height="134" alt="" className="h-12 w-auto opacity-60" />
      </main>
    )
  }
  if (cerrada && !previa) return <MantenimientoPage nombre={nombre} mensaje={estadoTienda.mensaje} whatsapp={wa} locales={locales} />

  return (
    <AjustesTienda.Provider value={{ ajustes, vendedores, cargando: a.cargando, enCache: a.enCache, error: a.error }}>
      <div className="tienda relative flex min-h-dvh flex-col overflow-x-clip">
        {cerrada && (
          <p role="status" className="relative z-30 bg-(--t-vino) px-4 py-2 text-center text-sm text-white">
            Vista previa del equipo: la tienda está cerrada al público. Las clientas ven el aviso de mantenimiento.
          </p>
        )}
        {/* Capa decorativa a todo el ancho, por detrás de todo: las manchas se pegan a los bordes de la pantalla. */}
        <div className="t-decor absolute inset-x-0 top-0 z-0 h-[44rem] overflow-hidden" aria-hidden="true">
          {pathname === RUTA_INICIO && <DecorInicio />}
          {pathname === RUTA_CATALOGO && <DecorCatalogo />}
        </div>
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
          Ir al contenido
        </a>
        <header className="relative z-30">
          <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 md:grid-cols-[1fr_auto_1fr] md:px-8">
            <nav aria-label="Principal" className="hidden gap-6 md:flex">
              {ENLACES.map((e) => <NavLink key={e.a} to={e.a} end={e.fin} className={claseEnlace}>{e.texto}</NavLink>)}
            </nav>
            <Link to={RUTA_INICIO} aria-label={`${nombre}: ir a la portada`} className="inline-flex items-center gap-2 justify-self-start md:justify-self-center">
              <img src="/brand/isotipo.png" width="240" height="134" alt="" className="h-9 w-auto" />
              <span className="font-titulo text-lg font-semibold tracking-tight">{nombre}</span>
            </Link>
            <div className="flex items-center justify-end gap-1">
              <Link to={`${RUTA_CATALOGO}?foco=1`} aria-label="Buscar en el catálogo" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-(--t-beige)/60">
                <Search size={19} strokeWidth={1.75} aria-hidden />
              </Link>
              <Link id="icono-pedido" to={RUTA_PEDIDO} aria-label={`Mi pedido${cantidadModelos ? `, ${cantidadModelos} modelos` : ''}`} className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-(--t-beige)/60">
                <span key={bump} className={bump ? 't-bump inline-flex' : 'inline-flex'}>
                  <ShoppingBag size={19} strokeWidth={1.75} aria-hidden />
                </span>
                {cantidadModelos > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-(--t-vino) px-1 text-[0.6875rem] font-semibold text-white">{cantidadModelos}</span>
                )}
              </Link>
            </div>
          </div>
          <nav aria-label="Principal (celular)" className="-mb-px flex gap-6 overflow-x-auto px-4 md:hidden">
            {ENLACES.map((e) => <NavLink key={e.a} to={e.a} end={e.fin} className={claseEnlace}>{e.texto}</NavLink>)}
          </nav>
        </header>

        <main id="contenido" className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 md:px-8 md:pt-12">{children}</main>

        <AvisoAgregado onLlego={alLlegar} />

        {wa && (
          <a href={wa} rel="noopener noreferrer" target="_blank" aria-label="Consultar por WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-sobre-tinta shadow-lg hover:brightness-95">
            <MessageCircle size={24} strokeWidth={1.75} aria-hidden />
          </a>
        )}

        <Pie nombre={nombre} enlaces={ENLACES} locales={locales} whatsapp={wa} frase={t('pie.frase')} localesTitulo={t('pie.locales_titulo')} />
      </div>
    </AjustesTienda.Provider>
  )
}

// Se monta fuera de Arranque, AuthProvider y SyncRunner: no toca la base local ni la cola de Renzo.
export default function TiendaApp() {
  // La tienda se ve como con el navegador al 120 % en pantallas grandes (ver tienda.css). Solo mientras está montada.
  useEffect(() => {
    document.documentElement.classList.add('tienda-activa')
    return () => document.documentElement.classList.remove('tienda-activa')
  }, [])
  if (!hayBackendPublico) {
    return (
      <main className="tienda flex min-h-dvh items-center justify-center p-6">
        <EmptyState icono={ServerCrash} titulo="El catálogo no está disponible" texto="Volvé a intentar en unos minutos." />
      </main>
    )
  }
  return (
    <Marco>
      <Routes>
        <Route path={RUTA_INICIO} element={<HomePage />} />
        <Route path={RUTA_CATALOGO} element={<CatalogoPage />} />
        <Route path={RUTA_PRODUCTO} element={<ProductoPage />} />
        <Route path={RUTA_PEDIDO} element={<PedidoPage />} />
        <Route path={RUTA_QUIENES_SOMOS} element={<QuienesSomosPage />} />
        <Route path={RUTA_CONTACTO} element={<ContactoPage />} />
        <Route path={RUTA_AYUDA} element={<AyudaPage />} />
        {Object.entries(RUTAS_ANTERIORES).map(([desde, hacia]) => (
          <Route key={desde} path={desde} element={<Navigate to={hacia} replace />} />
        ))}
        {/* El catálogo viejo del sistema de notas vivía en /c: los QR ya impresos siguen llevando a la tienda. */}
        <Route path="*" element={<Navigate to={RUTA_INICIO} replace />} />
      </Routes>
    </Marco>
  )
}
