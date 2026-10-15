import { useEffect } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BotonLink, Button, EmptyState, ErrorState, Skeleton, useToast } from '../../components/ui/index.js'
import { useSitio } from '../../data/hooks.js'
import { lineasConProblema } from '../../lib/carrito.js'
import { formatear } from '../../lib/moneda.js'
import PrecioDoble from '../catalogo/PrecioDoble.jsx'
import AvisoCambio from './AvisoCambio.jsx'
import LineaCarrito from './LineaCarrito.jsx'
import { useCarrito } from './useCarrito.js'
import { useSoloNoIndex } from '../../lib/seo.js'

// Carrito: líneas editables arriba, resumen y un solo botón primario abajo. El envío se calcula al finalizar.
export default function CarritoPage() {
  useSoloNoIndex()
  const { lineas, totales, cargando, error, reintentar, cantidad, quitar } = useCarrito()
  const sitio = useSitio()
  const avisar = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    document.title = 'Carrito · Modas Naty'
  }, [])

  if (cargando) return <div className="flex flex-col gap-3" role="status" aria-label="Cargando carrito"><Skeleton className="h-9 w-40" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
  if (error) return <ErrorState mensaje="No pudimos cargar el carrito." onReintentar={reintentar} />
  if (lineas.length === 0) {
    return <EmptyState icono={ShoppingBag} titulo="Tu carrito está vacío" texto="Elegí un modelo del catálogo y agregalo acá." accion={<BotonLink to="/catalogo">Ver catálogo</BotonLink>} />
  }

  const minimo = sitio.datos?.compra_minima_cent ?? 0
  const problemas = lineasConProblema(lineas).filter((l) => l.problema !== 'cantidad_mayor')
  const faltaMinimo = minimo > 0 && totales.subtotal_cent < minimo
  const puedeSeguir = problemas.length === 0 && !faltaMinimo && totales.unidades > 0

  const alQuitar = async (l) => {
    await quitar(l.key)
    avisar(`${l.producto?.nombre ?? 'Artículo'} quitado del carrito`, 'info')
  }

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[1fr_20rem] md:items-start md:gap-10">
      <div className="flex flex-col gap-2 md:col-span-2">
        <h1 className="text-3xl md:text-4xl">Tu carrito</h1>
        <p className="text-texto-suave">{totales.unidades} {totales.unidades === 1 ? 'unidad' : 'unidades'}</p>
      </div>
      <AvisoCambio className="md:col-span-2" recordatorio />
      <ul className="rounded-tarjeta bg-superficie px-4">
        {lineas.map((l) => <LineaCarrito key={l.key} linea={l} onCantidad={(linea, n) => cantidad(linea.key, n)} onQuitar={alQuitar} />)}
      </ul>
      <aside className="sticky bottom-0 flex flex-col gap-3 rounded-tarjeta bg-superficie p-4 md:static">
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between"><dt className="text-texto-suave">Subtotal</dt><dd><PrecioDoble bsCent={totales.subtotal_cent} apilado className="items-end" /></dd></div>
          <div className="flex justify-between"><dt className="text-texto-suave">Envío</dt><dd className="text-texto-suave">se calcula al finalizar</dd></div>
          <div className="flex justify-between border-t border-borde pt-2 text-base"><dt className="font-medium">Total</dt><dd className="font-medium"><PrecioDoble bsCent={totales.subtotal_cent} apilado className="items-end" /></dd></div>
        </dl>
        {problemas.length > 0 && <p role="alert" className="text-sm text-alerta">Quitá los artículos que ya no están disponibles para continuar.</p>}
        {faltaMinimo && <p role="alert" className="text-sm text-alerta">La compra mínima es {formatear(minimo)}.</p>}
        <Button ancho deshabilitado={!puedeSeguir} onClick={() => navigate('/checkout')} className="min-h-12">Finalizar compra</Button>
        <Link to="/catalogo" className="text-center text-sm underline underline-offset-4">Seguir comprando</Link>
      </aside>
    </div>
  )
}
