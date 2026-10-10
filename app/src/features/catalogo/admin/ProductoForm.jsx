import { useState } from 'react'
import { Plus, Power, RotateCcw, Tag, Trash2 } from 'lucide-react'
import { Button, CAMPO, Input, Modal, Select, TARJETA, useToast } from '../../../components/ui/index.js'
import { categorias, esquemaProducto, productos, stock } from '../../../data/repos/index.js'
import { cn } from '../../../lib/cn.js'
import { aPrendas, leerDocenas } from '../../../lib/docenas.js'
import { aCentavos } from '../../../lib/moneda.js'
import { puede } from '../../../lib/permisos.js'
import { useAuth } from '../../auth/AuthContext.js'
import ColorEditor from './ColorEditor.jsx'
import { ConfirmarEliminarProducto } from './EliminarProducto.jsx'
import FotosEditor from './FotosEditor.jsx'

const aTexto = (cent) => (cent / 100).toFixed(2).replace('.', ',')

function parsearPrecio(texto) {
  const n = Number(String(texto).trim().replace(',', '.'))
  if (!String(texto).trim()) return { error: 'Ingresá el precio por docena en dólares.' }
  if (!Number.isFinite(n) || n < 0) return { error: 'El precio no es un número válido.' }
  return { cent: aCentavos(n) }
}

function Seccion({ titulo, descripcion, children, className }) {
  return (
    <section className={cn(TARJETA, 'flex flex-col gap-4 p-4 sm:p-5', className)}>
      <div>
        <h2 className="text-base sm:text-lg">{titulo}</h2>
        {descripcion && <p className="text-sm text-texto-suave">{descripcion}</p>}
      </div>
      {children}
    </section>
  )
}

function Interruptor({ titulo, descripcion, valor, onChange }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-control border border-borde bg-superficie-2/60 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{titulo}</span>
        <span className="block text-xs text-texto-suave">{descripcion}</span>
      </span>
      <input type="checkbox" role="switch" checked={valor} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-borde-fuerte transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-superficie after:shadow after:transition-transform peer-checked:bg-tinta peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tinta" />
    </label>
  )
}

