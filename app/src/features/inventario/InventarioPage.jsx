import { useMemo, useState } from 'react'
import { PackagePlus, PackageSearch, PackageX, Shirt, TrendingDown, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, CampoBusqueda, Chip, Dato, Encabezado, EmptyState, ErrorState, Skeleton } from '../../components/ui/index.js'
import ExportarExcel from '../../components/ExportarExcel.jsx'
import { useCategorias, useConfig, useProductos, useStockResumen } from '../../data/hooks.js'
import { etiquetaDe, nombreArchivo } from '../../lib/excel.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import Foto from '../catalogo/Foto.jsx'
import { ModalImportarProductos } from '../catalogo/admin/ImportarProductos.jsx'
import { libroInventario } from './exportarInventario.js'
import MovimientoSheet from './MovimientoSheet.jsx'

const TANDA = 40
const OPC_ESTADO_STOCK = [{ valor: '', etiqueta: 'Todos' }, { valor: 'agotado', etiqueta: 'Agotados' }, { valor: 'bajo', etiqueta: 'Stock bajo' }, { valor: 'ok', etiqueta: 'Normal' }]
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function InventarioPage() {
  const { usuario } = useAuth()
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState(null)
  const [visibles, setVisibles] = useState(TANDA)
  const [importando, setImportando] = useState(false)
  const prods = useProductos()
  const stock = useStockResumen()
  const cfg = useConfig()

  const cats = useCategorias()
  const umbral = cfg.datos?.stock_bajo_unidades ?? 24

  const opcCategoria = [{ valor: '', etiqueta: 'Todas' }, ...(cats.datos ?? []).map((c) => ({ valor: c.id, etiqueta: c.nombre }))]
  const camposExportar = [
    { tipo: 'select', clave: 'categoria_id', etiqueta: 'Categoría', opciones: opcCategoria },
    { tipo: 'select', clave: 'estado', etiqueta: 'Estado del stock', opciones: OPC_ESTADO_STOCK },
    { tipo: 'texto', clave: 'texto', etiqueta: 'Producto', placeholder: 'Código o nombre' },
  ]
  const generarExcel = async (x) => ({
    libro: libroInventario({
      productos: prods.datos,
      stock: stock.datos,
      categorias: cats.datos ?? [],
      umbral,
      filtros: x,
      filtrosTexto: [['Categoría', etiquetaDe(opcCategoria, x.categoria_id)], ['Estado', etiquetaDe(OPC_ESTADO_STOCK, x.estado)], ['Producto', x.texto.trim()]],
    }),
    nombre: nombreArchivo('inventario'),
  })
  const filas = useMemo(() => {
    if (!prods.datos || !stock.datos) return []
    return prods.datos.map((p) => {
      const unidades = p.colores.map((c) => stock.datos[c.id] ?? 0)
      return {
        p,
        total: unidades.reduce((t, n) => t + n, 0),
        agotados: unidades.filter((n) => n <= 0).length,
        bajos: unidades.filter((n) => n > 0 && n <= umbral).length,
      }
    })
  }, [prods.datos, stock.datos, umbral])

  const resumen = filas.reduce((r, f) => ({ prendas: r.prendas + f.total, agotados: r.agotados + f.agotados, bajos: r.bajos + f.bajos }), { prendas: 0, agotados: 0, bajos: 0 })
  const q = norm(texto.trim())
  const lista = filas
    .filter((f) => (filtro === 'agotados' ? f.agotados > 0 : filtro === 'bajos' ? f.bajos > 0 : true))
    .filter((f) => !q || norm(`${f.p.codigo} ${f.p.nombre}`).includes(q))

  const cargando = prods.cargando || stock.cargando || cfg.cargando
  const error = prods.error || stock.error || cfg.error

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Inventario"
        descripcion="Prendas por modelo y color. Tocá un producto para cargar entradas o ajustes."
        acciones={
          <>
            <ExportarExcel titulo="Exportar inventario a Excel" campos={camposExportar} generar={generarExcel} deshabilitado={!prods.datos || !stock.datos} />
            {puede(usuario.rol, 'stock.mover') && <Link to="/stock/importar"><Button variante="secundario" icono={Upload}>Cargar stock desde Excel</Button></Link>}
            {puede(usuario.rol, 'catalogo.editar') && <Button variante="secundario" icono={PackagePlus} onClick={() => setImportando(true)}>Carga de productos</Button>}
          </>
        }
      />
      <ModalImportarProductos abierto={importando} onCerrar={() => setImportando(false)} />

      {cargando && <Skeleton className="h-64" />}
      {error && <ErrorState mensaje="No pudimos cargar el inventario." onReintentar={() => { prods.reintentar(); stock.reintentar(); cfg.reintentar() }} />}

      {!cargando && !error && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato etiqueta="Prendas" valor={resumen.prendas} icono={Shirt} />
            <Dato etiqueta="Stock bajo" valor={resumen.bajos} icono={TrendingDown} tono="alerta" claseValor="text-alerta" />
            <Dato etiqueta="Agotados" valor={resumen.agotados} icono={PackageX} tono="error" claseValor="text-error" />
          </section>
          <p className="-mt-2 text-xs text-texto-suave">Stock bajo y agotados cuentan colores (no productos). Bajo = {umbral} prendas o menos.</p>

          <CampoBusqueda id="buscar-stock" etiqueta="Buscar producto" valor={texto} onCambiar={(t) => { setTexto(t); setVisibles(TANDA) }} placeholder="Código o nombre" />
          <div className="flex flex-wrap gap-2">
            <Chip activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</Chip>
            <Chip activo={filtro === 'bajos'} onClick={() => setFiltro('bajos')}>Con stock bajo</Chip>
            <Chip activo={filtro === 'agotados'} onClick={() => setFiltro('agotados')}>Con colores agotados</Chip>
          </div>

          {lista.length === 0 ? (
            <EmptyState icono={PackageSearch} titulo="No hay productos para mostrar" texto="Probá con otro filtro o búsqueda." />
          ) : (
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {lista.slice(0, visibles).map(({ p, total, agotados, bajos }) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setAbierto(p.id)} className="flex min-h-[4.5rem] w-full items-center gap-3 rounded-tarjeta border border-borde/70 bg-superficie p-2 shadow-tarjeta text-left hover:bg-superficie-2">
                    <Foto foto={p.fotos[0]} alt="" className="size-14 shrink-0 rounded-control" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-xs font-semibold tabular-nums text-tinta">{p.codigo}</span>
                      <span className="truncate text-base">{p.nombre}</span>
                      <span className="flex flex-wrap gap-1.5 pt-0.5">
                        {agotados > 0 && <Badge tono="error">{agotados} agotado{agotados > 1 && 's'}</Badge>}
                        {bajos > 0 && <Badge tono="alerta">{bajos} con stock bajo</Badge>}
                      </span>
                    </span>
                    <span className="text-right"><span className="block font-titulo text-xl font-semibold tabular-nums">{total}</span><span className="text-xs text-texto-suave">prendas</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {visibles < lista.length && <Button variante="secundario" className="self-center" onClick={() => setVisibles((v) => v + TANDA)}>Ver más ({lista.length - visibles})</Button>}
        </>
      )}

      <MovimientoSheet productoId={abierto} onCerrar={() => setAbierto(null)} />
    </div>
  )
}
