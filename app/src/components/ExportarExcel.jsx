import { useState } from 'react'
import { CalendarRange, Check, FileSpreadsheet } from 'lucide-react'
import { cn } from '../lib/cn.js'
import { crearLibro, descargarArchivo } from '../lib/excel.js'
import { META_MONEDA, MONEDAS } from '../lib/moneda.js'
import { desdeDeFecha, fechaDeInput, hastaDeFecha, rangoDe } from '../lib/periodos.js'
import { Button, Input, Select, Sheet, useToast } from './ui/index.js'

const PERIODOS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'esta_semana', etiqueta: 'Esta semana' },
  { valor: 'semana', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'todo', etiqueta: 'Todo' },
  { valor: 'rango', etiqueta: 'Rango de fechas' },
]

function Grupo({ titulo, children, className }) {
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-2', className)}>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">{titulo}</legend>
      {children}
    </fieldset>
  )
}

function Opcion({ activa, onClick, children, icono: Icono }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border px-3 text-sm font-medium transition-colors duration-150',
        activa ? 'border-tinta bg-tinte text-sobre-tinte ring-2 ring-tinta/15' : 'border-borde-fuerte bg-superficie text-texto-suave hover:border-texto-tenue hover:text-texto',
      )}
    >
      {Icono && <Icono size={16} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  )
}

/* Botón "Exportar a Excel" + hoja/modal de filtros.
   periodo: muestra los botones de período (por defecto "Este mes") · monedas: muestra los 3 botones de moneda.
   campos: [{ tipo: 'select'|'texto', clave, etiqueta, opciones?, placeholder? }]
   generar(f) recibe { ...campos, desde, hasta (ISO o undefined), periodoTexto, monedas: ['usd', …] } y devuelve
   { libro: { titulo, filtros, hojas }, nombre }. */
export default function ExportarExcel({ titulo, periodo = false, monedas = false, campos = [], generar, deshabilitado, etiqueta = 'Exportar a Excel' }) {
  const avisar = useToast()
  const vacios = { ...Object.fromEntries(campos.map((c) => [c.clave, ''])), periodo: 'mes', rangoDesde: '', rangoHasta: '', monedas: [...MONEDAS] }
  const [abierto, setAbierto] = useState(false)
  const [v, setV] = useState(vacios)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const set = (clave) => (x) => setV((a) => ({ ...a, [clave]: x }))
  const alternarMoneda = (m) => setV((a) => ({ ...a, monedas: a.monedas.includes(m) ? a.monedas.filter((x) => x !== m) : MONEDAS.filter((x) => x === m || a.monedas.includes(x)) }))

  const abrir = () => {
    setV(vacios)
    setError('')
    setAbierto(true)
  }

  const exportar = async (e) => {
    e.preventDefault()
    setError('')
    if (monedas && v.monedas.length === 0) return setError('Elegí al menos una moneda.')
    let desde
    let hasta
    let periodoTexto = ''
    if (periodo) {
      if (v.periodo === 'rango') {
        if (!v.rangoDesde && !v.rangoHasta) return setError('Elegí al menos una de las fechas del rango.')
        if (v.rangoDesde && v.rangoHasta && v.rangoDesde > v.rangoHasta) return setError('La fecha “desde” es posterior a “hasta”.')
        desde = desdeDeFecha(v.rangoDesde) ?? undefined
        hasta = hastaDeFecha(v.rangoHasta) ?? undefined
        periodoTexto = [v.rangoDesde && `desde ${fechaDeInput(v.rangoDesde)}`, v.rangoHasta && `hasta ${fechaDeInput(v.rangoHasta)}`].filter(Boolean).join(' ')
      } else {
        const r = rangoDe(v.periodo)
        desde = r.desde ?? undefined
        hasta = r.hasta ?? undefined
        periodoTexto = PERIODOS.find((p) => p.valor === v.periodo).etiqueta
      }
    }
    setGenerando(true)
    try {
      const { libro, nombre } = await generar({ ...v, desde, hasta, periodoTexto })
      if (!libro.hojas[0]?.filas.length) {
        setError('No hay datos con esos filtros. Probá ampliarlos.')
        return
      }
      descargarArchivo(await crearLibro(libro), nombre)
      avisar('Excel descargado', 'exito')
      setAbierto(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Button variante="secundario" icono={FileSpreadsheet} deshabilitado={deshabilitado} onClick={abrir}>{etiqueta}</Button>
      <Sheet abierto={abierto} onCerrar={() => setAbierto(false)} titulo={titulo} className="sm:w-[min(94vw,46rem)]">
        <form onSubmit={exportar} noValidate className="flex flex-col gap-6">
          {periodo && (
            <Grupo titulo="Período">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PERIODOS.map((p) => (
                  <Opcion key={p.valor} activa={v.periodo === p.valor} onClick={() => set('periodo')(p.valor)} icono={p.valor === 'rango' ? CalendarRange : undefined}>
                    {p.etiqueta}
                  </Opcion>
                ))}
              </div>
              {v.periodo === 'rango' && (
                <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input etiqueta="Desde" type="date" value={v.rangoDesde} onChange={(e) => set('rangoDesde')(e.target.value)} />
                  <Input etiqueta="Hasta" type="date" value={v.rangoHasta} onChange={(e) => set('rangoHasta')(e.target.value)} />
                </div>
              )}
            </Grupo>
          )}

          {monedas && (
            <Grupo titulo="Monedas">
              <div className="grid grid-cols-3 gap-2">
                {MONEDAS.map((m) => (
                  <Opcion key={m} activa={v.monedas.includes(m)} onClick={() => alternarMoneda(m)} icono={v.monedas.includes(m) ? Check : undefined}>
                    <span className="font-titulo">{META_MONEDA[m].simbolo}</span>
                    <span className="max-sm:hidden">{META_MONEDA[m].nombre}</span>
                  </Opcion>
                ))}
              </div>
            </Grupo>
          )}

          {campos.length > 0 && (
            <Grupo titulo="Filtros">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {campos.map((c) =>
                  c.tipo === 'select' ? (
                    <Select key={c.clave} etiqueta={c.etiqueta} opciones={c.opciones} valor={v[c.clave]} onChange={set(c.clave)} />
                  ) : (
                    <Input key={c.clave} etiqueta={c.etiqueta} value={v[c.clave]} onChange={(e) => set(c.clave)(e.target.value)} placeholder={c.placeholder} autoComplete="off" />
                  ),
                )}
              </div>
            </Grupo>
          )}

          {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-borde pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button variante="fantasma" onClick={() => setV(vacios)}>Restablecer</Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variante="fantasma" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" icono={FileSpreadsheet} cargando={generando}>Descargar Excel</Button>
            </div>
          </div>
        </form>
      </Sheet>
    </>
  )
}
