// Editor de la tienda pública, para la pantalla Ajustes del sistema de nota. Escribe SOLO en `tienda_config`,
// con el cliente autenticado, y nunca en `naty_config` (por eso no usa config.guardar del sistema de nota).
// Mientras la tabla no exista en la base (antes de aplicar el esquema de la tienda) no muestra nada.
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, useToast } from '../../../components/ui/index.js'
import { obtenerSupabase } from '../../../data/supabase.js'
import { DIAS_AVISO_EN_AJUSTES, diasDesde, formatearCuit, validarComoComprar, validarContactos, validarHorarios, validarLocales, validarQuienesSomos, validarTransferencia } from '../lib/configTienda.js'

const sinTabla = (e) => e?.code === '42P01' || e?.code === 'PGRST205' || /tienda_config/.test(e?.message ?? '') && /does not exist|schema cache/i.test(e?.message ?? '')

async function leerTodo() {
  const sb = await obtenerSupabase()
  const { data, error } = await sb.from('tienda_config').select('clave,valor')
  if (error) throw error
  return Object.fromEntries(data.map((f) => [f.clave, f.valor]))
}

async function guardarClave(clave, valor) {
  const sb = await obtenerSupabase()
  const { error } = await sb.from('tienda_config').upsert({ clave, valor, publico: true }, { onConflict: 'clave' })
  if (error) {
    if (error.code === '42501' || /row-level security|permission denied/i.test(error.message)) throw new Error('Solo la administración puede cambiar estos datos.')
    throw new Error('No se pudo guardar. Revisá tu conexión e intentá de nuevo.')
  }
}

function Tarjeta({ titulo, ayuda, onGuardar, soloLectura, children }) {
  const avisar = useToast()
  const [errores, setErrores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const guardar = async (e) => {
    e.preventDefault()
    setErrores([])
    setGuardando(true)
    try {
      const problemas = await onGuardar()
      if (problemas?.length) setErrores(problemas)
      else avisar('Cambios guardados', 'exito')
    } catch (err) {
      setErrores([err.message])
    } finally {
      setGuardando(false)
    }
  }
  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5">
      <div>
        <h2 className="text-lg">{titulo}</h2>
        {ayuda && <p className="text-sm text-texto-suave">{ayuda}</p>}
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">{children}</fieldset>
      {errores.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 rounded-control bg-error-fondo p-3 text-sm text-error">
          {errores.map((m) => <li key={m}>{m}</li>)}
        </ul>
      )}
      {!soloLectura && <Button type="submit" cargando={guardando} className="self-start">Guardar</Button>}
    </form>
  )
}

function Filas({ filas, setFilas, nueva, max, etiquetaAgregar, children }) {
  return (
    <div className="flex flex-col gap-4">
      {filas.map((f, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-control border border-borde/70 p-3">
          {children(f, (campo, valor) => setFilas(filas.map((x, k) => (k === i ? { ...x, [campo]: valor } : x))))}
          <button type="button" onClick={() => setFilas(filas.filter((_, k) => k !== i))} className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-texto-suave hover:text-tinta">
            <Trash2 size={16} aria-hidden /> Quitar
          </button>
        </div>
      ))}
      {filas.length < max && (
        <Button type="button" variante="secundario" icono={Plus} onClick={() => setFilas([...filas, nueva()])} className="self-start">{etiquetaAgregar}</Button>
      )}
    </div>
  )
}

function Contactos({ config, soloLectura }) {
  const [filas, setFilas] = useState(() => {
    const v = validarContactos(config.contactos).valor
    return v.length ? v : [{ nombre: '', telefono: '' }]
  })
  return (
    <Tarjeta
      titulo="Tienda online · vendedores y contactos"
      ayuda="Los que salen para elegir en el pedido y en «Dónde estamos». Con código de país, solo números (ej. 59171234567). Publicá solo los teléfonos que cada persona autorizó."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const { valor, errores } = validarContactos(filas)
        if (errores.length) return errores
        await guardarClave('contactos', valor)
        return []
      }}
    >
      <Filas filas={filas} setFilas={setFilas} nueva={() => ({ nombre: '', telefono: '' })} max={12} etiquetaAgregar="Agregar contacto">
        {(f, set) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input etiqueta="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={60} />
            <Input etiqueta="WhatsApp" inputMode="tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} maxLength={30} placeholder="59171234567" />
          </div>
        )}
      </Filas>
    </Tarjeta>
  )
}

