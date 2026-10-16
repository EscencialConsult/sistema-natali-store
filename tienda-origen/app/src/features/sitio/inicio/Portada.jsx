import { BotonLink, Skeleton } from '../../../components/ui/index.js'

// Título y un solo botón primario (regla "Un acento para comprar"), con la foto al lado y sin marco ni caja.
// La foto es un flyer con texto propio: no se le superpone nada ni se recorta de más.
export default function Portada({ sitio, imagen, cargando }) {
  if (cargando) return <Skeleton className="aspect-[4/5] w-full md:aspect-[21/9]" />
  return (
    <section aria-labelledby="portada-titulo" className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div className="order-2 flex flex-col gap-5 md:order-1">
        <h1 id="portada-titulo" className="text-4xl leading-tight md:text-6xl">{sitio?.portada.titulo}</h1>
        <p className="max-w-md text-base text-texto-suave md:text-lg">{sitio?.portada.bajada}</p>
        <BotonLink to="/catalogo" className="min-h-12 self-start px-6">Ver catálogo</BotonLink>
      </div>
      <div className="order-1 md:order-2">
        {imagen ? (
          <img src={imagen} alt="" fetchPriority="high" decoding="async" className="max-h-[34rem] w-full rounded-tarjeta bg-superficie-2 object-contain" />
        ) : (
          <div aria-hidden className="aspect-[4/5] max-h-[34rem] w-full rounded-tarjeta bg-superficie-2" />
        )}
      </div>
    </section>
  )
}
