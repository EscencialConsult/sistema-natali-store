import { useMemo, useState } from 'react'
import { PackagePlus, PackageSearch, Power, Trash2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, CampoBusqueda, Encabezado, EmptyState, ErrorState, Modal, Skeleton, Tabs, useToast } from '../../../components/ui/index.js'
import ExportarExcel from '../../../components/ExportarExcel.jsx'
import { useCategorias, useProducto, useProductos } from '../../../data/hooks.js'
import { productos } from '../../../data/repos/index.js'
import { contiene, etiquetaDe, nombreArchivo } from '../../../lib/excel.js'
import { puede } from '../../../lib/permisos.js'
import { useEsEscritorio } from '../../../lib/useMediaQuery.js'
import { useAuth } from '../../auth/AuthContext.js'
import { ConfirmarEliminarDeBaja, ConfirmarEliminarProducto } from './EliminarProducto.jsx'
import ProductoForm from './ProductoForm.jsx'
import TarjetaProductoAdmin from './TarjetaProductoAdmin.jsx'

const OPC_ESTADO = [{ valor: '', etiqueta: 'Todos' }, { valor: 'activos', etiqueta: 'Activos' }, { valor: 'baja', etiqueta: 'Dados de baja' }]

export default function AdminListado() {
  const [tab, setTab] = useState('activos')
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(null) // null · 'nuevo' · id del producto
  const esEscritorio = useEsEscritorio()
  const [dandoDeBaja, setDandoDeBaja] = useState(null)
  const [eliminando, setEliminando] = useState(null) // un producto · 'baja' (todos los dados de baja)
  const { usuario } = useAuth()
  const puedeEliminar = puede(usuario.rol, 'catalogo.eliminar')
  const avisar = useToast()
  const darDeBaja = async () => {
    const p = dandoDeBaja
    setDandoDeBaja(null)
    try {
      await productos.eliminar(p.id)
      avisar(`${p.codigo} dado de baja. Sus ventas anteriores se conservan.`)
    } catch (e) {
      avisar(e.message, 'error')
    }
  }
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

  // Escritorio: el formulario se abre en un modal sobre el listado. Celular: pantalla completa (navega a la ruta).
  const abrir = (e, destino) => {
    if (!esEscritorio) return
    e.preventDefault()
    setEditando(destino)
  }

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        volver={{ a: '/catalogo', texto: 'Volver al catálogo' }}
        titulo="Administrar productos"
        descripcion="Alta, edición, fotos y colores de cada modelo."
        acciones={
          <>
            <ExportarExcel titulo="Exportar productos a Excel" campos={camposExportar} generar={generarExcel} />
            <Link to="/catalogo/admin/importar"><Button variante="secundario" icono={Upload}>Carga masiva</Button></Link>
            <Link to="/catalogo/admin/nuevo" onClick={(e) => abrir(e, 'nuevo')}><Button icono={PackagePlus}>Nuevo producto</Button></Link>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={[{ valor: 'activos', etiqueta: 'Activos' }, { valor: 'inactivos', etiqueta: 'Dados de baja' }]} valor={tab} onChange={setTab} />
        <CampoBusqueda id="buscar-admin" etiqueta="Buscar por código o nombre" valor={texto} onCambiar={setTexto} placeholder="Ej. MN-005 o blazer" className="sm:w-80" />
      </div>

      {prods.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {prods.error && <ErrorState mensaje="No pudimos cargar los productos." onReintentar={prods.reintentar} />}
      {prods.datos && lista.length === 0 && (
        <EmptyState
          icono={PackageSearch}
          titulo={texto ? 'Ningún producto coincide' : tab === 'activos' ? 'Todavía no hay productos' : 'No hay productos dados de baja'}
          texto={tab === 'activos' && !texto ? 'Creá el primero o importá varios desde Excel.' : undefined}
        />
      )}
      {lista.length > 0 && (
        <div className="-mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-texto-suave"><span className="font-semibold tabular-nums text-texto">{lista.length}</span> productos</p>
          {tab === 'inactivos' && !texto && puedeEliminar && (
            <Button variante="peligro_suave" icono={Trash2} onClick={() => setEliminando('baja')}>Eliminar todos los dados de baja</Button>
          )}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {lista.map((p) => (
          <li key={p.id}>
            <TarjetaProductoAdmin producto={p} categoria={nombreCat.get(p.categoria_id)} onEditar={(e) => abrir(e, p.id)} onDarDeBaja={() => setDandoDeBaja(p)} onEliminar={puedeEliminar ? () => setEliminando(p) : undefined} />
          </li>
        ))}
      </ul>

      <Modal abierto={!!dandoDeBaja} onCerrar={() => setDandoDeBaja(null)} titulo={`¿Dar de baja ${dandoDeBaja?.codigo ?? ''}?`}>
        <p className="mb-5 text-sm text-texto-suave">“{dandoDeBaja?.nombre}” deja de verse en el catálogo y no se puede vender. Las notas anteriores y el historial de stock se conservan. Podés reactivarlo cuando quieras.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="fantasma" onClick={() => setDandoDeBaja(null)}>Cancelar</Button>
          <Button variante="peligro" icono={Power} onClick={darDeBaja}>Sí, dar de baja</Button>
        </div>
      </Modal>
      <ConfirmarEliminarProducto producto={eliminando && eliminando !== 'baja' ? eliminando : null} onCerrar={() => setEliminando(null)} />
      <ConfirmarEliminarDeBaja abierto={eliminando === 'baja'} cantidad={lista.length} onCerrar={() => setEliminando(null)} />

      <Modal
        abierto={!!editando}
        onCerrar={() => setEditando(null)}
        cerrarConFondo={false}
        titulo={editando === 'nuevo' ? 'Nuevo producto' : `Editar ${(prods.datos ?? []).find((p) => p.id === editando)?.codigo ?? 'producto'}`}
        ancho="w-[min(96vw,68rem)]"
      >
        {editando && <FormularioModal key={editando} id={editando === 'nuevo' ? null : editando} onListo={() => setEditando(null)} />}
      </Modal>
    </div>
  )
}

// Carga el producto y las categorías para el modal.
function FormularioModal({ id, onListo }) {
  const prod = useProducto(id ?? undefined)
  const cats = useCategorias()
  if (prod.cargando || cats.cargando) return <Skeleton className="h-96" />
  if (prod.error || cats.error) return <ErrorState mensaje="No pudimos cargar el producto." onReintentar={() => { prod.reintentar(); cats.reintentar() }} />
  if (id && !prod.datos) return <ErrorState mensaje="Ese producto ya no existe." />
  return <ProductoForm producto={prod.datos} listaCategorias={cats.datos} onListo={onListo} enModal />
}
