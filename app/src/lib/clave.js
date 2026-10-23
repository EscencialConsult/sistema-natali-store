// Reglas de usuario y contraseña. Las contraseñas las guarda y verifica Supabase Auth (nunca la app).
export const CLAVE_MINIMA = 6

export function validarClave(clave) {
  if (!clave || clave.length < CLAVE_MINIMA) return `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`
  if (/^\s|\s$/.test(clave)) return 'La contraseña no puede empezar ni terminar con espacios.'
  return null
}

// La contraseña inicial de cada persona es su CI: solo el número, sin puntos ni complemento ("1.234.567-1A" → "1234567").
// Se toma el primer grupo de dígitos (los puntos del medio se ignoran): quitar todo lo que no sea número pegaría el complemento al número.
// Es un texto, no un número: un CI que empieza con 0 conserva el 0.
export const CI_MAXIMO = 12
export const normalizarCi = (s = '') => (/\d[\d.]*/.exec(String(s))?.[0] ?? '').replace(/\D/g, '')

export function validarCi(ci) {
  const n = normalizarCi(ci)
  if (n.length < CLAVE_MINIMA || n.length > CI_MAXIMO) return `El CI tiene entre ${CLAVE_MINIMA} y ${CI_MAXIMO} números. Escribilo sin puntos ni letras.`
  return null
}

// Qué contraseña sale del formulario de alta o de restablecer. modo 'ci': la contraseña es el CI y el CI se guarda;
// modo 'otra': contraseña libre (la superadmin o quien no use su CI) y no se toca el CI guardado.
export function resolverClave({ modo, ci = '', clave = '', repetir = '' }) {
  if (modo === 'ci') {
    const errCi = validarCi(ci)
    if (errCi) return { error: errCi }
    const n = normalizarCi(ci)
    return { clave: n, ci: n }
  }
  if (clave !== repetir) return { error: 'Las contraseñas no coinciden.' }
  const errClave = validarClave(clave)
  if (errClave) return { error: errClave }
  return { clave, ci: null }
}

// Restablecer: si ya hay un CI guardado y se lo usa, solo cambia la contraseña (ci: null = no hay nada nuevo que guardar).
export function resolverRestablecer({ usarGuardado = false, ciGuardado = null, ...resto }) {
  if (resto.modo === 'ci' && usarGuardado && ciGuardado) return { clave: normalizarCi(ciGuardado), ci: null }
  return resolverClave(resto)
}

// La contraseña se cambia primero y el CI se guarda después; si el segundo paso falla, ya entra con su CI y se puede reintentar.
export const avisoCiSinGuardar = (motivo) => `La contraseña ya es su CI, pero no se pudo guardar el CI (${motivo}). Abrí a la persona y cargalo de nuevo.`

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
