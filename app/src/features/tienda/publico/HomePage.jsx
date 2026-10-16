import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCatalogoCompleto, useConfigTienda } from '../data/catalogo.js'
import { supabaseUrl } from '../data/clientePublico.js'
import { useAjustesTienda } from '../contexto.js'
import { contarPorCategoria, textoModelos } from '../lib/catalogo.js'
import { fotosDe } from '../lib/fotos.js'
import { textosDe } from '../lib/textos.js'
import PrecioBloque from './PrecioBloque.jsx'
import { RUTA_CATALOGO, rutaCategoria, rutaProducto } from '../rutas.js'
import { useVolverArriba } from './useVolverArriba.js'

const primeraFoto = (p) => (p ? fotosDe(p, supabaseUrl)[0] : undefined)

// Portada de la referencia: "Nueva temporada" sobre crema, con las formas orgánicas sueltas a todo el ancho (capa DecorInicio,
// en TiendaApp), un modelo destacado dentro de la mancha rosa y las categorías con una foto de cada una.
export default function HomePage() {
  useVolverArriba()
  const { ajustes } = useAjustesTienda()
  const { items } = useCatalogoCompleto()
  const t = textosDe(useConfigTienda().datos)

  const conFoto = useMemo(() => (items ?? []).filter((p) => primeraFoto(p)), [items])
  const destacado = conFoto.find((p) => p.nuevo) ?? conFoto[0]
  const categorias = useMemo(
    () => contarPorCategoria(items ?? []).map((k) => ({ ...k, foto: primeraFoto(conFoto.find((p) => p.categoria_id === k.id)) })),
    [items, conFoto],
  )

  return (
    <div className="flex flex-col gap-14">
      <section aria-labelledby="titulo-inicio" className="relative pb-6 pt-10 md:pb-10 md:pt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <h1 id="titulo-inicio" className="font-titulo text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">{t('inicio.titulo')}</h1>
            <p className="max-w-md text-lg">{t('inicio.bajada')}</p>
            <Link to={RUTA_CATALOGO} className="inline-flex min-h-12 items-center rounded-lg bg-(--t-vino) px-7 text-sm font-medium text-white shadow-sm hover:bg-(--t-vino-oscuro)">
              {t('inicio.boton')}
            </Link>
          </div>

          {destacado && (
            <Link to={rutaProducto(destacado.id)} className="group mx-auto w-full max-w-64 justify-self-center md:justify-self-end">
              <article className="t-tarjeta-foto overflow-hidden rounded-3xl bg-(--t-crema) shadow-xl shadow-(--t-vino)/15 ring-1 ring-(--t-beige)">
                <img src={primeraFoto(destacado)} alt={destacado.nombre} width="600" height="800" className="aspect-[3/4] w-full object-cover" />
                <div className="flex flex-col gap-1 bg-(--t-rosa) p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-(--t-vino)">{destacado.nuevo ? 'Nuevo' : 'Destacado'}</p>
                  <h2 className="line-clamp-2 text-base font-semibold leading-snug">{destacado.nombre}</h2>
                  <PrecioBloque producto={destacado} ajustes={ajustes} compacto />
                  <p className="text-xs">Consultá disponibilidad con tu vendedor</p>
                </div>
              </article>
            </Link>
          )}
        </div>
      </section>

      {categorias.length > 0 && (
        <section aria-labelledby="titulo-categorias" className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <h2 id="titulo-categorias" className="font-titulo text-2xl font-semibold tracking-tight md:text-3xl">{t('inicio.categorias')}</h2>
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
