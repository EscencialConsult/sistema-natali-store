import { useMemo, useState } from 'react'
import { PackageSearch, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BotonLink, EmptyState, ErrorState, Input, Sheet, Skeleton, Tabs } from '../../../components/ui/index.js'
import { useCategorias, useProductos } from '../../../data/hooks.js'
import { formatear } from '../../../lib/moneda.js'
import { puede } from '../../../lib/permisos.js'
import { useAuth } from '../../auth/AuthContext.js'
import Foto from '../Foto.jsx'
import ProductoFicha from '../ProductoFicha.jsx'
import SubnavProductos from '../SubnavProductos.jsx'

// Listado del catálogo. Con permiso de edición cada fila abre el editor; sin él (encargadas) abre la ficha de consulta
// y no se ofrecen acciones que la ruta después negaría.
export default function AdminListado() {
  const { usuario } = useAuth()
  const edita = puede(usuario.rol, 'catalogo.editar')
  const [consulta, setConsulta] = useState(null)
  const [tab, setTab] = useState('activos')
  const [texto, setTexto] = useState('')
  const prods = useProductos({ soloActivos: false, texto })
  const cats = useCategorias()

  const nombreCat = useMemo(() => new Map((cats.datos ?? []).map((c) => [c.id, c.nombre])), [cats.datos])
  const lista = (prods.datos ?? []).filter((p) => {
    if (tab === 'inactivos') return !p.activo
    if (!p.activo) return false
    if (tab === 'publicados') return p.publicado_tienda
    if (tab === 'sin_precio') return p.publicado_tienda && !Number.isInteger(p.precio_unidad_bs_cent)
    if (tab === 'no_publicados') return !p.publicado_tienda
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl">Productos</h1>
        {edita && (
          <div className="flex flex-wrap gap-2">
            <BotonLink to="/administracion/categorias" variante="fantasma">Categorías</BotonLink>
            <BotonLink to="/administracion/productos/importar" variante="secundario">Carga masiva</BotonLink>
            <BotonLink to="/administracion/productos/nuevo">Nuevo producto</BotonLink>
          </div>
        )}
      </div>
      <SubnavProductos />
      {!edita && <p className="text-sm text-texto-suave">Modo consulta: tocá un modelo para ver fotos, colores y stock. Para editar productos pedile acceso a la administración.</p>}

      <Input etiqueta="Buscar por código o nombre" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. MN-005 o blazer" />
      <Tabs
        items={[{ valor: 'activos', etiqueta: 'Activos' }, { valor: 'publicados', etiqueta: 'En la tienda' }, { valor: 'no_publicados', etiqueta: 'Sin publicar' }, { valor: 'sin_precio', etiqueta: 'Publicados sin precio' }, { valor: 'inactivos', etiqueta: 'Dados de baja' }]}
        valor={tab}
        onChange={setTab}
      />

      {prods.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {prods.error && <ErrorState mensaje="No pudimos cargar los productos." onReintentar={prods.reintentar} />}
      {prods.datos && lista.length === 0 && (
        <EmptyState
          icono={PackageSearch}
          titulo={texto ? 'Ningún producto coincide' : tab === 'activos' ? 'Todavía no hay productos' : 'No hay productos dados de baja'}
          texto={edita && tab === 'activos' && !texto ? 'Creá el primero o importá varios desde Excel.' : undefined}
        />
      )}
      <ul className="flex flex-col gap-2">
        {lista.map((p) => (
          <li key={p.id}>
            {edita ? (
              <Link to={`/administracion/productos/${p.id}`} className="flex min-h-[4.5rem] w-full items-center gap-3 rounded-control bg-superficie p-2 text-left hover:bg-superficie-2">
              <Foto foto={p.fotos[0]} alt="" sizes="64px" className="size-16 shrink-0 rounded-tarjeta" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold tabular-nums">{p.codigo}</span>
                <span className="truncate text-base">{p.nombre}</span>
                <span className="text-sm text-texto-suave">{nombreCat.get(p.categoria_id) ?? 'Sin categoría'} · {p.colores.length} {p.colores.length === 1 ? 'color' : 'colores'} · {p.fotos.length} {p.fotos.length === 1 ? 'foto' : 'fotos'}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">{Number.isInteger(p.precio_unidad_bs_cent) ? formatear(p.precio_unidad_bs_cent) : <span className="text-alerta">Sin precio Bs</span>}</span>
                <span className="text-xs tabular-nums text-texto-suave">{formatear(p.precio_docena_usd_cent, 'usd')} / docena</span>
                <span className={p.activo && p.publicado_tienda ? 'text-xs font-medium text-exito' : 'text-xs text-texto-suave'}>
                  {!p.activo ? 'De baja' : p.publicado_tienda ? 'En la tienda' : 'Sin publicar'}
                </span>
                {edita && <Pencil size={16} strokeWidth={1.75} aria-hidden className="text-texto-tenue" />}
              </span>
            </Link>
            ) : (
              <button type="button" onClick={() => setConsulta(p)} className="flex min-h-[4.5rem] w-full items-center gap-3 rounded-control bg-superficie p-2 text-left hover:bg-superficie-2">
              <Foto foto={p.fotos[0]} alt="" sizes="64px" className="size-16 shrink-0 rounded-tarjeta" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold tabular-nums">{p.codigo}</span>
                <span className="truncate text-base">{p.nombre}</span>
                <span className="text-sm text-texto-suave">{nombreCat.get(p.categoria_id) ?? 'Sin categoría'} · {p.colores.length} {p.colores.length === 1 ? 'color' : 'colores'} · {p.fotos.length} {p.fotos.length === 1 ? 'foto' : 'fotos'}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">{Number.isInteger(p.precio_unidad_bs_cent) ? formatear(p.precio_unidad_bs_cent) : <span className="text-alerta">Sin precio Bs</span>}</span>
                <span className="text-xs tabular-nums text-texto-suave">{formatear(p.precio_docena_usd_cent, 'usd')} / docena</span>
                <span className={p.activo && p.publicado_tienda ? 'text-xs font-medium text-exito' : 'text-xs text-texto-suave'}>
                  {!p.activo ? 'De baja' : p.publicado_tienda ? 'En la tienda' : 'Sin publicar'}
                </span>
                {edita && <Pencil size={16} strokeWidth={1.75} aria-hidden className="text-texto-tenue" />}
              </span>
            </button>
            )}
          </li>
        ))}
      </ul>
      <Sheet abierto={!!consulta} onCerrar={() => setConsulta(null)} titulo={consulta?.codigo ?? ''} className="sm:w-[min(94vw,52rem)]">
        {consulta && <ProductoFicha productoId={consulta.id} />}
      </Sheet>
    </div>
  )
}
