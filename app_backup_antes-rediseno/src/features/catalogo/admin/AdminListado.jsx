import { useMemo, useState } from 'react'
import { ChevronLeft, FileSpreadsheet, PackagePlus, PackageSearch, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, Input, Skeleton, Tabs } from '../../../components/ui/index.js'
import { useCategorias, useProductos } from '../../../data/hooks.js'
import { formatear } from '../../../lib/moneda.js'
import Foto from '../Foto.jsx'

export default function AdminListado() {
  const [tab, setTab] = useState('activos')
  const [texto, setTexto] = useState('')
  const prods = useProductos({ soloActivos: false, texto })
  const cats = useCategorias()

  const nombreCat = useMemo(() => new Map((cats.datos ?? []).map((c) => [c.id, c.nombre])), [cats.datos])
  const lista = (prods.datos ?? []).filter((p) => (tab === 'activos' ? p.activo : !p.activo))

  return (
    <div className="flex flex-col gap-5">
      <Link to="/catalogo" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave">
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver al catálogo
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl">Administrar productos</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/catalogo/admin/importar"><Button variante="secundario" icono={FileSpreadsheet}>Carga masiva</Button></Link>
          <Link to="/catalogo/admin/nuevo"><Button icono={PackagePlus}>Nuevo producto</Button></Link>
        </div>
      </div>

      <Input etiqueta="Buscar por código o nombre" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. MN-005 o blazer" />
      <Tabs
        items={[{ valor: 'activos', etiqueta: 'Activos' }, { valor: 'inactivos', etiqueta: 'Dados de baja' }]}
        valor={tab}
        onChange={setTab}
      />

      {prods.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {prods.error && <ErrorState mensaje="No pudimos cargar los productos." onReintentar={prods.reintentar} />}
      {prods.datos && lista.length === 0 && (
        <EmptyState
          icono={PackageSearch}
          titulo={texto ? 'Ningún producto coincide' : tab === 'activos' ? 'Todavía no hay productos' : 'No hay productos dados de baja'}
          texto={tab === 'activos' && !texto ? 'Creá el primero o importá varios desde Excel.' : undefined}
        />
      )}
      <ul className="flex flex-col gap-2">
        {lista.map((p) => (
          <li key={p.id}>
            <Link to={`/catalogo/admin/${p.id}`} className="flex min-h-[4.5rem] items-center gap-3 rounded-control border border-borde bg-superficie p-2 hover:bg-superficie-2">
              <Foto foto={p.fotos[0]} alt="" className="size-16 shrink-0 rounded-tarjeta" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold tabular-nums">{p.codigo}</span>
                <span className="truncate text-base">{p.nombre}</span>
                <span className="text-sm text-texto-suave">{nombreCat.get(p.categoria_id) ?? 'Sin categoría'} · {p.colores.length} colores · {p.fotos.length} fotos</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">{formatear(p.precio_docena_usd_cent, 'usd')}</span>
                {!p.activo && <Badge tono="neutro">De baja</Badge>}
                <Pencil size={16} strokeWidth={1.75} aria-hidden className="text-texto-tenue" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
