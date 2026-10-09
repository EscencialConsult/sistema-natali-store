// Repositorio de perfiles (usuarios del sistema).
//   listar({ soloActivos }) · obtener(id) · actualizar(id, cambios)
//   Gestión (solo superadmin, se pasa quién la hace en `por`): crear(datos, { por }) · editar(id, cambios, { por }) · cambiarClave(id, clave, { por })
//   Ingreso local: verificarCredenciales(ci, clave)
// Las contraseñas nunca salen de este archivo: lo que se lista u obtiene viene sin hash ni sal.
import { db } from '../../db.js'
import { encolar } from '../../sync/cola.js'
import { hashClave, normalizarCi, nuevaSal, validarCi, validarClave, verificarClave } from '../../../lib/clave.js'
import { nuevoId } from '../../../lib/id.js'
import { puede, ROLES } from '../../../lib/permisos.js'
import { iniciales } from '../../seed/perfiles.js'

const publico = (p) => {
  if (!p) return p
  // eslint-disable-next-line no-unused-vars
  const { clave_hash, clave_sal, ...resto } = p
  return resto
}

async function exigirGestor(por) {
  const actor = por ? await db.perfiles.get(por) : null
  if (!actor?.activo || !puede(actor.rol, 'usuarios.gestionar')) throw new Error('No tenés permiso para gestionar usuarios.')
  return actor
}

async function exigirCiLibre(ci, excepto) {
  const otro = await db.perfiles.where('ci').equals(ci).first()
  if (otro && otro.id !== excepto) throw new Error(`Ya hay un usuario con el CI ${ci} (${otro.nombre}).`)
}

// Nunca puede quedar el sistema sin un superadmin activo.
async function exigirOtroSuperadmin(id) {
  const activos = await db.perfiles.where('rol').equals('superadmin').filter((p) => p.activo && p.id !== id).count()
  if (activos === 0) throw new Error('Tiene que quedar al menos un superadmin activo.')
}

function validarDatos({ nombre, rol }) {
  if (!nombre?.trim()) throw new Error('Ingresá el nombre.')
  if (!ROLES[rol]) throw new Error('Elegí un rol válido.')
}

export const perfiles = {
  async listar({ soloActivos = true } = {}) {
    const todos = await db.perfiles.toArray()
    return todos
      .filter((p) => !soloActivos || p.activo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(publico)
  },
  obtener: async (id) => publico(await db.perfiles.get(id)),

  async actualizar(id, cambios) {
    await db.transaction('rw', db.perfiles, db.cola_sync, async () => {
      await db.perfiles.update(id, cambios)
      await encolar({ operacion: 'actualizar', entidad: 'perfil', entidad_id: id })
    })
    return publico(await db.perfiles.get(id))
  },

  async crear({ nombre, ci, rol, clave, telefono }, { por } = {}) {
    await exigirGestor(por)
    validarDatos({ nombre, rol })
    const c = normalizarCi(ci)
    const errCi = validarCi(c)
    if (errCi) throw new Error(errCi)
    const errC = validarClave(clave)
    if (errC) throw new Error(errC)
    await exigirCiLibre(c)
    const clave_sal = nuevaSal()
    const perfil = {
      id: nuevoId(),
      nombre: nombre.trim(),
      iniciales: iniciales(nombre.trim()),
      ci: c,
      rol,
      telefono: telefono?.trim() || null,
      activo: true,
      clave_sal,
      clave_hash: await hashClave(clave, clave_sal),
      creado_en: new Date().toISOString(),
    }
    await db.perfiles.add(perfil)
    return publico(perfil)
  },

  async editar(id, { nombre, ci, rol, telefono, activo }, { por } = {}) {
    await exigirGestor(por)
    const actual = await db.perfiles.get(id)
    if (!actual) throw new Error('Ese usuario ya no existe.')
    validarDatos({ nombre, rol })
    const c = normalizarCi(ci)
    const errCi = validarCi(c)
    if (errCi) throw new Error(errCi)
    await exigirCiLibre(c, id)
    if (actual.rol === 'superadmin' && actual.activo && (rol !== 'superadmin' || !activo)) await exigirOtroSuperadmin(id)
    if (id === por && !activo) throw new Error('No podés darte de baja a vos mismo/a.')
    return perfiles.actualizar(id, { nombre: nombre.trim(), iniciales: iniciales(nombre.trim()), ci: c, rol, telefono: telefono?.trim() || null, activo: !!activo })
  },

  async cambiarClave(id, clave, { por } = {}) {
    await exigirGestor(por)
    const errC = validarClave(clave)
    if (errC) throw new Error(errC)
    const clave_sal = nuevaSal()
    await db.perfiles.update(id, { clave_sal, clave_hash: await hashClave(clave, clave_sal) })
  },

  async verificarCredenciales(ci, clave) {
    const c = normalizarCi(ci)
    const p = c ? await db.perfiles.where('ci').equals(c).first() : null
    // Mismo mensaje si no existe o si la contraseña no coincide: no se revela qué CI están registrados.
    if (!p || !(await verificarClave(clave, p.clave_sal, p.clave_hash))) throw new Error('CI o contraseña incorrectos.')
    if (!p.activo) throw new Error('Este usuario está dado de baja. Hablá con la administración.')
    return publico(p)
  },
}
