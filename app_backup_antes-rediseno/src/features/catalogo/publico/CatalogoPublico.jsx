import { useEffect, useState } from 'react'
import { MessageCircle, Search, SearchX, X } from 'lucide-react'
import Logo from '../../../components/Logo.jsx'
import { EmptyState, Sheet, Skeleton } from '../../../components/ui/index.js'
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
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-borde bg-superficie px-4">
        <Logo />
        {telefono && (
          <a href={`https://wa.me/${telefono}`} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-whatsapp px-4 text-sm font-medium text-sobre-tinta">
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Consultar
          </a>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 pb-12 md:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl">Catálogo</h1>
          <p className="text-texto-suave">Elegí un modelo para ver todas sus fotos y colores.</p>
        </div>

        <div role="search" className="relative">
          <label htmlFor="q" className="sr-only">Buscar modelo</label>
          <Search size={20} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-tenue" />
          <input
            id="q"
            type="search"
            autoComplete="off"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por código o nombre"
            className="min-h-12 w-full rounded-control border border-borde-fuerte bg-superficie pl-12 pr-12 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {texto && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => setTexto('')} className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-texto-suave">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </div>

        {!q && <GrillaProductos publico onAbrir={setAbierto} />}
        {q && res.cargando && <Skeleton className="h-40" />}
        {q && res.datos?.length === 0 && <EmptyState icono={SearchX} titulo={`No encontramos “${q}”`} texto="Probá con otro código o con parte del nombre." />}
        {q && res.datos?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {res.datos.map((p) => <li key={p.id}><FilaResultado producto={p} onAbrir={setAbierto} mostrarPrecio={mostrarPrecio} /></li>)}
          </ul>
        )}
      </main>

      <Sheet abierto={!!abierto} onCerrar={() => setAbierto(null)} titulo={abierto?.codigo ?? ''} className="sm:w-[min(94vw,52rem)]">
        {abierto && <ProductoFicha productoId={abierto.id} publico />}
      </Sheet>
    </div>
  )
}
