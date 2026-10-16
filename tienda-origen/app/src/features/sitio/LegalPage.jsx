import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState, Skeleton } from '../../components/ui/index.js'
import { useSitio } from '../../data/hooks.js'
import NoEncontradaSitio from './NoEncontradaSitio.jsx'

const PAGINAS = {
  terminos: { titulo: 'Términos de compra', clave: 'terminos' },
  'envios-y-cambios': { titulo: 'Envíos y cambios', clave: 'envios_y_cambios' },
  privacidad: { titulo: 'Política de privacidad', clave: 'privacidad' },
}

// Textos legales editables desde el panel. Mientras sean borrador, lo dicen.
export default function LegalPage() {
  const { slug } = useParams()
  const pagina = PAGINAS[slug]
  const sitio = useSitio()
  useEffect(() => {
    if (pagina) document.title = `${pagina.titulo} · Modas Naty`
  }, [pagina])
  if (!pagina) return <NoEncontradaSitio />
  if (sitio.cargando) return <div className="flex flex-col gap-3" role="status" aria-label="Cargando"><Skeleton className="h-9 w-64" /><Skeleton className="h-40" /></div>
  if (sitio.error) return <ErrorState mensaje="No pudimos cargar esta página." onReintentar={sitio.reintentar} />
  const texto = sitio.datos.legales[pagina.clave] || ''
  const borrador = /^BORRADOR/i.test(texto)
  return (
    <article className="flex max-w-2xl flex-col gap-5">
      <h1 className="text-3xl md:text-4xl">{pagina.titulo}</h1>
      {borrador && <p className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">Borrador: este texto se revisa con Natali antes de publicar.</p>}
      {texto
        .replace(/^BORRADOR[^.]*\.\s*/i, '')
        .split(/\n+/)
        .filter(Boolean)
        .map((p, i) => <p key={i} className="text-base leading-relaxed text-texto-suave">{p}</p>)}
    </article>
  )
}
