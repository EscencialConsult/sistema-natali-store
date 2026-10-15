import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, ErrorState, Input, Skeleton, useToast } from '../../../components/ui/index.js'
import { useCategorias, useProductos } from '../../../data/hooks.js'
import { categorias } from '../../../data/repos/index.js'

// Categorías del catálogo compartido: alta, renombrar y orden (el orden es el de los chips del sitio).
export default function CategoriasPage() {
  const avisar = useToast()
  const cats = useCategorias()
  const prods = useProductos({ soloActivos: false })
  const [nueva, setNueva] = useState('')
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')
  useEffect(() => {
    document.title = 'Categorías · Administración · Modas Naty'
  }, [])
  if (cats.cargando || prods.cargando) return <Skeleton className="h-64" />
  if (cats.error) return <ErrorState mensaje="No pudimos cargar las categorías." onReintentar={cats.reintentar} />
  const cuantos = (id) => (prods.datos ?? []).filter((p) => p.categoria_id === id).length
  const lista = cats.datos

  const intentar = async (fn, mensaje) => {
    try {
      await fn()
      if (mensaje) avisar(mensaje, 'exito')
    } catch (e) {
      avisar(e.message, 'error')
    }
  }
  const mover = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= lista.length) return
    const nuevo = [...lista]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    return intentar(() => categorias.reordenar(nuevo.map((c) => c.id)))
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/administracion/productos" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave"><ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver a productos</Link>
      <h1 className="text-2xl md:text-3xl">Categorías</h1>
      <div className="flex items-end gap-2">
        <Input etiqueta="Nueva categoría" value={nueva} onChange={(e) => setNueva(e.target.value)} className="flex-1" />
        <Button deshabilitado={!nueva.trim()} onClick={() => intentar(async () => { await categorias.crear(nueva); setNueva('') }, 'Categoría creada')}>Crear</Button>
      </div>
      <ul className="flex flex-col divide-y divide-borde rounded-tarjeta bg-superficie px-4">
        {lista.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            {editando === c.id ? (
              <form className="flex flex-1 items-end gap-2" onSubmit={(e) => { e.preventDefault(); intentar(async () => { await categorias.renombrar(c.id, nombre); setEditando(null) }, 'Categoría renombrada') }}>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="flex-1" autoFocus />
                <Button type="submit" deshabilitado={!nombre.trim()}>Guardar</Button>
                <Button variante="fantasma" onClick={() => setEditando(null)}>Cancelar</Button>
              </form>
            ) : (
              <>
                <span className="flex flex-1 flex-col"><span className="font-medium uppercase tracking-wide">{c.nombre}</span><span className="text-xs text-texto-suave">{cuantos(c.id)} productos</span></span>
                <button type="button" aria-label={`Subir ${c.nombre}`} disabled={i === 0} onClick={() => mover(i, -1)} className="flex size-11 items-center justify-center rounded-control text-texto-suave hover:bg-superficie-2 disabled:opacity-30"><ArrowUp size={18} strokeWidth={1.75} aria-hidden /></button>
                <button type="button" aria-label={`Bajar ${c.nombre}`} disabled={i === lista.length - 1} onClick={() => mover(i, 1)} className="flex size-11 items-center justify-center rounded-control text-texto-suave hover:bg-superficie-2 disabled:opacity-30"><ArrowDown size={18} strokeWidth={1.75} aria-hidden /></button>
                <button type="button" aria-label={`Renombrar ${c.nombre}`} onClick={() => { setEditando(c.id); setNombre(c.nombre) }} className="flex size-11 items-center justify-center rounded-control text-texto-suave hover:bg-superficie-2"><Pencil size={18} strokeWidth={1.75} aria-hidden /></button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
