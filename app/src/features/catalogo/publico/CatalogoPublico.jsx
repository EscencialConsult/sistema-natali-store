import { useEffect, useState } from 'react'
import { MessageCircle, SearchX } from 'lucide-react'
import Logo from '../../../components/Logo.jsx'
import { CampoBusqueda, EmptyState, Sheet, Skeleton } from '../../../components/ui/index.js'
import { useBusquedaCodigo, useConfig } from '../../../data/hooks.js'
import FilaResultado from '../FilaResultado.jsx'
import GrillaProductos from '../GrillaProductos.jsx'
import ProductoFicha from '../ProductoFicha.jsx'

// Catálogo para clientas: sin login, solo lectura. No muestra stock, costos ni datos internos;
// el precio solo aparece si la administración lo habilita en Ajustes.
export default function CatalogoPublico() {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(null)
  const cfg = useConfig()
  const nombreNegocio = cfg.datos?.negocio?.nombre ?? 'Modas Naty'
  useEffect(() => {
    document.title = `Catálogo · ${nombreNegocio}`
  }, [nombreNegocio])
  const q = texto.trim()
  const res = useBusquedaCodigo(q, 24)

  const telefono = String(cfg.datos?.whatsapp_tienda ?? '').replace(/\D/g, '')
  const mostrarPrecio = !!cfg.datos?.mostrar_precios_publico

  return (
    <div className="min-h-dvh bg-fondo">
      <p className="bg-pie px-4 py-2 text-center text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-sobre-tinta/80">Venta mayorista · Precios por docena</p>
      <header className="sticky top-0 z-20 border-b border-borde/80 bg-fondo/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Logo />
          {telefono && (
            <a href={`https://wa.me/${telefono}`} className="inline-flex min-h-11 items-center gap-2 rounded-pildora bg-whatsapp px-4 text-sm font-medium text-sobre-tinta shadow-boton hover:brightness-95">
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Consultar
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl tracking-tight md:text-5xl">Catálogo</h1>
          <p className="max-w-md text-texto-suave">Elegí un modelo para ver todas sus fotos y colores.</p>
        </div>

        <CampoBusqueda id="q" etiqueta="Buscar modelo" grande valor={texto} onCambiar={setTexto} placeholder="Buscar por código o nombre" className="mx-auto w-full max-w-xl" />

        {!q && <GrillaProductos publico onAbrir={setAbierto} />}
        {q && res.cargando && <Skeleton className="h-40" />}
        {q && res.datos?.length === 0 && <EmptyState icono={SearchX} titulo={`No encontramos “${q}”`} texto="Probá con otro código o con parte del nombre." />}
        {q && res.datos?.length > 0 && (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {res.datos.map((p) => <li key={p.id}><FilaResultado producto={p} onAbrir={setAbierto} mostrarPrecio={mostrarPrecio} /></li>)}
          </ul>
        )}
      </main>

      <footer className="bg-pie px-4 py-10 text-center text-sm text-sobre-tinta/70">
        <p className="font-titulo text-lg font-semibold text-sobre-tinta">{nombreNegocio}</p>
        <p className="mt-1">Catálogo mayorista</p>
      </footer>

      {telefono && (
        <a href={`https://wa.me/${telefono}`} aria-label="Escribinos por WhatsApp" className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-whatsapp text-sobre-tinta shadow-flotante hover:brightness-95">
          <MessageCircle size={26} strokeWidth={1.75} aria-hidden />
        </a>
      )}

      <Sheet abierto={!!abierto} onCerrar={() => setAbierto(null)} titulo={abierto?.codigo ?? ''} className="sm:w-[min(94vw,56rem)]">
        {abierto && <ProductoFicha productoId={abierto.id} publico />}
      </Sheet>
    </div>
  )
}
