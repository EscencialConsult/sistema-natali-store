import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, DollarSign, Info, Package, RotateCcw, Trash2, Wallet } from 'lucide-react'
import ConfirmarBorrado from '../../components/ConfirmarBorrado.jsx'
import ExportarExcel from '../../components/ExportarExcel.jsx'
import FiltroMoneda from '../../components/FiltroMoneda.jsx'
import { Avatar, Badge, Button, Dato, Encabezado, EmptyState, ErrorState, Select, Skeleton, Tabs, TARJETA, useToast } from '../../components/ui/index.js'
import { usePerfiles, useVentasConItems } from '../../data/hooks.js'
import { ventas as repoVentas } from '../../data/repos/index.js'
import { comisionDeDocenas, comisionesPorVendedor, COMISION_DOCENA_USD_CENT, docenasDe } from '../../lib/comisiones.js'
import { textoCantidad } from '../../lib/docenas.js'
import { etiquetaDe, nombreArchivo, textoMonedas } from '../../lib/excel.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear, META_MONEDA, MONEDAS, totalesPorMoneda } from '../../lib/moneda.js'
import { PERIODOS, rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import { libroComisiones } from './exportarComisiones.js'

const filtrarPorEstado = (lista, estado) =>
  estado === 'pendientes' ? lista.filter((v) => !v.comision_pagada) : estado === 'pagadas' ? lista.filter((v) => !!v.comision_pagada) : lista

// Comisión por vendedor (lib/comisiones.js): USD 1 por docena, USD 0,50 por media docena, siempre en dólares.
// Las anuladas no suman. Lo vendido se muestra separado por moneda: nunca se suman monedas distintas.
// Admin/superadmin marcan comisiones como pagadas o las eliminan de la pantalla (solo se ocultan: la nota no se toca).
export default function ComisionesPage() {
  const { usuario } = useAuth()
  const avisar = useToast()
  const verTodas = puede(usuario.rol, 'comisiones.ver_todas')
  const puedeGestionar = ['admin', 'superadmin'].includes(usuario.rol)
  const [periodo, setPeriodo] = useState('mes')
  const [moneda, setMoneda] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [estadoComision, setEstadoComision] = useState('pendientes')
  const [expandidos, setExpandidos] = useState(() => new Set())
  const [borrandoCard, setBorrandoCard] = useState(null)
  const [borrandoNota, setBorrandoNota] = useState(null)
  const rango = useMemo(() => rangoDe(periodo), [periodo])
  const ventas = useVentasConItems({
    estado: 'activa',
    moneda: moneda || undefined,
    desde: rango.desde ?? undefined,
    hasta: rango.hasta ?? undefined,
    vendedor_id: verTodas ? vendedorId || undefined : usuario.id,
  })
  const equipo = usePerfiles({ soloActivos: false })

  const visibles = useMemo(() => (ventas.datos ?? []).filter((v) => !v.comision_oculta), [ventas.datos])
  const conteoPagadas = visibles.filter((v) => !!v.comision_pagada).length

  const filas = useMemo(() => {
    if (!equipo.datos) return []
    const nombre = new Map(equipo.datos.map((p) => [p.id, p.nombre]))
    return comisionesPorVendedor(filtrarPorEstado(visibles, estadoComision))
      .map((f) => ({ ...f, nombre: nombre.get(f.vendedor_id) ?? f.ventas[0]?.vendedor_nombre ?? '—', totales: totalesPorMoneda(f.ventas) }))
      .sort((a, b) => b.comision_usd_cent - a.comision_usd_cent || a.nombre.localeCompare(b.nombre, 'es'))
  }, [visibles, estadoComision, equipo.datos])

  const alternar = (id) =>
    setExpandidos((prev) => {
      const sig = new Set(prev)
      if (!sig.delete(id)) sig.add(id)
      return sig
    })

  const marcarPagada = async (ids, pagada) => {
    try {
      await repoVentas.marcarComision(ids, { pagada })
      const varias = ids.length > 1
      avisar(
        pagada
          ? varias ? `${ids.length} comisiones marcadas como pagadas` : 'Comisión marcada como pagada'
          : varias ? `${ids.length} comisiones vueltas a pendiente` : 'Comisión vuelta a pendiente',
        'exito',
      )
    } catch (e) {
      avisar(e.message, 'error')
    }
  }
  // Lo llama ConfirmarBorrado: si falla, el error queda en el modal.
  const ocultar = async (ids) => {
    await repoVentas.marcarComision(ids, { oculta: true })
    avisar(ids.length > 1 ? 'Comisiones eliminadas de la pantalla' : 'Comisión eliminada de la pantalla', 'exito')
  }

  const opcVendedor = [{ valor: '', etiqueta: 'Todos' }, ...(equipo.datos ?? []).map((p) => ({ valor: p.id, etiqueta: p.nombre }))]
  const opcEstadoExportar = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'pendientes', etiqueta: 'Solo no pagadas' },
    { valor: 'pagadas', etiqueta: 'Solo pagadas' },
  ]
  const camposExportar = [
    ...(verTodas ? [{ tipo: 'select', clave: 'vendedor_id', etiqueta: 'Vendedor/a', opciones: opcVendedor }] : []),
    { tipo: 'select', clave: 'estado_comision', etiqueta: 'Comisiones a exportar', opciones: opcEstadoExportar },
  ]
  const generarExcel = async (x) => {
    const lista = await repoVentas.listarConItems({
      estado: 'activa',
      comision_oculta: false,
      vendedor_id: verTodas ? x.vendedor_id || undefined : usuario.id,
      desde: x.desde,
      hasta: x.hasta,
    }).then((l) => filtrarPorEstado(l.filter((v) => x.monedas.includes(v.moneda)), x.estado_comision))
    const nombres = new Map((equipo.datos ?? []).map((p) => [p.id, p.nombre]))
    const filtrosTexto = [
      ['Período', x.periodoTexto],
      ['Vendedor/a', verTodas ? etiquetaDe(opcVendedor, x.vendedor_id) : usuario.nombre],
      ['Estado comisión', etiquetaDe(opcEstadoExportar, x.estado_comision)],
      ['Monedas', textoMonedas(x.monedas, MONEDAS)],
    ]
    return { libro: libroComisiones(lista, nombres, filtrosTexto), nombre: nombreArchivo('comisiones') }
  }

  const totalComision = filas.reduce((t, f) => t + f.comision_usd_cent, 0)
  const totalDocenas = filas.reduce((t, f) => t + f.docenas, 0)
  const cargando = ventas.cargando || equipo.cargando
  const estados = [
    { valor: 'pendientes', etiqueta: `No pagadas (${visibles.length - conteoPagadas})` },
    { valor: 'pagadas', etiqueta: `Pagadas (${conteoPagadas})` },
    { valor: 'todas', etiqueta: `Todas (${visibles.length})` },
  ]
  const tituloTotal = {
    pendientes: verTodas ? 'Comisión no pagada (equipo)' : 'Tu comisión no pagada',
    pagadas: verTodas ? 'Comisión pagada (equipo)' : 'Tu comisión pagada',
    todas: verTodas ? 'Comisión del equipo' : 'Tu comisión',
  }[estadoComision]

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo={verTodas ? 'Comisiones' : 'Mi comisión'}
        descripcion={`Docena = ${formatear(COMISION_DOCENA_USD_CENT, 'usd')} · media docena = ${formatear(COMISION_DOCENA_USD_CENT / 2, 'usd')}. Siempre en dólares; las ventas anuladas no suman.`}
        acciones={<ExportarExcel titulo="Exportar comisiones a Excel" periodo monedas campos={camposExportar} generar={generarExcel} />}
      />

      <div className="flex flex-col gap-3">
        <Tabs items={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))} valor={periodo} onChange={setPeriodo} />
        <div className="flex flex-wrap items-center gap-3">
          <Tabs items={estados} valor={estadoComision} onChange={setEstadoComision} />
          <FiltroMoneda valor={moneda} onChange={setMoneda} />
          {verTodas && equipo.datos && (
            <div className="w-full sm:w-64">
              <Select ariaLabel="Filtrar por vendedor" opciones={opcVendedor} valor={vendedorId} onChange={setVendedorId} placeholder="Todos" />
            </div>
          )}
        </div>
      </div>

      {cargando && <Skeleton className="h-40" />}
      {(ventas.error || equipo.error) && <ErrorState mensaje="No pudimos cargar las ventas." onReintentar={() => { ventas.reintentar(); equipo.reintentar() }} />}

      {!cargando && ventas.datos && equipo.datos && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-2 gap-3">
            <Dato etiqueta={tituloTotal} valor={formatear(totalComision, 'usd')} icono={DollarSign} tono={estadoComision === 'pagadas' ? 'info' : 'exito'} />
            <Dato etiqueta="Docenas vendidas" valor={textoCantidad(totalDocenas)} icono={Package} />
          </section>
          {moneda && (
            <p className="-mt-3 flex items-center gap-2 text-xs text-texto-suave">
              <Info size={14} strokeWidth={1.75} aria-hidden /> Solo se cuentan las ventas en {META_MONEDA[moneda].nombre}. La comisión igual se paga en dólares.
            </p>
          )}

          {filas.length === 0 ? (
            <EmptyState
              icono={Wallet}
              titulo={estadoComision === 'pendientes' ? 'No hay comisiones pendientes' : estadoComision === 'pagadas' ? 'No hay comisiones pagadas en este período' : 'No hay ventas en este período'}
              texto="Probá con otro período o con otros filtros."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filas.map((f) => {
                const abierto = expandidos.has(f.vendedor_id)
                const idsPendientes = f.ventas.filter((v) => !v.comision_pagada).map((v) => v.id)
                const idsPagadas = f.ventas.filter((v) => !!v.comision_pagada).map((v) => v.id)
                return (
                  <li key={f.vendedor_id} className={`${TARJETA} flex flex-col gap-4 p-4 sm:p-5`}>
                    <div className="flex items-center gap-3">
                      <Avatar nombre={f.nombre} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-base sm:text-lg">{f.nombre}</h2>
                          {idsPendientes.length === 0 && idsPagadas.length > 0 && <Badge tono="exito">Al día</Badge>}
                        </div>
                        <p className="text-sm text-texto-suave tabular-nums">
                          {f.ventas.length} {f.ventas.length === 1 ? 'venta' : 'ventas'} · {textoCantidad(f.docenas)} {f.docenas === 1 ? 'docena' : 'docenas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-texto-suave">{estadoComision === 'pagadas' ? 'Pagado' : estadoComision === 'todas' ? 'Comisión' : 'A pagar'}</p>
                        <p className="font-titulo text-2xl font-semibold tabular-nums text-exito">{formatear(f.comision_usd_cent, 'usd')}</p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-borde pt-3 sm:grid-cols-2">
                      {f.totales.map((t) => (
                        <div key={t.moneda} className="flex justify-between gap-3 text-sm">
                          <dt className="text-texto-suave">Vendido en {META_MONEDA[t.moneda].nombre}</dt>
                          <dd className="font-medium tabular-nums">{formatear(t.total_cent, t.moneda)}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borde pt-3">
                      <Button variante="secundario" className="text-sm" icono={abierto ? ChevronUp : ChevronDown} onClick={() => alternar(f.vendedor_id)}>
                        {abierto ? 'Ocultar notas' : `Ver notas (${f.ventas.length})`}
                      </Button>
                      {puedeGestionar && (
                        <div className="flex flex-wrap items-center gap-2">
                          {idsPendientes.length > 0 ? (
                            <Button variante="suave" className="text-sm" icono={Check} onClick={() => marcarPagada(idsPendientes, true)}>
                              Pagar todo ({idsPendientes.length})
                            </Button>
                          ) : (
                            <Button variante="fantasma" className="text-sm" icono={RotateCcw} onClick={() => marcarPagada(idsPagadas, false)}>
                              Volver a pendiente
                            </Button>
                          )}
                          <Button variante="peligro_suave" className="text-sm" icono={Trash2} onClick={() => setBorrandoCard({ nombre: f.nombre, ids: f.ventas.map((v) => v.id) })}>
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </div>

                    {abierto && (
                      <ul className="flex flex-col divide-y divide-borde rounded-control border border-borde bg-superficie-2/50 px-3">
                        {f.ventas.map((v) => {
                          const docenas = docenasDe(v.items)
                          return (
                            <li key={v.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold">{v.numero}</span>
                                  <span className="text-xs text-texto-suave">· {fechaCorta(v.creada_en)}</span>
                                  <Badge tono={v.comision_pagada ? 'exito' : 'alerta'}>{v.comision_pagada ? 'Pagada' : 'Pendiente'}</Badge>
                                </div>
                                <p className="truncate text-xs text-texto-suave">
                                  {v.cliente_nombre || 'Sin cliente'} · {textoCantidad(docenas)} {docenas === 1 ? 'docena' : 'docenas'} · Total: {formatear(v.total_cent, v.moneda)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <span className="font-titulo text-base font-semibold tabular-nums text-exito">{formatear(comisionDeDocenas(docenas), 'usd')}</span>
                                {puedeGestionar && (
                                  <div className="flex items-center gap-1">
                                    {v.comision_pagada ? (
                                      <Button variante="fantasma" className="text-sm" icono={RotateCcw} onClick={() => marcarPagada([v.id], false)}>Desmarcar</Button>
                                    ) : (
                                      <Button variante="suave" className="text-sm" icono={Check} onClick={() => marcarPagada([v.id], true)}>Pagar</Button>
                                    )}
                                    <Button variante="peligro_suave" className="px-3" icono={Trash2} aria-label={`Eliminar comisión de la nota ${v.numero}`} onClick={() => setBorrandoNota({ id: v.id, numero: v.numero })} />
                                  </div>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmarBorrado
        abierto={!!borrandoCard}
        onCerrar={() => setBorrandoCard(null)}
        titulo={`¿Eliminar las comisiones de ${borrandoCard?.nombre}?`}
        etiqueta="Sí, eliminar de la pantalla"
        onConfirmar={() => ocultar(borrandoCard.ids)}
      >
        <p>Estas comisiones dejan de mostrarse en pantalla. Las notas de venta, el stock y los productos no se modifican.</p>
      </ConfirmarBorrado>
      <ConfirmarBorrado
        abierto={!!borrandoNota}
        onCerrar={() => setBorrandoNota(null)}
        titulo={`¿Eliminar la comisión de la nota ${borrandoNota?.numero}?`}
        etiqueta="Sí, eliminar de la pantalla"
        onConfirmar={() => ocultar([borrandoNota.id])}
      >
        <p>La comisión deja de mostrarse en pantalla. La nota de venta queda intacta en el historial.</p>
      </ConfirmarBorrado>
    </div>
  )
}
