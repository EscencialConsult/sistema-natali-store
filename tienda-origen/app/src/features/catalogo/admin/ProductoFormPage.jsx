import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BotonLink, Button, ErrorState, Input, Modal, Select, Skeleton, useToast } from '../../../components/ui/index.js'
import { useCategorias, useProducto, useProductos } from '../../../data/hooks.js'
import { categorias, esquemaProducto, productos, stock } from '../../../data/repos/index.js'
import { siguienteCodigo } from '../../../lib/codigo.js'
import { aCentavos } from '../../../lib/moneda.js'
import { slugDe } from '../../../lib/slug.js'
import { useAuth } from '../../auth/AuthContext.js'
import ColoresEditor from './ColoresEditor.jsx'
import FotosEditor from './FotosEditor.jsx'

const aTexto = (cent) => (cent / 100).toFixed(2).replace('.', ',')

function parsearPrecio(texto) {
  const n = Number(String(texto).trim().replace(',', '.'))
  if (!String(texto).trim()) return { error: 'Ingresá el precio por docena en dólares.' }
  if (!Number.isFinite(n) || n < 0) return { error: 'El precio no es un número válido.' }
  return { cent: aCentavos(n) }
}

function Formulario({ producto, listaCategorias, codigoSugerido }) {
  const navigate = useNavigate()
  const avisar = useToast()
  const { usuario } = useAuth()
  const esNuevo = !producto
  const [f, setF] = useState(() => ({
    // Producto nuevo: el código ya viene puesto (siguiente libre); se puede cambiar.
    codigo: producto?.codigo ?? codigoSugerido,
    nombre: producto?.nombre ?? '',
    categoria_id: producto?.categoria_id ?? '',
    descripcion: producto?.descripcion ?? '',
    precio: producto ? aTexto(producto.precio_docena_usd_cent) : '',
    precio_bs: Number.isInteger(producto?.precio_unidad_bs_cent) ? aTexto(producto.precio_unidad_bs_cent) : '',
    publicado_tienda: producto?.publicado_tienda ?? false,
    destacado: producto?.destacado ?? false,
    slug: producto?.slug ?? '',
    activo: producto?.activo ?? true,
    nuevo: producto?.nuevo ?? false,
    fotos: (producto?.fotos ?? []).map((x) => ({ key: x.id, ruta: x.ruta, blob: x.blob })),
    colores: (producto?.colores ?? []).map((c) => ({ id: c.id, nombre: c.nombre, hex: c.hex, existente: true, stock_inicial: '' })),
  }))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmaBaja, setConfirmaBaja] = useState(false)
  const [nuevaCat, setNuevaCat] = useState('')
  const limpiarError = (campo) => setErrores(({ [campo]: _quitado, ...resto }) => resto)
  const set = (campo) => (e) => {
    setF((x) => ({ ...x, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    limpiarError(campo)
  }

  const crearCategoria = async () => {
    try {
      const c = await categorias.crear(nuevaCat)
      setF((x) => ({ ...x, categoria_id: c.id }))
      limpiarError('categoria_id')
      setNuevaCat('')
    } catch (e) {
      setErrores((x) => ({ ...x, categoria_id: e.message }))
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const precio = parsearPrecio(f.precio)
    const precioBs = f.precio_bs.trim() ? parsearPrecio(f.precio_bs) : { cent: null }
    const datos = {
      codigo: f.codigo.trim().toUpperCase(),
      nombre: f.nombre,
      categoria_id: f.categoria_id,
      descripcion: f.descripcion,
      precio_docena_usd_cent: precio.cent ?? 0,
      precio_unidad_bs_cent: precioBs.cent ?? null,
      publicado_tienda: f.publicado_tienda,
      destacado: f.destacado,
      slug: f.slug.trim() || undefined,
      activo: f.activo,
      nuevo: f.nuevo,
      fotos: f.fotos.map(({ ruta, blob }) => ({ ruta, blob })),
      colores: f.colores.map(({ id, nombre, hex }) => ({ id, nombre, hex })),
    }
    const nuevosErrores = {}
    if (precio.error) nuevosErrores.precio = precio.error
    if (precioBs.error) nuevosErrores.precio_bs = 'El precio de la tienda no es un número válido.'
    if (f.publicado_tienda && precioBs.cent == null) nuevosErrores.precio_bs = 'Para publicar en la tienda hace falta el precio por unidad en Bs.'
    const parsed = esquemaProducto.safeParse(datos)
    if (!parsed.success) for (const i of parsed.error.issues) nuevosErrores[i.path[0] === 'precio_docena_usd_cent' ? 'precio' : i.path[0]] ??= i.message
    const nombres = datos.colores.map((c) => c.nombre.trim().toLowerCase())
    if (new Set(nombres).size !== nombres.length) nuevosErrores.colores = 'Hay colores repetidos.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length) {
      // Lleva al primer campo con error: en el celular el formulario es largo.
      setTimeout(() => document.querySelector('form [aria-invalid="true"]')?.focus(), 0)
      return
    }

    setGuardando(true)
    try {
      const guardado = esNuevo ? await productos.crear(datos) : await productos.actualizar(producto.id, datos)
      for (const c of f.colores.filter((x) => !x.existente && Number(x.stock_inicial) > 0)) {
        await stock.registrarMovimiento({ producto_id: guardado.id, color_id: c.id, tipo: 'entrada', delta: Number(c.stock_inicial), motivo: 'Stock inicial', usuario_id: usuario.id })
      }
      avisar(esNuevo ? 'Producto creado' : 'Cambios guardados', 'exito')
      navigate('/administracion/productos')
    } catch (err) {
      setErrorGeneral(err.message)
      setGuardando(false)
    }
  }

  const darDeBaja = async () => {
    await productos.eliminar(producto.id)
    avisar('Producto dado de baja. Los pedidos anteriores se conservan.')
    navigate('/administracion/productos')
  }
  const reactivar = async () => {
    await productos.reactivar(producto.id)
    avisar('Producto reactivado', 'exito')
    navigate('/administracion/productos')
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-6" noValidate>
      <Link to="/administracion/productos" className="inline-flex min-h-11 items-center gap-1 self-start text-sm text-texto-suave">
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden /> Volver a productos
      </Link>
      <h1 className="text-2xl md:text-3xl">{esNuevo ? 'Nuevo producto' : `Editar ${producto.codigo}`}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Input etiqueta="Código" value={f.codigo} onChange={set('codigo')} error={errores.codigo} placeholder={codigoSugerido} autoCapitalize="characters" ayuda={esNuevo ? 'Se asigna solo (el siguiente libre). Podés cambiarlo si hace falta.' : undefined} />
        <Input etiqueta="Precio por docena (US$)" inputMode="decimal" value={f.precio} onChange={set('precio')} error={errores.precio} placeholder="120,00" />
        <Input etiqueta="Nombre" className="md:col-span-2" value={f.nombre} onChange={set('nombre')} error={errores.nombre} />
        <div className="flex flex-col gap-2 md:col-span-2">
          <Select etiqueta="Categoría" opciones={listaCategorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))} valor={f.categoria_id} onChange={(v) => {
              setF((x) => ({ ...x, categoria_id: v }))
              limpiarError('categoria_id')
            }} placeholder="Elegir categoría" />
          {errores.categoria_id && <p className="text-sm text-error">{errores.categoria_id}</p>}
          <div className="flex items-end gap-2">
            <Input etiqueta="¿No está? Creá una categoría" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} className="flex-1" />
            <Button variante="secundario" deshabilitado={!nuevaCat.trim()} onClick={crearCategoria}>Crear</Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="desc" className="text-sm font-medium">Descripción (opcional)</label>
          <textarea id="desc" rows={3} value={f.descripcion} onChange={set('descripcion')} className="w-full rounded-control border border-borde-fuerte bg-superficie px-3 py-2 text-base" />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-base"><input type="checkbox" checked={f.nuevo} onChange={set('nuevo')} className="size-5 accent-tinta" /> Marcar como “Nuevo”</label>
        <label className="flex min-h-11 items-center gap-3 text-base"><input type="checkbox" checked={f.activo} onChange={set('activo')} className="size-5 accent-tinta" /> Activo</label>
      </div>

      <section aria-labelledby="tienda-titulo" className="flex flex-col gap-4 rounded-tarjeta bg-superficie p-4">
        <div>
          <h2 id="tienda-titulo" className="text-lg">Tienda online</h2>
          <p className="text-sm text-texto-suave">El precio por docena en US$ es el del sistema de notas de venta; la tienda vende por unidad en Bs.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input etiqueta="Precio por unidad (Bs)" inputMode="decimal" value={f.precio_bs} onChange={set('precio_bs')} error={errores.precio_bs} placeholder="150,00" />
          <Input etiqueta="Dirección en la tienda (slug)" value={f.slug} onChange={set('slug')} placeholder="se genera del nombre y el código" ayuda={`/p/${f.slug.trim() || slugDe(`${f.nombre} ${f.codigo}`) || '…'}`} />
          <label className="flex min-h-11 items-center gap-3 text-base"><input type="checkbox" checked={f.publicado_tienda} onChange={set('publicado_tienda')} className="size-5 accent-tinta" /> Publicado en la tienda</label>
          <label className="flex min-h-11 items-center gap-3 text-base"><input type="checkbox" checked={f.destacado} onChange={set('destacado')} className="size-5 accent-tinta" /> Destacado en el inicio</label>
        </div>
        {!esNuevo && producto.publicado_tienda && producto.slug && <a href={`/p/${producto.slug}`} target="_blank" rel="noreferrer" className="self-start text-sm underline underline-offset-4">Ver en la tienda</a>}
      </section>

      <FotosEditor fotos={f.fotos} onChange={(fotos) => setF((x) => ({ ...x, fotos }))} />
      <ColoresEditor colores={f.colores} onChange={(colores) => {
          setF((x) => ({ ...x, colores }))
          limpiarError('colores')
        }} error={errores.colores} />

      {errorGeneral && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{errorGeneral}</p>}
      {Object.keys(errores).length > 0 && !errorGeneral && <p role="alert" className="text-sm text-error">Revisá los campos marcados.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" cargando={guardando}>{esNuevo ? 'Crear producto' : 'Guardar cambios'}</Button>
        <BotonLink to="/administracion/productos" variante="fantasma">Cancelar</BotonLink>
        {!esNuevo && producto.activo && <Button variante="peligro" className="ml-auto" onClick={() => setConfirmaBaja(true)}>Dar de baja</Button>}
        {!esNuevo && !producto.activo && <Button variante="secundario" className="ml-auto" onClick={reactivar}>Reactivar</Button>}
      </div>

      <Modal abierto={confirmaBaja} onCerrar={() => setConfirmaBaja(false)} titulo="¿Dar de baja este producto?">
        <p className="mb-4 text-sm text-texto-suave">Deja de verse en la tienda y no se puede comprar. Los pedidos anteriores y el historial de stock se conservan. Podés reactivarlo cuando quieras.</p>
        <div className="flex gap-2">
          <Button variante="peligro" onClick={darDeBaja}>Sí, dar de baja</Button>
          <Button variante="fantasma" onClick={() => setConfirmaBaja(false)}>Cancelar</Button>
        </div>
      </Modal>
    </form>
  )
}

export default function ProductoFormPage() {
  const { id } = useParams()
  const prod = useProducto(id)
  const cats = useCategorias()
  const todos = useProductos({ soloActivos: false })

  if (prod.cargando || cats.cargando || todos.cargando) return <Skeleton className="h-96" />
  if (prod.error || cats.error) return <ErrorState mensaje="No pudimos cargar el producto." onReintentar={() => { prod.reintentar(); cats.reintentar() }} />
  if (id && !prod.datos) return <ErrorState mensaje="Ese producto no existe." />
  const codigoSugerido = siguienteCodigo((todos.datos ?? []).map((p) => p.codigo))
  return <Formulario key={id ?? 'nuevo'} producto={prod.datos} listaCategorias={cats.datos} codigoSugerido={codigoSugerido} />
}
