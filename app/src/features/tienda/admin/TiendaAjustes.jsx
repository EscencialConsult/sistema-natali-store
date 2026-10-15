// Editor de la tienda pública, para la pantalla Ajustes del sistema de nota. Escribe SOLO en `tienda_config`,
// con el cliente autenticado, y nunca en `naty_config` (por eso no usa config.guardar del sistema de nota).
// Mientras la tabla no exista en la base (antes de aplicar el esquema de la tienda) no muestra nada.
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, useToast } from '../../../components/ui/index.js'
import { obtenerSupabase } from '../../../data/supabase.js'
import { validarComoComprar, validarContactos, validarHorarios, validarLocales, validarTransferencia } from '../lib/configTienda.js'

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
  const [v, setV] = useState({ banco: t.banco ?? '', titular: t.titular ?? '', cuenta: t.cuenta ?? '', alias: t.alias ?? '', nota: t.nota ?? '' })
  const cambiar = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  return (
    <Tarjeta
      titulo="Tienda online · datos de transferencia"
      ayuda="Los ve la clienta al elegir «Transferencia» en su pedido."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const { valor, errores } = validarTransferencia(v)
        if (errores.length) return errores
        await guardarClave('transferencia', valor ?? {})
        return []
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input etiqueta="Banco" value={v.banco} onChange={cambiar('banco')} maxLength={60} />
        <Input etiqueta="Titular" value={v.titular} onChange={cambiar('titular')} maxLength={80} />
        <Input etiqueta="Número de cuenta" value={v.cuenta} onChange={cambiar('cuenta')} maxLength={60} />
        <Input etiqueta="Alias" value={v.alias} onChange={cambiar('alias')} maxLength={60} />
      </div>
      <Input etiqueta="Nota (opcional)" value={v.nota} onChange={cambiar('nota')} maxLength={300} ayuda="Ej.: indicá tu nombre y el modelo en el comprobante." />
    </Tarjeta>
  )
}

function LocalesYTextos({ config, soloLectura }) {
  const [locales, setLocales] = useState(() => {
    const v = validarLocales(config.locales).valor
    return v.length ? v : [{ nombre: '', direccion: '', indicaciones: '', mapa: '' }]
  })
  const [horarios, setHorarios] = useState(() => validarHorarios(config.horarios).valor.join('\n'))
  const [pasos, setPasos] = useState(() => validarComoComprar(config.como_comprar).valor.join('\n'))
  return (
    <Tarjeta
      titulo="Tienda online · locales, horarios y «Cómo comprar»"
      ayuda="Si dejás «Cómo comprar» vacío se usan los pasos por defecto. Un paso por línea."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const l = validarLocales(locales)
        const h = validarHorarios(horarios)
        const p = validarComoComprar(pasos)
        const errores = [...l.errores, ...h.errores, ...p.errores]
        if (errores.length) return errores
        await guardarClave('locales', l.valor)
        await guardarClave('horarios', h.valor)
        await guardarClave('como_comprar', p.valor)
        return []
      }}
    >
      <Filas filas={locales} setFilas={setLocales} nueva={() => ({ nombre: '', direccion: '', indicaciones: '', mapa: '' })} max={6} etiquetaAgregar="Agregar local">
        {(f, set) => (
          <>
            <Input etiqueta="Nombre del local" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={60} />
            <Input etiqueta="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} maxLength={160} />
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
    </Tarjeta>
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
    </>
  )
}