function Transferencia({ config, soloLectura }) {
  const t = validarTransferencia(config.transferencia).valor ?? {}
  const [v, setV] = useState({ banco: t.banco ?? '', titular: t.titular ?? '', cuit: t.cuit ?? '', cbu: t.cbu ?? '', cuenta: t.cuenta ?? '', alias: t.alias ?? '', nota: t.nota ?? '' })
  const dias = diasDesde(t.actualizado_en)
  const hayDatos = Boolean(t.titular || t.cbu || t.alias || t.cuenta)
  const viejo = hayDatos && (dias === null || dias >= DIAS_AVISO_EN_AJUSTES)
  const cambiar = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  return (
    <Tarjeta
      titulo="Tienda online · datos de transferencia"
      ayuda="Los ve la clienta al elegir «Transferencia» en su pedido."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const { valor, errores } = validarTransferencia(v)
        if (errores.length) return errores
        // La fecha de guardado le permite a la tienda avisar cuando el alias lleva mucho sin revisarse.
        await guardarClave('transferencia', valor ? { ...valor, actualizado_en: new Date().toISOString() } : {})
        return []
      }}
    >
      {viejo && (
        <p role="note" className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">
          La cuenta se cambia cada 2 meses y hace {dias === null ? 'mucho' : `${dias} días`} que no se revisa. Si ya cambió, actualizá los datos y guardá de nuevo.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input etiqueta="Titular" value={v.titular} onChange={cambiar('titular')} maxLength={80} />
        <Input etiqueta="CUIT o CUIL" inputMode="numeric" value={v.cuit} onChange={cambiar('cuit')} maxLength={16} ayuda={v.cuit.replace(/\D/g, '').length === 11 ? formatearCuit(v.cuit.replace(/\D/g, '')) : '11 números'} />
        <Input etiqueta="Banco" value={v.banco} onChange={cambiar('banco')} maxLength={60} />
        <Input etiqueta="CBU" inputMode="numeric" value={v.cbu} onChange={cambiar('cbu')} maxLength={30} ayuda="22 números" />
        <Input etiqueta="Alias" value={v.alias} onChange={cambiar('alias')} maxLength={60} />
        <Input etiqueta="Número de cuenta" value={v.cuenta} onChange={cambiar('cuenta')} maxLength={60} />
      </div>
      <Input etiqueta="Nota (opcional)" value={v.nota} onChange={cambiar('nota')} maxLength={300} ayuda="Ej.: indicá tu nombre y el modelo en el comprobante." />
    </Tarjeta>
  )
}

function LocalesYTextos({ config, soloLectura }) {
  const [locales, setLocales] = useState(() => {
    const v = validarLocales(config.locales).valor
    return v.length ? v : [{ nombre: '', direccion: '', indicaciones: '', horario: '', mapa: '' }]
  })
  const [horarios, setHorarios] = useState(() => validarHorarios(config.horarios).valor.join('\n'))
  const [pasos, setPasos] = useState(() => validarComoComprar(config.como_comprar).valor.join('\n'))
  const [quienes, setQuienes] = useState(() => validarQuienesSomos(config.quienes_somos).valor.join('\n'))
  return (
    <Tarjeta
      titulo="Tienda online · locales, horarios y «Cómo comprar»"
      ayuda="Si dejás «Cómo comprar» vacío se usan los pasos por defecto. Un paso por línea."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const l = validarLocales(locales)
        const h = validarHorarios(horarios)
        const p = validarComoComprar(pasos)
        const q = validarQuienesSomos(quienes)
        const errores = [...l.errores, ...h.errores, ...p.errores, ...q.errores]
        if (errores.length) return errores
        await guardarClave('locales', l.valor)
        await guardarClave('horarios', h.valor)
        await guardarClave('como_comprar', p.valor)
        await guardarClave('quienes_somos', q.valor)
        return []
      }}
    >
      <Filas filas={locales} setFilas={setLocales} nueva={() => ({ nombre: '', direccion: '', indicaciones: '', horario: '', mapa: '' })} max={6} etiquetaAgregar="Agregar local">
        {(f, set) => (
          <>
            <Input etiqueta="Nombre del local" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={60} />
            <Input etiqueta="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} maxLength={160} />
            <Input etiqueta="Horario de este local" value={f.horario ?? ''} onChange={(e) => set('horario', e.target.value)} maxLength={160} placeholder="6:00 a 12:00 y 14:00 a 16:00" ayuda="Si el local tiene un horario distinto del general." />
            <Input etiqueta="Cómo llegar (opcional)" value={f.indicaciones} onChange={(e) => set('indicaciones', e.target.value)} maxLength={300} ayuda="Ej.: pasando la chalana, caminá derecho hasta la esquina." />
            <Input etiqueta="Enlace de Google Maps (opcional)" inputMode="url" value={f.mapa} onChange={(e) => set('mapa', e.target.value)} maxLength={500} placeholder="https://maps.app.goo.gl/…" />
          </>
        )}
      </Filas>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Horarios de atención (una línea por día o rango)
        <textarea value={horarios} onChange={(e) => setHorarios(e.target.value)} rows={4} className="rounded-control border border-borde-campo bg-fondo p-3 text-base font-normal" placeholder={'Lunes a sábado: 8:00 a 18:00'} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Pasos de «Cómo comprar» (opcional, uno por línea)
        <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} rows={5} className="rounded-control border border-borde-campo bg-fondo p-3 text-base font-normal" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        «Quiénes somos» (opcional, un párrafo por línea)
        <textarea value={quienes} onChange={(e) => setQuienes(e.target.value)} rows={5} className="rounded-control border border-borde-campo bg-fondo p-3 text-base font-normal" />
      </label>
    </Tarjeta>
  )
}

