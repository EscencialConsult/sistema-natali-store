import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogoCompleto } from '../data/catalogo.js'
import { supabaseUrl } from '../data/clientePublico.js'
import { useAjustesTienda } from '../contexto.js'
import { contarPorCategoria, textoModelos } from '../lib/catalogo.js'
import { fotosDe } from '../lib/fotos.js'
import PrecioBloque from './PrecioBloque.jsx'
import { Hoja } from './Decoraciones.jsx'
import { RUTA_AYUDA, RUTA_CATALOGO, rutaCategoria, rutaProducto } from '../rutas.js'
import { useVolverArriba } from './useVolverArriba.js'

const primeraFoto = (p) => (p ? fotosDe(p, supabaseUrl)[0] : undefined)

// Portada de la referencia: "Nueva temporada", un modelo destacado y las categorías con una foto de cada una.
export default function HomePage() {
  useVolverArriba()
  const { ajustes } = useAjustesTienda()
  const { items } = useCatalogoCompleto()

  const conFoto = useMemo(() => (items ?? []).filter((p) => primeraFoto(p)), [items])
  const destacado = conFoto.find((p) => p.nuevo) ?? conFoto[0]
  const categorias = useMemo(
    () => contarPorCategoria(items ?? []).map((k) => ({ ...k, foto: primeraFoto(conFoto.find((p) => p.categoria_id === k.id)) })),
    [items, conFoto],
  )

  return (
    <div className="flex flex-col gap-12">
      {/* Un solo panel contiene texto, formas y foto: lo que sobresale lo recorta el panel y nada queda cortado por una capa ajena. */}
      <section aria-labelledby="titulo-inicio" className="relative isolate overflow-hidden rounded-[2rem] bg-(--t-vino) text-white">
        <div className="grid items-center gap-8 px-6 py-12 md:grid-cols-[1.15fr_1fr] md:gap-6 md:px-14 md:py-16">
          <div className="relative z-10 flex flex-col items-start gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Catálogo mayorista</p>
            <h1 id="titulo-inicio" className="font-titulo text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">Nueva temporada</h1>
            <p className="max-w-md text-lg text-white/85">Elegí tu modelo, armá tu pedido y coordiná el pago y la entrega con tu vendedor.</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center rounded-lg bg-(--t-crema) px-7 text-sm font-semibold text-(--t-vino) hover:bg-white">
                Ver catálogo
              </Link>
              <Link to={RUTA_AYUDA} className="inline-flex min-h-11 items-center text-sm font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">
                Cómo comprar
              </Link>
            </div>
          </div>

          <div className="relative grid place-items-center py-4 md:py-0">
            <span aria-hidden="true" className="t-decor absolute size-72 rounded-full bg-(--t-rosa) md:size-[26rem]" />
            <Hoja className="t-decor absolute left-[8%] top-0 hidden w-10 rotate-[24deg] md:block" />
            <Hoja className="t-decor absolute bottom-2 right-[6%] hidden w-12 -rotate-[20deg] md:block" color="var(--t-coral)" />
            {destacado && (
              <Link to={rutaProducto(destacado.id)} className="group relative w-56 max-w-full md:w-64">
                <article className="t-tarjeta-foto overflow-hidden rounded-3xl bg-(--t-crema) text-(--t-tinta)">
                  <img src={primeraFoto(destacado)} alt={destacado.nombre} width="600" height="800" className="aspect-[3/4] w-full object-cover" />
                  <div className="flex flex-col gap-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--t-vino)">{destacado.nuevo ? 'Nuevo' : 'Destacado'}</p>
                    <h2 className="line-clamp-2 text-base font-semibold leading-snug">{destacado.nombre}</h2>
                    <PrecioBloque producto={destacado} ajustes={ajustes} compacto />
                    <p className="t-suave text-xs">Consultá disponibilidad con tu vendedor</p>
                  </div>
                </article>
              </Link>
            )}
          </div>
        </div>
      </section>

      {categorias.length > 0 && (
        <section aria-labelledby="titulo-categorias" className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <h2 id="titulo-categorias" className="font-titulo text-2xl font-semibold tracking-tight md:text-3xl">Categorías</h2>
          <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
            {categorias.map((k) => (
              <li key={k.id} className="w-40 shrink-0 snap-start sm:w-44">
                <Link to={rutaCategoria(k.id)} className="group flex flex-col gap-2">
                  <span className="t-tarjeta-foto block aspect-[3/4] overflow-hidden rounded-2xl bg-(--t-beige)/60">
                    {k.foto && <img src={k.foto} alt="" loading="lazy" decoding="async" width="352" height="470" className="size-full object-cover" />}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wide">{k.nombre}</span>
                  <span className="t-suave -mt-1.5 text-xs">{textoModelos(k.cantidad)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
