import { useMemo } from 'react'
import { useProductos, useSitio } from '../../data/hooks.js'
import { useSeo } from '../../lib/seo.js'
import Categorias from './inicio/Categorias.jsx'
import ComoComprar from './inicio/ComoComprar.jsx'
import FilaProductos from './inicio/FilaProductos.jsx'
import Local from './inicio/Local.jsx'
import Portada from './inicio/Portada.jsx'

// Portada de la tienda. Todo el contenido editable sale de repos.sitio; los productos, del catálogo publicado.
export default function InicioPage() {
  const sitio = useSitio()
  const prods = useProductos()

  const publicados = useMemo(() => (prods.datos ?? []).filter((p) => p.publicado_tienda && Number.isInteger(p.precio_unidad_bs_cent)), [prods.datos])
  const nuevos = useMemo(() => publicados.filter((p) => p.nuevo).slice(0, 8), [publicados])
  const destacados = useMemo(() => publicados.filter((p) => p.destacado).slice(0, 8), [publicados])
  const imagenPortada = sitio.datos?.portada.imagen || destacados[0]?.fotos[0]?.ruta || nuevos[0]?.fotos[0]?.ruta || ''
  useSeo({ titulo: 'Tienda online', descripcion: sitio.datos ? `${sitio.datos.portada.titulo}. ${sitio.datos.portada.bajada}` : 'Tienda online de Modas Naty: ropa femenina, catálogo y compra en línea.', imagen: imagenPortada })

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <Portada sitio={sitio.datos} imagen={imagenPortada} cargando={sitio.cargando} />
      <Categorias productos={publicados} cargando={prods.cargando} />
      <FilaProductos titulo="Nuevos ingresos" productos={nuevos} cargando={prods.cargando} error={prods.error} reintentar={prods.reintentar} verTodo="/catalogo" />
      <FilaProductos titulo="Destacados" productos={destacados} cargando={prods.cargando} />
      <ComoComprar pasos={sitio.datos?.como_comprar} />
      <Local sitio={sitio.datos} />
    </div>
  )
}
