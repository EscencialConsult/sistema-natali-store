// Repositorio de perfiles (usuarios del sistema).
//   listar({ soloActivos }) · obtener(id) · actualizar(id, cambios)
//   Gestión (solo superadmin; el servidor lo controla): crear(datos) · editar(id, cambios) · cambiarClave(id, clave)
// La lectura sale de la copia local (funciona sin internet). Crear, editar y cambiar contraseñas lo hace Supabase
// (funciones que exigen superadmin) y después se actualiza la copia local. Eso necesita conexión.
import { db } from '../../db.js'
import { obtenerSupabase } from '../../supabase.js'
import { encolar } from '../../sync/cola.js'
import { normalizarUsuario, validarClave, validarUsuario } from '../../../lib/clave.js'
import { ROLES } from '../../../lib/permisos.js'

const CAMPOS_PERFIL = ['id', 'nombre', 'iniciales', 'rol', 'telefono', 'activo', 'usuario']
const SIN_RED = 'Hace falta conexión a internet para gestionar usuarios.'

function validarDatos({ nombre, usuario, rol }) {
  if (!nombre?.trim()) throw new Error('Ingresá el nombre.')
  if (!ROLES[rol]) throw new Error('Elegí un rol válido.')
  const u = normalizarUsuario(usuario)
  const errU = validarUsuario(u)
  if (errU) throw new Error(errU)
  return u
}

async function rpc(nombre, args) {
  const sb = await obtenerSupabase()
  let r
  try {
    r = await sb.rpc(nombre, args)
  } catch {
    throw new Error(SIN_RED)
  }
  if (r.error) throw new Error(/fetch|network/i.test(r.error.message) ? SIN_RED : r.error.message)
  return r.data
}

async function traerPerfil(id) {
  const sb = await obtenerSupabase()
  const { data, error } = await sb.from('naty_perfiles').select(CAMPOS_PERFIL.join(',')).eq('id', id).single()
  if (error) throw new Error(error.message)
  await db.perfiles.put(data)
  return data
}

export const perfiles = {
  async listar({ soloActivos = true } = {}) {
    const todos = await db.perfiles.toArray()
    return todos.filter((p) => !soloActivos || p.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },
  obtener: (id) => db.perfiles.get(id),

  // Cambios simples (teléfono desde Ajustes): se guardan local y se envían por la cola.
  async actualizar(id, cambios) {
    await db.transaction('rw', db.perfiles, db.cola_sync, async () => {
      await db.perfiles.update(id, cambios)
      await encolar({ operacion: 'actualizar', entidad: 'perfil', entidad_id: id })
    })
    return db.perfiles.get(id)
  },

  async crear({ nombre, usuario, rol, clave, telefono }) {
    const u = validarDatos({ nombre, usuario, rol })
    const errC = validarClave(clave)
    if (errC) throw new Error(errC)
    const id = await rpc('naty_crear_usuario', { p_usuario: u, p_nombre: nombre.trim(), p_rol: rol, p_clave: clave, p_telefono: telefono?.trim() || null })
    return traerPerfil(id)
  },

  async editar(id, { nombre, usuario, rol, telefono, activo }) {
    const u = validarDatos({ nombre, usuario, rol })
    await rpc('naty_editar_usuario', { p_id: id, p_usuario: u, p_nombre: nombre.trim(), p_rol: rol, p_telefono: telefono?.trim() || null, p_activo: !!activo })
    return traerPerfil(id)
  },

  async cambiarClave(id, clave) {
    const errC = validarClave(clave)
    if (errC) throw new Error(errC)
    await rpc('naty_cambiar_clave', { p_id: id, p_clave: clave })
  },
}
