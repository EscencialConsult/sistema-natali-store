import { useMemo, useState } from 'react'
import { DollarSign, Info, Package, Wallet } from 'lucide-react'
import ExportarExcel from '../../components/ExportarExcel.jsx'
import FiltroMoneda from '../../components/FiltroMoneda.jsx'
import { Avatar, Dato, Encabezado, EmptyState, ErrorState, Skeleton, Tabs, TARJETA } from '../../components/ui/index.js'
import { usePerfiles, useVentasConItems } from '../../data/hooks.js'
import { ventas as repoVentas } from '../../data/repos/index.js'
import { comisionesPorVendedor, COMISION_DOCENA_USD_CENT } from '../../lib/comisiones.js'
import { textoCantidad } from '../../lib/docenas.js'
import { etiquetaDe, nombreArchivo, textoMonedas } from '../../lib/excel.js'
import { formatear, META_MONEDA, MONEDAS, totalesPorMoneda } from '../../lib/moneda.js'
import { PERIODOS, rangoDe } from '../../lib/periodos.js'
import { puede } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import { libroComisiones } from './exportarComisiones.js'


// Comisión por vendedor (lib/comisiones.js): USD 1 por docena, USD 0,50 por media docena, siempre en dólares.
// Las anuladas no suman. Lo vendido se muestra separado por moneda: nunca se suman monedas distintas.
export default function ComisionesPage() {
  const { usuario } = useAuth()
  const verTodas = puede(usuario.rol, 'comisiones.ver_todas')
  const [periodo, setPeriodo] = useState('mes')
  const [moneda, setMoneda] = useState('')
  const rango = useMemo(() => rangoDe(periodo), [periodo])
  const ventas = useVentasConItems({ estado: 'activa', moneda: moneda || undefined, desde: rango.desde ?? undefined, hasta: rango.hasta ?? undefined, vendedor_id: verTodas ? undefined : usuario.id })
  const equipo = usePerfiles({ soloActivos: false })

  const filas = useMemo(() => {
    if (!ventas.datos || !equipo.datos) return []
    const nombre = new Map(equipo.datos.map((p) => [p.id, p.nombre]))
    return comisionesPorVendedor(ventas.datos)
      .map((f) => ({ ...f, nombre: nombre.get(f.vendedor_id) ?? f.ventas[0]?.vendedor_nombre ?? '—', totales: totalesPorMoneda(f.ventas) }))
      .sort((a, b) => b.comision_usd_cent - a.comision_usd_cent || a.nombre.localeCompare(b.nombre, 'es'))
  }, [ventas.datos, equipo.datos])

  const opcVendedor = [{ valor: '', etiqueta: 'Todos' }, ...(equipo.datos ?? []).map((p) => ({ valor: p.id, etiqueta: p.nombre }))]
  const camposExportar = [
    ...(verTodas ? [{ tipo: 'select', clave: 'vendedor_id', etiqueta: 'Vendedor/a', opciones: opcVendedor }] : []),
  ]
  const generarExcel = async (x) => {
    const lista = await repoVentas.listarConItems({
      estado: 'activa',
      vendedor_id: verTodas ? x.vendedor_id || undefined : usuario.id,
      desde: x.desde,
      hasta: x.hasta,
    }).then((l) => l.filter((v) => x.monedas.includes(v.moneda)))
    const nombres = new Map((equipo.datos ?? []).map((p) => [p.id, p.nombre]))
    const filtrosTexto = [
      ['Período', x.periodoTexto],
      ['Vendedor/a', verTodas ? etiquetaDe(opcVendedor, x.vendedor_id) : usuario.nombre],
      ['Monedas', textoMonedas(x.monedas, MONEDAS)],
    ]
    return { libro: libroComisiones(lista, nombres, filtrosTexto), nombre: nombreArchivo('comisiones') }
  }

  const totalComision = filas.reduce((t, f) => t + f.comision_usd_cent, 0)
  const totalDocenas = filas.reduce((t, f) => t + f.docenas, 0)
  const cargando = ventas.cargando || equipo.cargando

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo={verTodas ? 'Comisiones' : 'Mi comisión'}
        descripcion={`Docena = ${formatear(COMISION_DOCENA_USD_CENT, 'usd')} · media docena = ${formatear(COMISION_DOCENA_USD_CENT / 2, 'usd')}. Siempre en dólares; las ventas anuladas no suman.`}
        acciones={<ExportarExcel titulo="Exportar comisiones a Excel" periodo monedas campos={camposExportar} generar={generarExcel} />}
      />

      <div className="flex flex-col gap-3">
        <Tabs items={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))} valor={periodo} onChange={setPeriodo} />
        <FiltroMoneda valor={moneda} onChange={setMoneda} />
      </div>

      {cargando && <Skeleton className="h-40" />}
      {(ventas.error || equipo.error) && <ErrorState mensaje="No pudimos cargar las ventas." onReintentar={() => { ventas.reintentar(); equipo.reintentar() }} />}

      {!cargando && ventas.datos && equipo.datos && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-2 gap-3">
            <Dato etiqueta={verTodas ? 'Comisión del equipo' : 'Tu comisión'} valor={formatear(totalComision, 'usd')} icono={DollarSign} tono="exito" />
            <Dato etiqueta="Docenas vendidas" valor={textoCantidad(totalDocenas)} icono={Package} />
          </section>
          {moneda && (
            <p className="-mt-3 flex items-center gap-2 text-xs text-texto-suave">
              <Info size={14} strokeWidth={1.75} aria-hidden /> Solo se cuentan las ventas en {META_MONEDA[moneda].nombre}. La comisión igual se paga en dólares.
            </p>
          )}

          {filas.length === 0 ? (
            <EmptyState icono={Wallet} titulo="No hay ventas en este período" texto="Probá con un período más largo u otra moneda." />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filas.map((f) => (
                <li key={f.vendedor_id} className={`${TARJETA} flex flex-col gap-4 p-4 sm:p-5`}>
                  <div className="flex items-center gap-3">
                    <Avatar nombre={f.nombre} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base sm:text-lg">{f.nombre}</h2>
                      <p className="text-sm text-texto-suave tabular-nums">
                        {f.ventas.length} {f.ventas.length === 1 ? 'venta' : 'ventas'} · {textoCantidad(f.docenas)} {f.docenas === 1 ? 'docena' : 'docenas'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-texto-suave">Comisión</p>
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
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
