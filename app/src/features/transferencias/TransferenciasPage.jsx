import { useMemo, useState } from 'react'
import { CheckCircle2, CloudUpload, Landmark, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, CampoBusqueda, Chip, Encabezado, EmptyState, ErrorState, Skeleton, Tabs, TARJETA } from '../../components/ui/index.js'
import { useVentas } from '../../data/hooks.js'
import { cn } from '../../lib/cn.js'
import { fechaCorta } from '../../lib/fechas.js'
import { formatear } from '../../lib/moneda.js'
import { puede } from '../../lib/permisos.js'
import { tieneComprobante } from '../../lib/transferencias.js'
import { useAuth } from '../auth/AuthContext.js'
import CompletarModal from './CompletarModal.jsx'

const FILTROS = [
  { valor: '', etiqueta: 'Todas' },
  { valor: 'con', etiqueta: 'Con comprobante' },
  { valor: 'sin', etiqueta: 'Sin comprobante' },
]

const normalizar = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

// Ventas cobradas por transferencia: las pendientes se completan con el comprobante (o sin él, si lo mostraron en persona).
// Cada vendedora ve las suyas; administración y encargadas, todas.
export default function TransferenciasPage() {
  const { usuario } = useAuth()
  const todas = puede(usuario.rol, 'ventas.ver_todas')
  const propio = todas ? undefined : usuario.id
  const pendientes = useVentas({ transferencia: 'pendiente', estado: 'activa', vendedor_id: propio })
  const completadas = useVentas({ transferencia: 'completada', estado: 'activa', vendedor_id: propio })
  const [pestana, setPestana] = useState('pendiente')
  const [filtro, setFiltro] = useState('')
  const [texto, setTexto] = useState('')
  const [abierta, setAbierta] = useState(null)

  const consulta = pestana === 'pendiente' ? pendientes : completadas
  const lista = useMemo(() => {
    let l = consulta.datos ?? []
    if (pestana === 'completada' && filtro) l = l.filter((v) => tieneComprobante(v) === (filtro === 'con'))
    const t = normalizar(texto.trim())
    if (t) l = l.filter((v) => normalizar(`${v.numero} ${v.cliente_nombre} ${v.vendedor_nombre}`).includes(t))
    return l
  }, [consulta.datos, pestana, filtro, texto])
  // La venta abierta se toma de la lista viva: si se sincroniza mientras el modal está abierto, se ve lo último.
  const ventaAbierta = abierta && [...(pendientes.datos ?? []), ...(completadas.datos ?? [])].find((v) => v.id === abierta)

  const cantidad = (c) => (c.datos ? ` (${c.datos.length})` : '')

  return (
    <div className="flex flex-col gap-5">
      <Encabezado
        volver={{ a: '/inicio', texto: 'Inicio' }}
        titulo="Transferencias"
        descripcion={todas ? 'Ventas cobradas por transferencia. Completalas cuando llegue el comprobante.' : 'Tus ventas cobradas por transferencia. Completalas cuando llegue el comprobante.'}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          etiqueta="Estado de las transferencias"
          items={[
            { valor: 'pendiente', etiqueta: `Pendientes${cantidad(pendientes)}` },
            { valor: 'completada', etiqueta: `Completadas${cantidad(completadas)}` },
          ]}
          valor={pestana}
          onChange={setPestana}
        />
        <CampoBusqueda id="buscar-transferencia" etiqueta="Buscar transferencia" placeholder="Buscar por nota o cliente" valor={texto} onCambiar={setTexto} className="sm:w-72" />
      </div>
      {pestana === 'completada' && (
        <div className="-mt-1 flex flex-wrap gap-2">
          {FILTROS.map((f) => <Chip key={f.valor} activo={filtro === f.valor} onClick={() => setFiltro(f.valor)}>{f.etiqueta}</Chip>)}
        </div>
      )}

      {consulta.cargando && <div role="status" aria-label="Cargando" className="flex flex-col gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {consulta.error && <ErrorState mensaje="No pudimos cargar las transferencias." onReintentar={consulta.reintentar} />}

      {!consulta.cargando && !consulta.error && (lista.length === 0 ? (
        <EmptyState
          icono={pestana === 'pendiente' ? CheckCircle2 : Landmark}
          titulo={texto || filtro ? 'No hay resultados' : pestana === 'pendiente' ? 'No hay transferencias pendientes' : 'Todavía no hay transferencias completadas'}
          texto={texto || filtro ? 'Probá con otra búsqueda o filtro.' : pestana === 'pendiente' ? 'Cada venta nueva cobrada por transferencia aparece acá hasta que la completes.' : 'Las que completes van a aparecer acá.'}
        />
      ) : (
        <ul className={cn(TARJETA, 'flex flex-col divide-y divide-borde/70 p-1 sm:p-2')}>
          {lista.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-2 py-3 sm:flex-nowrap sm:px-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-superficie-2 text-texto-suave">
                <Landmark size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/ventas/${v.id}`} className="font-medium tabular-nums hover:underline">{v.numero}</Link>
                <p className="truncate text-sm text-texto-suave">
                  {v.cliente_nombre || 'Sin nombre de cliente'} · {fechaCorta(v.creada_en)}{todas && v.vendedor_nombre ? ` · ${v.vendedor_nombre}` : ''}
                </p>
                {pestana === 'completada' && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {tieneComprobante(v) ? <Badge tono="exito" icono={Paperclip}>Con comprobante</Badge> : <Badge>Sin comprobante</Badge>}
                    {v.comprobante_blob && <Badge tono="info" icono={CloudUpload}>Por subir</Badge>}
                  </div>
                )}
              </div>
              <span className="ml-auto whitespace-nowrap font-semibold tabular-nums">{formatear(v.total_cent, v.moneda)}</span>
              {pestana === 'pendiente' ? (
                <Button tamano="md" onClick={() => setAbierta(v.id)} className="max-sm:w-full">Completar</Button>
              ) : (
                <Button tamano="md" variante="secundario" onClick={() => setAbierta(v.id)} className="max-sm:w-full">{tieneComprobante(v) ? 'Ver' : 'Adjuntar'}</Button>
              )}
            </li>
          ))}
        </ul>
      ))}

      {ventaAbierta && <CompletarModal key={ventaAbierta.id} venta={ventaAbierta} onCerrar={() => setAbierta(null)} />}
    </div>
  )
}
