import { useMemo, useState } from 'react'
import { ChevronLeft, PackagePlus, PackageSearch, Pencil, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, ErrorState, Input, Skeleton, Tabs } from '../../../components/ui/index.js'
import ExportarExcel from '../../../components/ExportarExcel.jsx'
import { useCategorias, useProductos } from '../../../data/hooks.js'
import { productos } from '../../../data/repos/index.js'
import { contiene, etiquetaDe, nombreArchivo } from '../../../lib/excel.js'
import { formatear } from '../../../lib/moneda.js'
import Foto from '../Foto.jsx'

const OPC_ESTADO = [{ valor: '', etiqueta: 'Todos' }, { valor: 'activos', etiqueta: 'Activos' }, { valor: 'baja', etiqueta: 'Dados de baja' }]

export default function AdminListado() {
  const [tab, setTab] = useState('activos')
  const [texto, setTexto] = useState('')
  const prods = useProductos({ soloActivos: false, texto })
  const cats = useCategorias()

  const nombreCat = useMemo(() => new Map((cats.datos ?? []).map((c) => [c.id, c.nombre])), [cats.datos])
  const lista = (prods.datos ?? []).filter((p) => (tab === 'activos' ? p.activo : !p.activo))

  const opcCategoria = [{ valor: '', etiqueta: 'Todas' }, ...(cats.datos ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre }))]
  const camposExportar = [
    { tipo: 'select', clave: 'categoria_id', etiqueta: 'Categoría', opciones: opcCategoria },
    { tipo: 'select', clave: 'estado', etiqueta: 'Estado', opciones: OPC_ESTADO },
    { tipo: 'texto', clave: 'texto', etiqueta: 'Producto', placeholder: 'Código o nombre' },
  ]
  const generarExcel = async (x) => {
    const filas = (await productos.listar({ soloActivos: false }))
      .filter((p) => (!x.categoria_id || p.categoria_id === x.categoria_id) && (!x.estado || (x.estado === 'activos') === p.activo) && contiene(x.texto, p.codigo, p.nombre))
      .map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: nombreCat.get(p.categoria_id) ?? '',
        precio: p.precio_docena_usd_cent / 100,
        colores: p.colores.map((c) => c.nombre).join(', '),
        fotos: p.fotos.length,
        nuevo: p.nuevo ? 'Sí' : '',
        estado: p.activo ? 'Activo' : 'De baja',
      }))
    return {
      nombre: nombreArchivo('productos'),
      libro: {
        titulo: 'Modas Naty · Productos',
        filtros: [['Categoría', etiquetaDe(opcCategoria, x.categoria_id)], ['Estado', etiquetaDe(OPC_ESTADO, x.estado)], ['Producto', x.texto.trim()]],
        hojas: [{
          nombre: 'Productos',
          columnas: [
            { titulo: 'Código', clave: 'codigo', ancho: 10 },
            { titulo: 'Producto', clave: 'nombre', ancho: 32 },
            { titulo: 'Categoría', clave: 'categoria', ancho: 18 },
            { titulo: 'Precio docena (USD)', clave: 'precio', tipo: 'dinero', ancho: 18 },
            { titulo: 'Colores', clave: 'colores', ancho: 40 },
            { titulo: 'Fotos', clave: 'fotos', tipo: 'entero', ancho: 8 },
            { titulo: 'Nuevo', clave: 'nuevo', ancho: 8 },
            { titulo: 'Estado', clave: 'estado', ancho: 10, tono: (f) => (f.estado === 'De baja' ? 'error' : null) },
          ],
          filas,
        }],
      },
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link to="/catalogo" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave">
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver al catálogo
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.75rem] leading-tight tracking-tight md:text-[2rem]">Administrar productos</h1>
        <div className="flex flex-wrap gap-2">
          <ExportarExcel titulo="Exportar productos a Excel" campos={camposExportar} generar={generarExcel} />
          <Link to="/catalogo/admin/importar"><Button variante="secundario" icono={Upload}>Carga masiva</Button></Link>
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
            <Link to={`/catalogo/admin/${p.id}`} className="flex min-h-[4.5rem] items-center gap-3 rounded-tarjeta border border-borde/70 bg-superficie p-2 shadow-tarjeta hover:bg-superficie-2">
              <Foto foto={p.fotos[0]} alt="" className="size-16 shrink-0 rounded-control" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-semibold tabular-nums text-tinta">{p.codigo}</span>
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