// Formulario de alta/edición de producto. Lo usan la pantalla completa (celular) y el modal (escritorio).
// enModal: dos columnas (fotos | datos) y barra de acciones fija abajo del modal. onListo(): al guardar, cancelar o dar de baja.
export default function ProductoForm({ producto, listaCategorias, onListo, enModal = false }) {
  const avisar = useToast()
  const { usuario } = useAuth()
  const esNuevo = !producto
  const [f, setF] = useState(() => ({
    codigo: producto?.codigo ?? '',
    nombre: producto?.nombre ?? '',
    categoria_id: producto?.categoria_id ?? '',
    descripcion: producto?.descripcion ?? '',
    precio: producto ? aTexto(producto.precio_docena_usd_cent) : '',
    activo: producto?.activo ?? true,
    nuevo: producto?.nuevo ?? false,
    fotos: (producto?.fotos ?? []).map((x) => ({ key: x.id, ruta: x.ruta, blob: x.blob })),
    // Un solo color (opcional). El stock es del producto: el inicial se pide solo al crearlo.
    color: producto?.colores?.[0] ? { id: producto.colores[0].id, nombre: producto.colores[0].nombre, hex: producto.colores[0].hex } : null,
    stock_inicial: '',
  }))
  const [cats, setCats] = useState(listaCategorias)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmaBaja, setConfirmaBaja] = useState(false)
  const [confirmaEliminar, setConfirmaEliminar] = useState(false)
  const [creandoCat, setCreandoCat] = useState(false)
  const [nuevaCat, setNuevaCat] = useState('')
  const limpiarError = (campo) => setErrores(({ [campo]: _quitado, ...resto }) => resto)
  const set = (campo) => (valor) => {
    setF((x) => ({ ...x, [campo]: valor }))
    limpiarError(campo)
  }

  const crearCategoria = async () => {
    try {
      const c = await categorias.crear(nuevaCat)
      setCats((l) => [...l, c])
      set('categoria_id')(c.id)
      setNuevaCat('')
      setCreandoCat(false)
    } catch (e) {
      setErrores((x) => ({ ...x, categoria_id: e.message }))
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    const precio = parsearPrecio(f.precio)
    const datos = {
      codigo: f.codigo.trim().toUpperCase(),
      nombre: f.nombre,
      categoria_id: f.categoria_id,
      descripcion: f.descripcion,
      precio_docena_usd_cent: precio.cent ?? 0,
      activo: f.activo,
      nuevo: f.nuevo,
      fotos: f.fotos.map(({ ruta, blob }) => ({ ruta, blob })),
      colores: f.color ? [{ id: f.color.id, nombre: f.color.nombre, hex: f.color.hex }] : [],
    }
    const nuevosErrores = {}
    if (precio.error) nuevosErrores.precio = precio.error
    const parsed = esquemaProducto.safeParse(datos)
    if (!parsed.success) for (const i of parsed.error.issues) nuevosErrores[i.path[0] === 'precio_docena_usd_cent' ? 'precio' : i.path[0]] ??= i.message
    // Stock inicial (solo al crear): en docenas o medias docenas; vacío = sin stock.
    let inicial = 0
    if (esNuevo && f.stock_inicial.trim() !== '') {
      const leida = leerDocenas(f.stock_inicial, { permitirCero: true })
      if (leida.error) nuevosErrores.stock_inicial = leida.error
      else inicial = aPrendas(leida.docenas)
    }
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length) {
      // Lleva al primer campo con error: el formulario es largo.
      setTimeout(() => document.querySelector('form [aria-invalid="true"]')?.focus(), 0)
      return
    }

    setGuardando(true)
    try {
      const guardado = esNuevo ? await productos.crear(datos) : await productos.actualizar(producto.id, datos)
      if (inicial > 0) await stock.registrarMovimiento({ producto_id: guardado.id, color_id: datos.colores[0]?.id ?? null, tipo: 'entrada', delta: inicial, motivo: 'Stock inicial', usuario_id: usuario.id })
      avisar(esNuevo ? 'Producto creado' : 'Cambios guardados', 'exito')
      onListo()
    } catch (err) {
      setErrorGeneral(err.message)
      setGuardando(false)
    }
  }

  const darDeBaja = async () => {
    await productos.eliminar(producto.id)
    avisar('Producto dado de baja. Sus ventas anteriores se conservan.')
    onListo()
  }
  const reactivar = async () => {
    await productos.reactivar(producto.id)
    avisar('Producto reactivado', 'exito')
    onListo()
  }

  const hayErrores = Object.keys(errores).length > 0

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
      <div className={cn('grid grid-cols-1 gap-5', enModal ? 'md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-start' : 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start')}>
        <div className={cn('flex flex-col gap-5', enModal ? 'md:sticky md:top-0' : 'lg:sticky lg:top-24')}>
          <Seccion titulo="Fotos" descripcion="La primera es la principal: es la que se ve en el catálogo.">
            <FotosEditor fotos={f.fotos} onChange={set('fotos')} />
          </Seccion>
        </div>

        <div className="flex flex-col gap-5">
          <Seccion titulo="Datos del producto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input etiqueta="Código" value={f.codigo} onChange={(e) => set('codigo')(e.target.value)} error={errores.codigo} placeholder="MN-139" autoCapitalize="characters" />
              <Input etiqueta="Precio por docena (US$)" inputMode="decimal" value={f.precio} onChange={(e) => set('precio')(e.target.value)} error={errores.precio} placeholder="120,00" />
              <Input etiqueta="Nombre" className="sm:col-span-2" value={f.nombre} onChange={(e) => set('nombre')(e.target.value)} error={errores.nombre} placeholder="Ej. Blusa básica satín" />

              <div className="flex flex-col gap-2 sm:col-span-2">
                <div className="flex items-end gap-2">
                  <Select etiqueta="Categoría" className="min-w-0 flex-1" opciones={cats.map((c) => ({ valor: c.id, etiqueta: c.nombre }))} valor={f.categoria_id} onChange={set('categoria_id')} placeholder="Elegir categoría" />
                  <Button variante={creandoCat ? 'suave' : 'secundario'} icono={Plus} aria-expanded={creandoCat} onClick={() => setCreandoCat(!creandoCat)} className="shrink-0">
                    <span className="max-sm:sr-only">Nueva</span>
                  </Button>
                </div>
                {errores.categoria_id && <p className="text-sm text-error">{errores.categoria_id}</p>}
                {creandoCat && (
                  <div className="flex items-end gap-2 rounded-control bg-superficie-2/70 p-3">
                    <Input etiqueta="Nombre de la categoría nueva" value={nuevaCat} onChange={(e) => setNuevaCat(e.target.value)} className="min-w-0 flex-1" autoFocus />
                    <Button icono={Tag} deshabilitado={!nuevaCat.trim()} onClick={crearCategoria} className="shrink-0">Crear</Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="desc" className="text-sm font-medium">Descripción <span className="font-normal text-texto-suave">(opcional)</span></label>
                <textarea id="desc" rows={3} value={f.descripcion} onChange={(e) => set('descripcion')(e.target.value)} className={cn(CAMPO, 'min-h-24 resize-y border-borde-campo py-2.5')} placeholder="Telas, talles, detalles…" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Interruptor titulo="Visible en el catálogo" descripcion="Si está apagado, no se ve ni se vende." valor={f.activo} onChange={set('activo')} />
              <Interruptor titulo="Marcar como “Nuevo”" descripcion="Muestra la etiqueta Nuevo en la foto." valor={f.nuevo} onChange={set('nuevo')} />
            </div>
          </Seccion>

          <Seccion titulo="Color" descripcion="Un solo color, opcional. Es informativo: el stock es del producto.">
            <ColorEditor color={f.color} onChange={set('color')} error={errores.colores} />
          </Seccion>

          <Seccion titulo="Stock" descripcion={esNuevo ? 'Stock inicial del producto, en docenas o medias docenas (opcional).' : 'El stock se mueve desde Inventario (queda el historial).'}>
            {esNuevo && (
              <Input etiqueta="Stock inicial (docenas)" inputMode="decimal" value={f.stock_inicial} onChange={(e) => set('stock_inicial')(e.target.value.replace(/[^\d.,]/g, ''))} error={errores.stock_inicial} placeholder="Ej. 10 o 2,5" />
            )}
          </Seccion>
        </div>
      </div>

      {errorGeneral && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{errorGeneral}</p>}

      {/* Acciones fijas abajo: en el modal, al pie del contenido; en la pantalla completa, sobre la barra de navegación. */}
      <div
        className={cn(
          'sticky z-10 flex flex-wrap items-center gap-2 border-t border-borde bg-superficie/95 py-3 backdrop-blur-md',
          enModal ? '-mx-5 bottom-0 px-5' : '-mx-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] px-4 md:bottom-0 md:mx-0 md:rounded-tarjeta md:border md:px-4 md:shadow-elevada',
        )}
      >
        {!esNuevo && producto.activo && <Button variante="peligro_suave" icono={Power} onClick={() => setConfirmaBaja(true)}>Dar de baja</Button>}
        {!esNuevo && !producto.activo && <Button variante="fantasma" icono={RotateCcw} onClick={reactivar}>Reactivar</Button>}
        {!esNuevo && puede(usuario.rol, 'catalogo.eliminar') && <Button variante="peligro_suave" icono={Trash2} onClick={() => setConfirmaEliminar(true)}>Eliminar</Button>}
        {hayErrores && !errorGeneral && <p role="alert" className="text-sm text-error max-sm:w-full">Revisá los campos marcados.</p>}
        <div className="ml-auto flex gap-2">
          <Button variante="fantasma" onClick={onListo}>Cancelar</Button>
          <Button type="submit" cargando={guardando}>{esNuevo ? 'Crear producto' : 'Guardar cambios'}</Button>
        </div>
      </div>

      <Modal abierto={confirmaBaja} onCerrar={() => setConfirmaBaja(false)} titulo="¿Dar de baja este producto?">
        <p className="mb-5 text-sm text-texto-suave">Deja de verse en el catálogo y no se puede vender. Las notas de venta anteriores y el historial de stock se conservan. Podés reactivarlo cuando quieras.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variante="fantasma" onClick={() => setConfirmaBaja(false)}>Cancelar</Button>
          <Button variante="peligro" icono={Power} onClick={darDeBaja}>Sí, dar de baja</Button>
        </div>
      </Modal>
      <ConfirmarEliminarProducto producto={confirmaEliminar ? producto : null} onCerrar={() => setConfirmaEliminar(false)} onListo={onListo} />
    </form>
  )
}
