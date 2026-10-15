import { useEffect, useMemo, useRef, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { BotonLink, Button, EmptyState, ErrorState, Select, Skeleton } from '../../../components/ui/index.js'
import { useCategorias, useProductosTienda, useStockResumen } from '../../../data/hooks.js'
import { categoriasConProductos, filtrarCatalogo } from '../../../lib/catalogo.js'
import { useSeo } from '../../../lib/seo.js'
import { slugDe } from '../../../lib/slug.js'
import ProductoCard from '../ProductoCard.jsx'
import EncabezadoPagina from '../../sitio/EncabezadoPagina.jsx'
import FiltrosCatalogo from './FiltrosCatalogo.jsx'
import { ORDENES } from './ordenes.js'
import { tandasGuardadas, useScrollConservado } from './useScrollConservado.js'

const TANDA = 24

// Catálogo público: /catalogo y /catalogo/:categoria, búsqueda en ?q=. Cada combinación tiene URL compartible.
export default function CatalogoPage() {
  const { categoria: slugCat } = useParams()
  const [params, setParams] = useSearchParams()
  const texto = params.get('q') ?? ''
  const [orden, setOrden] = useState('novedad')
  const { key } = useLocation()
  const [visibles, setVisibles] = useState(() => tandasGuardadas(key) ?? TANDA)
  const centinela = useRef(null)

  const cats = useCategorias()
  const categoriaActiva = useMemo(() => cats.datos?.find((c) => slugDe(c.nombre) === slugCat) ?? null, [cats.datos, slugCat])
  const categoriaInvalida = !!slugCat && cats.datos && !categoriaActiva
  // Una sola lectura del catálogo publicado: resultados y categorías se derivan de la misma base.
  const prods = useProductosTienda({})
  const lista = useMemo(() => filtrarCatalogo(prods.datos ?? [], { categoria_id: categoriaActiva?.id, texto, orden }), [prods.datos, categoriaActiva?.id, texto, orden])
  const stock = useStockResumen()
  useScrollConservado(!!prods.datos && !!cats.datos, visibles)

  useSeo({
    titulo: categoriaActiva ? categoriaActiva.nombre : 'Catálogo',
    descripcion: categoriaActiva ? `${categoriaActiva.nombre}: modelos de ropa femenina de Modas Naty. Elegí color y comprá en línea.` : 'Catálogo de Modas Naty: blusas, faldas, conjuntos y más. Elegí tu modelo y comprá en línea.',
    noindex: !!texto,
  })

  // Al cambiar filtro, orden o búsqueda se vuelve a la primera tanda (ajuste durante el render, sin efecto).
  const claveFiltro = `${slugCat ?? ''}|${texto}|${orden}`
  const [filtroPrevio, setFiltroPrevio] = useState(claveFiltro)
  if (filtroPrevio !== claveFiltro) {
    setFiltroPrevio(claveFiltro)
    setVisibles(TANDA)
  }

  useEffect(() => {
    const el = centinela.current
    if (!el) return
    const obs = new IntersectionObserver((e) => e[0].isIntersecting && setVisibles((v) => v + TANDA), { rootMargin: '400px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [lista.length, visibles])

  const cambiarTexto = (t) => {
    const siguiente = new URLSearchParams(params)
    if (t.trim()) siguiente.set('q', t)
    else siguiente.delete('q')
    setParams(siguiente, { replace: true })
  }

  const categoriasVisibles = useMemo(() => categoriasConProductos(cats.datos ?? [], prods.datos ?? []), [cats.datos, prods.datos])
  const cuentas = useMemo(() => {
    const m = {}
    for (const p of filtrarCatalogo(prods.datos ?? [])) m[p.categoria_id] = (m[p.categoria_id] ?? 0) + 1
    return m
  }, [prods.datos])
  const totalModelos = useMemo(() => filtrarCatalogo(prods.datos ?? []).length, [prods.datos])

  const agotado = (p) => p.colores.length > 0 && stock.datos && p.colores.every((c) => (stock.datos[c.id] ?? 0) <= 0)

  if (categoriaInvalida) {
    return <EmptyState icono={PackageSearch} titulo="Esa categoría no existe" accion={<BotonLink to="/catalogo" variante="secundario">Ver todo el catálogo</BotonLink>} />
  }

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[14rem_1fr] md:gap-8">
      <EncabezadoPagina titulo={categoriaActiva ? categoriaActiva.nombre : 'Catálogo'} bajada="Elegí un modelo para ver sus fotos, colores y comprarlo." className="md:col-span-2" />
      <aside className="contents md:block">
        <FiltrosCatalogo categorias={categoriasVisibles} cuentas={cuentas} total={prods.datos ? totalModelos : null} categoriaActiva={categoriaActiva} texto={texto} onTexto={cambiarTexto} conQuery />
      </aside>
      <section aria-label="Modelos" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-texto-suave" aria-live="polite">{prods.datos ? `${lista.length} ${lista.length === 1 ? 'modelo' : 'modelos'}${texto ? ` para “${texto}”` : ''}` : ''}</p>
          <Select ariaLabel="Ordenar modelos" opciones={ORDENES} valor={orden} onChange={setOrden} className="w-44 shrink-0" />
        </div>
        {prods.cargando && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="status" aria-label="Cargando catálogo">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
          </div>
        )}
        {prods.error && <ErrorState mensaje="No pudimos cargar el catálogo." onReintentar={prods.reintentar} />}
        {prods.datos && lista.length === 0 && (
          <EmptyState
            icono={PackageSearch}
            titulo={texto ? `No encontramos “${texto}”` : 'Todavía no hay modelos acá'}
            texto={texto ? 'Probá con otro nombre o con parte del código.' : 'Mirá las otras categorías o volvé más tarde.'}
            accion={texto ? <Button variante="secundario" onClick={() => cambiarTexto('')}>Ver todo</Button> : null}
          />
        )}
        {lista.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
            {lista.slice(0, visibles).map((p, i) => (
              <li key={p.id}>
                <ProductoCard producto={p} modo="tienda" agotado={agotado(p)} prioridad={i < 4} />
              </li>
            ))}
          </ul>
        )}
        {visibles < lista.length && <div ref={centinela} className="h-10" aria-hidden />}
      </section>
    </div>
  )
}
