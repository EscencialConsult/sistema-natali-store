// Contraseñas de los usuarios LOCALES (sin servidor). Nunca se guarda la contraseña: solo un hash PBKDF2-SHA256 con sal propia.
// Con Supabase las contraseñas las maneja Supabase Auth y esto no se usa.

const ITERACIONES = 120_000
export const CLAVE_MINIMA = 6

const aHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const deHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => Number.parseInt(h, 16)))

export const nuevaSal = () => aHex(crypto.getRandomValues(new Uint8Array(16)))

export async function hashClave(clave, sal) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: deHex(sal), iterations: ITERACIONES }, base, 256)
  return aHex(bits)
}

// Comparación en tiempo constante (no corta en el primer carácter distinto).
export async function verificarClave(clave, sal, hash) {
  if (!sal || !hash) return false
  const calculado = await hashClave(clave, sal)
  let dif = calculado.length ^ hash.length
  for (let i = 0; i < calculado.length; i++) dif |= calculado.charCodeAt(i) ^ hash.charCodeAt(i % hash.length)
  return dif === 0
}

export function validarClave(clave) {
  if (!clave || clave.length < CLAVE_MINIMA) return `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`
  if (/^\s|\s$/.test(clave)) return 'La contraseña no puede empezar ni terminar con espacios.'
  return null
}

// El colaborador ingresa con su CI (carnet de identidad). Se guarda sin espacios y en mayúsculas,
// para que "1234567 lp" y "1234567LP" sean el mismo CI. Acepta complemento/extensión (ej. 1234567-1A, 1234567LP).
export const normalizarCi = (s = '') => String(s).replace(/\s+/g, '').toUpperCase()

export function validarCi(ci) {
  if (!ci) return 'Ingresá el CI.'
  if (!/^\d{4,12}(-?[0-9A-Z]{1,4})?$/.test(ci)) return 'El CI son números, con complemento o extensión opcional (ej. 1234567 o 1234567-1A).'
  return null
}
