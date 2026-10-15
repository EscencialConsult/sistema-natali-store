import { umbralStockBajo } from '../../../lib/stock.js'
import { useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, ErrorState, Skeleton } from '../../../components/ui/index.js'
import { useCategorias, useConfig, useProductoPorSlug, useSitio, useStockPorColor } from '../../../data/hooks.js'
import { cn } from '../../../lib/cn.js'
import { formatear } from '../../../lib/moneda.js'
import { jsonldProducto, useSeo } from '../../../lib/seo.js'
import { slugDe } from '../../../lib/slug.js'
import NoEncontradaSitio from '../../sitio/NoEncontradaSitio.jsx'
import ColoresChips from '../ColoresChips.jsx'
import Galeria from '../Galeria.jsx'
import Precio from '../Precio.jsx'
import BotonAgregar from './BotonAgregar.jsx'
import BotonCompartir from './BotonCompartir.jsx'
import BotonConsultar from './BotonConsultar.jsx'
import Relacionados from './Relacionados.jsx'
import SelectorCantidad from './SelectorCantidad.jsx'

// Ficha de tienda: página con URL propia (compartible). Elegir color y cantidad es un gesto; un solo botón primario.
export default function ProductoPage() {
  const { slug } = useParams()
  const prod = useProductoPorSlug(slug)
  const p = prod.datos
  const stock = useStockPorColor(p?.id)
  const cfg = useConfig()
  const sitio = useSitio()
  const cats = useCategorias()
  const [colorId, setColorId] = useState(null)
  const [cantidadElegida, setCantidad] = useState(1)
  const [verMas, setVerMas] = useState(false)
  // Cambiar de modelo reinicia la selección (ajuste durante el render, sin efecto).
  const [slugPrevio, setSlugPrevio] = useState(slug)
  if (slugPrevio !== slug) {
    setSlugPrevio(slug)
    setColorId(null)
    setCantidad(1)
    setVerMas(false)
  }

  const publicado = p && p.activo && p.publicado_tienda && Number.isInteger(p.precio_unidad_bs_cent)
  const umbral = umbralStockBajo(cfg.datos)
  // Con un solo color no hay nada que elegir: queda seleccionado (el color es un dato del producto).
  const idEfectivo = colorId ?? (p?.colores.length === 1 ? p.colores[0].id : null)
  const color = useMemo(() => p?.colores.find((c) => c.id === idEfectivo) ?? null, [p, idEfectivo])
  const disponible = color ? (stock.datos?.[color.id] ?? 0) : 0
  // La cantidad nunca supera el disponible del color elegido: se deriva, no se corrige con un efecto.
  const cantidad = color && disponible > 0 ? Math.min(cantidadElegida, disponible) : cantidadElegida
  const sinStock = !!p && p.colores.length > 0 && !!stock.datos && p.colores.every((c) => (stock.datos[c.id] ?? 0) <= 0)
  const categoria = cats.datos?.find((c) => c.id === p?.categoria_id)

  const jsonld = useMemo(() => (publicado ? jsonldProducto(p, { disponible: !sinStock, url: `${window.location.origin}/p/${p.slug}` }) : null), [p, publicado, sinStock])
  useSeo({
    titulo: publicado ? p.nombre : 'Producto',
    descripcion: publicado ? `${p.nombre} a ${formatear(p.precio_unidad_bs_cent)}. ${p.descripcion.slice(0, 140)}` : undefined,
    imagen: publicado ? p.fotos[0]?.ruta : undefined,
    noindex: !publicado,
    jsonld,
    tipo: 'product',
  })

  if (prod.cargando || cfg.cargando) {
    return (
      <div className="grid gap-6 md:grid-cols-2" role="status" aria-label="Cargando producto">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="flex flex-col gap-3"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-7 w-1/3" /><Skeleton className="h-24" /></div>
      </div>
    )
  }
  if (prod.error) return <ErrorState mensaje="No pudimos cargar este modelo." onReintentar={prod.reintentar} />
  if (!publicado) return <NoEncontradaSitio />

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Volver" className="-mb-4">
        <Link to={categoria ? `/catalogo/${slugDe(categoria.nombre)}` : '/catalogo'} className="inline-flex min-h-11 items-center gap-1 text-sm text-texto-suave hover:text-texto">
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> {categoria ? categoria.nombre : 'Catálogo'}
        </Link>
      </nav>

      <article className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Galeria fotos={p.fotos} nombre={p.nombre} />
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {p.nuevo && <span className="text-xs font-semibold uppercase tracking-wider text-tinta">Nuevo</span>}
              {sinStock && <Badge tono="error">Sin stock</Badge>}
              <span className="text-xs tabular-nums text-texto-tenue">{p.codigo}</span>
            </div>
            <h1 className="text-3xl md:text-4xl">{p.nombre}</h1>
            <Precio bsCent={p.precio_unidad_bs_cent} mostrarUsd={!!sitio.datos?.mostrar_usd} className="text-2xl" />
          </header>

          <section aria-labelledby="colores-titulo" className="flex flex-col gap-2">
            <h2 id="colores-titulo" className="text-base">Color {color ? <span className="font-normal text-texto-suave">· {color.nombre}</span> : <span className="font-normal text-texto-suave">· elegí uno</span>}</h2>
            <ColoresChips colores={p.colores} stock={stock.datos ?? {}} umbral={umbral} seleccionado={idEfectivo} onSelect={setColorId} publico />
          </section>

          <section aria-label="Cantidad" className="flex items-center gap-3">
            <SelectorCantidad valor={cantidad} onChange={setCantidad} maximo={color ? Math.max(1, disponible) : 999} />
            {color && disponible > 0 && disponible <= umbral && <p className="text-sm text-alerta">Quedan {disponible}</p>}
          </section>

          <BotonAgregar producto={p} color={color} cantidad={cantidad} disponible={disponible} />
          <div className="flex flex-wrap gap-2">
            <BotonConsultar producto={p} color={color} />
            <BotonCompartir titulo={p.nombre} texto={`${p.nombre} · ${formatear(p.precio_unidad_bs_cent)}`} />
          </div>

          {p.descripcion && (
            <section aria-labelledby="descripcion-titulo" className="flex flex-col gap-1 border-t border-borde pt-4">
              <h2 id="descripcion-titulo" className="text-base">Descripción</h2>
              <p className={cn('text-sm leading-relaxed text-texto-suave', !verMas && 'line-clamp-3')}>{p.descripcion}</p>
              {p.descripcion.length > 140 && (
                <button type="button" onClick={() => setVerMas(!verMas)} aria-expanded={verMas} className="min-h-11 self-start text-sm font-medium underline underline-offset-4">
                  {verMas ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </section>
          )}
        </div>
      </article>

      <Relacionados producto={p} />
    </div>
  )
}
