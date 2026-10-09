import { useMemo, useState } from 'react'
import { Pencil, ShieldCheck, UserPlus, Users, UserX } from 'lucide-react'
import { Avatar, Badge, Button, CampoBusqueda, Dato, Encabezado, EmptyState, ErrorState, FILA, Sheet, Skeleton, Tabs } from '../../components/ui/index.js'
import ExportarExcel from '../../components/ExportarExcel.jsx'
import { usePerfiles } from '../../data/hooks.js'
import { etiquetaDe, nombreArchivo } from '../../lib/excel.js'
import { ROLES } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import UsuarioForm from './UsuarioForm.jsx'

const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const TONO_ROL = { superadmin: 'tinta', admin: 'tinte', enc_ventas: 'info', enc_tienda: 'info', enc_deposito: 'alerta', vendedor: 'neutro' }

// Gestión de usuarios (solo superadmin): alta con rol y contraseña, edición, baja y restablecer contraseña.
export default function UsuariosPage() {
  const { usuario } = useAuth()
  const equipo = usePerfiles({ soloActivos: false })
  const [tab, setTab] = useState('activos')
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(null) // null cerrado · 'nuevo' · perfil

  const todos = useMemo(() => equipo.datos ?? [], [equipo.datos])
  const lista = useMemo(() => {
    const q = norm(texto.trim())
    return todos
      .filter((p) => (tab === 'activos' ? p.activo : !p.activo))
      .filter((p) => !q || norm(`${p.nombre} ${p.usuario ?? ''} ${ROLES[p.rol] ?? ''}`).includes(q))
  }, [todos, tab, texto])
  const activos = todos.filter((p) => p.activo).length

  const opcRol = [{ valor: '', etiqueta: 'Todos' }, ...Object.entries(ROLES).map(([valor, etiqueta]) => ({ valor, etiqueta }))]
  const opcEstado = [{ valor: '', etiqueta: 'Todos' }, { valor: 'activos', etiqueta: 'Activos' }, { valor: 'baja', etiqueta: 'Dados de baja' }]
  const camposExportar = [
    { tipo: 'select', clave: 'rol', etiqueta: 'Rol', opciones: opcRol },
    { tipo: 'select', clave: 'estado', etiqueta: 'Estado', opciones: opcEstado },
  ]
  const generarExcel = async (x) => ({
    nombre: nombreArchivo('usuarios'),
    libro: {
      titulo: 'Modas Naty · Usuarios',
      filtros: [['Rol', etiquetaDe(opcRol, x.rol)], ['Estado', etiquetaDe(opcEstado, x.estado)]],
      hojas: [{
        nombre: 'Usuarios',
        columnas: [
          { titulo: 'Nombre', clave: 'nombre', ancho: 26 },
          { titulo: 'Usuario', clave: 'usuario', ancho: 16 },
          { titulo: 'Rol', clave: 'rol', ancho: 24 },
          { titulo: 'Teléfono', clave: 'telefono', ancho: 16 },
          { titulo: 'Estado', clave: 'estado', ancho: 14, tono: (f) => (f.estado === 'Activo' ? 'exito' : 'error') },
        ],
        filas: todos
          .filter((p) => (!x.rol || p.rol === x.rol) && (!x.estado || (x.estado === 'activos') === p.activo))
          .map((p) => ({ nombre: p.nombre, usuario: p.usuario ?? '', rol: ROLES[p.rol] ?? p.rol, telefono: p.telefono ?? '', estado: p.activo ? 'Activo' : 'Dado de baja' })),
      }],
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Usuarios"
        descripcion="Alta de personas del equipo, su rol y su contraseña. Cada rol ve solo las pantallas que le corresponden."
        acciones={
          <>
            <ExportarExcel titulo="Exportar usuarios a Excel" campos={camposExportar} generar={generarExcel} deshabilitado={!equipo.datos} />
            <Button icono={UserPlus} onClick={() => setEditando('nuevo')}>Nuevo usuario</Button>
          </>
        }
      />

      {equipo.cargando && <div className="flex flex-col gap-2" role="status" aria-label="Cargando">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20" />)}</div>}
      {equipo.error && <ErrorState mensaje="No pudimos cargar los usuarios." onReintentar={equipo.reintentar} />}

      {equipo.datos && (
        <>
          <section aria-label="Resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato etiqueta="Activos" valor={activos} icono={Users} />
            <Dato etiqueta="Dados de baja" valor={todos.length - activos} icono={UserX} tono="error" />
            <Dato etiqueta="Superadmins" valor={todos.filter((p) => p.activo && p.rol === 'superadmin').length} icono={ShieldCheck} className="max-sm:col-span-2" />
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs items={[{ valor: 'activos', etiqueta: 'Activos' }, { valor: 'baja', etiqueta: 'Dados de baja' }]} valor={tab} onChange={setTab} />
            <CampoBusqueda id="buscar-usuario" etiqueta="Buscar usuario" valor={texto} onCambiar={setTexto} placeholder="Nombre, usuario o rol" className="sm:w-80" />
          </div>

          {lista.length === 0 ? (
            <EmptyState icono={Users} titulo={texto ? 'Nadie coincide con la búsqueda' : tab === 'activos' ? 'Todavía no hay usuarios' : 'No hay usuarios dados de baja'} />
          ) : (
            <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {lista.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setEditando(p)} className={`group ${FILA} min-h-[4.75rem] p-3`}>
                    <Avatar nombre={p.nombre} className={p.activo ? '' : 'opacity-50'} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.nombre}</span>
                        {p.id === usuario.id && <Badge tono="neutro">Vos</Badge>}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        {p.usuario ? <span className="text-sm text-texto-suave">@{p.usuario}</span> : <Badge tono="alerta">Sin usuario: no puede ingresar</Badge>}
                        <Badge tono={TONO_ROL[p.rol] ?? 'neutro'}>{ROLES[p.rol] ?? p.rol}</Badge>
                      </span>
                    </span>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-texto-tenue transition-colors group-hover:bg-tinte group-hover:text-tinta">
                      <Pencil size={16} strokeWidth={1.75} aria-hidden />
                      <span className="sr-only">Editar</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Sheet abierto={!!editando} onCerrar={() => setEditando(null)} titulo={editando === 'nuevo' ? 'Nuevo usuario' : `Editar · ${editando?.nombre ?? ''}`} className="sm:w-[min(94vw,40rem)]">
        {editando && <UsuarioForm key={editando === 'nuevo' ? 'nuevo' : editando.id} perfil={editando === 'nuevo' ? null : editando} actorId={usuario.id} onListo={() => setEditando(null)} />}
      </Sheet>
    </div>
  )
}