// Qué modelos se ven en la tienda. Ocultar es editorial: saca el modelo de la tienda, no del catálogo interno.
// Sin borrar nada: «mostrar de nuevo» es poner oculto = false en `tienda_oculto`.
function Visibilidad({ soloLectura }) {
  const avisar = useToast()
  const [estado, setEstado] = useState({ cargando: true, productos: [], ocultos: new Set(), error: '' })
  const [q, setQ] = useState('')

  useEffect(() => {
    let vigente = true
    ;(async () => {
      const sb = await obtenerSupabase()
      const [p, o] = await Promise.all([
        sb.from('naty_productos').select('id,codigo,nombre').eq('activo', true).order('codigo').limit(1000),
        sb.from('tienda_oculto').select('producto_id').eq('oculto', true),
      ])
      if (p.error || o.error) throw p.error ?? o.error
      return { productos: p.data, ocultos: new Set(o.data.map((f) => f.producto_id)) }
    })()
      .then((r) => vigente && setEstado({ cargando: false, error: '', ...r }))
      .catch(() => vigente && setEstado({ cargando: false, productos: [], ocultos: new Set(), error: 'No pudimos cargar los modelos.' }))
    return () => {
      vigente = false
    }
  }, [])

  // El cambio se ve al instante; si el servidor no lo acepta, la casilla vuelve a como estaba.
  const marcar = (id, oculto) =>
    setEstado((e) => {
      const ocultos = new Set(e.ocultos)
      if (oculto) ocultos.add(id)
      else ocultos.delete(id)
      return { ...e, ocultos }
    })

  const cambiar = async (producto, mostrar) => {
    marcar(producto.id, !mostrar)
    try {
      const sb = await obtenerSupabase()
      const { error } = await sb.from('tienda_oculto').upsert({ producto_id: producto.id, oculto: !mostrar }, { onConflict: 'producto_id' })
      if (error) throw error
    } catch {
      marcar(producto.id, mostrar)
      avisar('No se pudo guardar. Revisá tu conexión.', 'error')
    }
  }

  const texto = q.trim().toLowerCase()
  const visibles = estado.productos.filter((p) => !texto || p.codigo.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto)).slice(0, 60)

  return (
    <section className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5" aria-labelledby="visibilidad-tienda">
      <div>
        <h2 id="visibilidad-tienda" className="text-lg">Tienda online · modelos visibles</h2>
        <p className="text-sm text-texto-suave">
          Se muestran los modelos activos que tienen foto. Destildá uno para sacarlo de la tienda; sigue en el catálogo y en las notas.
          {estado.ocultos.size > 0 && ` Ocultos ahora: ${estado.ocultos.size}.`}
        </p>
      </div>
      <Input etiqueta="Buscar modelo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre" />
      {estado.cargando && <p className="text-sm text-texto-suave">Cargando…</p>}
      {estado.error && <p role="alert" className="text-sm text-error">{estado.error}</p>}
      <ul className="flex max-h-96 flex-col overflow-y-auto">
        {visibles.map((p) => (
          <li key={p.id}>
            <label className="flex min-h-11 items-center gap-3 border-t border-borde/50 text-base">
              <input
                type="checkbox"
                disabled={soloLectura}
                checked={!estado.ocultos.has(p.id)}
                onChange={(e) => cambiar(p, e.target.checked)}
                className="size-5 accent-tinta"
              />
              <span className="text-sm text-texto-suave">{p.codigo}</span>
              <span className="min-w-0 truncate">{p.nombre}</span>
            </label>
          </li>
        ))}
      </ul>
      {!estado.cargando && estado.productos.length > visibles.length && !texto && (
        <p className="text-sm text-texto-suave">Mostrando los primeros {visibles.length}. Buscá por código o nombre para encontrar otros.</p>
      )}
    </section>
  )
}

export default function TiendaAjustes({ soloLectura }) {
  const [estado, setEstado] = useState({ cargando: true, config: null, oculto: false })
  useEffect(() => {
    let vigente = true
    leerTodo()
      .then((config) => vigente && setEstado({ cargando: false, config, oculto: false }))
      .catch((e) => vigente && setEstado({ cargando: false, config: null, oculto: true, motivo: sinTabla(e) ? 'sin-tabla' : 'error' }))
    return () => {
      vigente = false
    }
  }, [])

  if (estado.cargando || estado.oculto) return null
  return (
    <>
      <Contactos config={estado.config} soloLectura={soloLectura} />
      <Transferencia config={estado.config} soloLectura={soloLectura} />
      <LocalesYTextos config={estado.config} soloLectura={soloLectura} />
      <Visibilidad soloLectura={soloLectura} />
    </>
  )
}
