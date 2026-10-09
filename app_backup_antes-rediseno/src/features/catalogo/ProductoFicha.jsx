import { useState } from 'react'
import { ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, ErrorState, Skeleton } from '../../components/ui/index.js'
import { useConfig, useProducto, useStockPorColor } from '../../data/hooks.js'
import { cn } from '../../lib/cn.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import ColoresChips from './ColoresChips.jsx'
import Galeria from './Galeria.jsx'
import Precio from './Precio.jsx'

// Ficha completa de un producto. publico=true oculta precio de lista (según config), stock y "Agregar a venta".
export default function ProductoFicha({ productoId, publico = false, compacta = false }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const prod = useProducto(productoId)
  const stock = useStockPorColor(productoId)
  const cfg = useConfig()
  const [verMas, setVerMas] = useState(false)

  if (prod.cargando || cfg.cargando) {
    return (
      <div className="flex flex-col gap-3" role="status" aria-label="Cargando producto">
        <Skeleton className="aspect-[3/4] w-full" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    )
  }
  if (prod.error) return <ErrorState mensaje="No pudimos cargar este producto." onReintentar={prod.reintentar} />
  const p = prod.datos
  if (!p) return <ErrorState mensaje="Ese producto ya no existe." />

  const mostrarPrecio = !publico || cfg.datos?.mostrar_precios_publico
  const puedeVender = !publico && puede(usuario?.rol, 'venta.crear')
  const umbral = cfg.datos?.stock_bajo_unidades ?? 24
  const sinStock = !publico && p.colores.length > 0 && p.colores.every((c) => (stock.datos?.[c.id] ?? 0) <= 0)

  return (
    <article className={cn('grid gap-5', compacta ? 'sm:grid-cols-[minmax(0,14rem)_1fr]' : 'md:grid-cols-2')}>
      <Galeria fotos={p.fotos} nombre={p.nombre} />
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-control bg-tinta px-2.5 py-1 font-titulo text-lg font-semibold tabular-nums text-sobre-tinta">{p.codigo}</span>
            {p.nuevo && <Badge tono="info">Nuevo</Badge>}
            {sinStock && <Badge tono="error">Sin stock</Badge>}
          </div>
          <h2 className="text-2xl md:text-3xl">{p.nombre}</h2>
          {mostrarPrecio && <Precio usdCent={p.precio_docena_usd_cent} equivalentes={!publico} className="text-lg" />}
        </header>

        <section aria-label="Colores disponibles" className="flex flex-col gap-2">
          <h3 className="text-base">Colores</h3>
          <ColoresChips colores={p.colores} stock={publico ? null : (stock.datos ?? {})} umbral={umbral} />
        </section>

        {p.descripcion && (
          <section aria-label="Descripción">
            <p className={cn('text-sm text-texto-suave', !verMas && 'line-clamp-3')}>{p.descripcion}</p>
            {p.descripcion.length > 140 && (
              <button type="button" onClick={() => setVerMas(!verMas)} className="min-h-11 text-sm font-medium underline">
                {verMas ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </section>
        )}

        {puedeVender && (
          <Button icono={ReceiptText} ancho onClick={() => navigate('/venta', { state: { productoId: p.id } })}>
            Agregar a venta
          </Button>
        )}
      </div>
    </article>
  )
}
