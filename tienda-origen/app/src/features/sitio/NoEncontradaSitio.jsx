import { useEffect, useState } from 'react'
import { Compass, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/index.js'

// 404 del sitio: ofrece buscar en el catálogo en vez de dejar a la persona en una pared.
export default function NoEncontradaSitio() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  useEffect(() => {
    document.title = 'Página no encontrada · Modas Naty'
  }, [])
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-12 text-center">
      <Compass size={36} strokeWidth={1.5} aria-hidden className="text-texto-tenue" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl">No encontramos esa página</h1>
        <p className="text-sm text-texto-suave">Puede que el enlace esté mal o que el modelo ya no esté en la tienda.</p>
      </div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(q.trim() ? `/catalogo?q=${encodeURIComponent(q.trim())}` : '/catalogo')
        }}
        className="flex w-full gap-2"
      >
        <label htmlFor="q404" className="sr-only">Buscar en el catálogo</label>
        <input id="q404" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un modelo" className="min-h-11 flex-1 rounded-control border border-borde-fuerte bg-superficie px-3 text-base" />
        <Button type="submit" icono={Search} aria-label="Buscar" />
      </form>
      <Link to="/" className="text-sm underline underline-offset-4">Ir al inicio</Link>
    </div>
  )
}
