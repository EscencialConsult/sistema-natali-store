import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, SearchX, WifiOff } from 'lucide-react'
import { EmptyState, Skeleton } from '../../components/ui/index.js'
import { useProducto } from './data/catalogo.js'
import { guardarCarrito, useCarrito } from './data/carritoStore.js'
import { supabaseUrl } from './data/clientePublico.js'
import { enlaceWhatsApp, useAjustesTienda } from './contexto.js'
import { agregarLinea } from './lib/carrito.js'
import { fotosDe } from './lib/fotos.js'
import { BASE_TIENDA, RUTA_PEDIDO } from './rutas.js'
import PrecioBloque from './PrecioBloque.jsx'

export default function ProductoPage() {
  const { id } = useParams()
  const { producto, cargando, error } = useProducto(id)
  const { ajustes } = useAjustesTienda()
  const carrito = useCarrito()
  const [agregado, setAgregado] = useState(null)
  // La foto elegida es de un producto concreto: al cambiar de producto vuelve a la primera sin tocar estado en un efecto.
  const [eleccion, setEleccion] = useState({ id, i: 0 })
  const actual = eleccion.id === id ? eleccion.i : 0
  const setActual = (i) => setEleccion({ id, i })
  const fotos = fotosDe(producto, supabaseUrl)

  useEffect(() => {
    if (producto) document.title = `${producto.nombre} · ${producto.codigo}`
  }, [producto])

  const volver = (
    <Link to={BASE_TIENDA} className="inline-flex min-h-11 items-center gap-2 text-sm text-texto-suave hover:text-tinta">
      <ArrowLeft size={16} aria-hidden /> Volver al catálogo
    </Link>
  )

  if (cargando) return <div className="flex flex-col gap-4">{volver}<Skeleton className="aspect-[3/4] max-w-md" /></div>
  if (error) return <div className="flex flex-col gap-4">{volver}<EmptyState icono={WifiOff} titulo="No pudimos cargar este modelo" texto="Revisá tu conexión e intentá de nuevo." /></div>
  if (!producto) return <div className="flex flex-col gap-4">{volver}<EmptyState icono={SearchX} titulo="Este modelo ya no está disponible" texto="Volvé al catálogo para ver los demás." /></div>

  const wa = enlaceWhatsApp(ajustes?.whatsapp_tienda, `Hola, quiero consultar por el modelo ${producto.codigo} - ${producto.nombre}`)

  return (
    <article className="flex flex-col gap-6">
      {volver}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-superficie">
            {fotos[actual] ? (
              <img src={fotos[actual]} alt={`${producto.nombre}, foto ${actual + 1}`} width="900" height="1200" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-sm text-texto-suave">Sin foto</span>
            )}
          </div>
          {fotos.length > 1 && (
            <ul className="flex gap-2 overflow-x-auto" aria-label="Fotos del modelo">
              {fotos.map((f, i) => (
                <li key={f}>
                  <button type="button" onClick={() => setActual(i)} aria-label={`Ver foto ${i + 1}`} aria-current={i === actual} className={`block size-16 overflow-hidden rounded-xl bg-superficie ${i === actual ? 'ring-2 ring-tinta' : ''}`}>
                    <img src={f} alt="" loading="lazy" width="64" height="64" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-texto-suave">{producto.codigo}{producto.categoria ? ` · ${producto.categoria}` : ''}</p>
            <h1 className="text-3xl tracking-tight md:text-4xl">{producto.nombre}</h1>
          </div>
          {producto.descripcion && <p className="whitespace-pre-line text-texto-suave">{producto.descripcion}</p>}
          <PrecioBloque producto={producto} ajustes={ajustes} />
          <p className="text-sm text-texto-suave">Se vende por docena o media docena.</p>
          <div className="flex flex-wrap items-center gap-3">
            {[0.5, 1].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  guardarCarrito(agregarLinea(carrito, producto, c))
                  setAgregado(c)
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-pildora bg-tinta px-5 text-sm font-medium text-sobre-tinta"
              >
                Agregar {c === 1 ? '1 docena' : 'media docena'}
              </button>
            ))}
          </div>
          {agregado !== null && (
            <p role="status" className="text-sm">
              Agregado al pedido. <Link to={RUTA_PEDIDO} className="font-medium underline">Ver mi pedido</Link>
            </p>
          )}
          {wa && (
            <a href={wa} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-pildora bg-whatsapp px-6 font-medium text-sobre-tinta shadow-boton hover:brightness-95">
              <MessageCircle size={18} strokeWidth={1.75} aria-hidden /> Consultar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
