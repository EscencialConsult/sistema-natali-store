import { useEffect } from 'react'
import { ErrorState, Skeleton } from '../../components/ui/index.js'
import { useSitio } from '../../data/hooks.js'
import EncabezadoPagina from './EncabezadoPagina.jsx'

// Bloques de texto e imagen editables desde el panel (sitio.quienes_somos).
export default function QuienesSomosPage() {
  const sitio = useSitio()
  useEffect(() => {
    document.title = 'Quiénes somos · Modas Naty'
  }, [])
  if (sitio.cargando) return <div className="flex flex-col gap-3" role="status" aria-label="Cargando"><Skeleton className="h-9 w-64" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
  if (sitio.error) return <ErrorState mensaje="No pudimos cargar esta página." onReintentar={sitio.reintentar} />
  const bloques = sitio.datos.quienes_somos
  const imagenes = bloques.filter((b) => b.tipo === 'imagen')
  const texto = bloques.filter((b) => b.tipo !== 'imagen')
  return (
    <article className="flex flex-col gap-8">
      <EncabezadoPagina titulo="Quiénes somos" />
      {/* Texto con medida de lectura a la izquierda; si hay fotos van a la derecha y, si no, el texto no se estira. */}
      <div className={imagenes.length ? 'grid gap-10 md:grid-cols-2 md:items-start' : 'max-w-2xl'}>
        <div className="flex max-w-2xl flex-col gap-5">
          {texto.length === 0 && <p className="text-texto-suave">Muy pronto vas a poder leer nuestra historia acá.</p>}
          {texto.map((b, i) => (b.tipo === 'titulo'
            ? <h2 key={i} className="text-2xl">{b.texto}</h2>
            : <p key={i} className="text-base leading-relaxed text-texto-suave">{b.texto}</p>))}
        </div>
        {imagenes.length > 0 && (
          <div className="flex flex-col gap-4">
            {imagenes.map((b, i) => <img key={i} src={b.ruta} alt={b.texto} loading="lazy" className="w-full rounded-tarjeta" />)}
          </div>
        )}
      </div>
      {sitio.datos.provisorio && <p className="max-w-2xl rounded-control bg-alerta-fondo p-3 text-sm text-alerta">Texto provisorio: se reemplaza con el de Natali desde el panel.</p>}
    </article>
  )
}
