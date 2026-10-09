// Reglas de usuario y contraseña. Las contraseñas las guarda y verifica Supabase Auth (nunca la app).
export const CLAVE_MINIMA = 6

export function validarClave(clave) {
  if (!clave || clave.length < CLAVE_MINIMA) return `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`
  if (/^\s|\s$/.test(clave)) return 'La contraseña no puede empezar ni terminar con espacios.'
  return null
}

// Cada colaborador ingresa con su nombre de usuario (solo el nombre, ej. "ariel"). Sin mayúsculas, acentos ni espacios:
// "María" y "maria" son el mismo usuario.
export const normalizarUsuario = (s = '') =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()

export function validarUsuario(usuario) {
  if (!usuario) return 'Ingresá el nombre de usuario.'
  if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) return 'El usuario lleva entre 3 y 30 letras o números (sin espacios ni acentos). Ej.: ariel'
  return null
}

// Correo interno de Supabase Auth para un usuario (el mismo que arma el servidor en naty_email_de_usuario).
export const emailDeUsuario = (usuario) => `${normalizarUsuario(usuario)}@usuarios.modasnaty.internal`
