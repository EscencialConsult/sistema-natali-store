// Códigos de los pedidos hechos desde este dispositivo. Sirve para mostrar /pedido/:codigo sin pedir el teléfono
// a quien acaba de comprar; cualquier otro código va a /seguimiento (privacidad mínima; la etapa 4 lo valida en el servidor).
const CLAVE = 'tienda.mis_pedidos'
const MAX = 20

const leer = () => {
  try {
    const l = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(l) ? l : []
  } catch {
    return []
  }
}

// Cada entrada: { codigo, telefono, id }. Las entradas viejas eran solo el código (texto): se siguen leyendo.
const normalizar = (e) => (typeof e === 'string' ? { codigo: e, telefono: '', id: '' } : e)
const entradas = () => leer().map(normalizar).filter((e) => e?.codigo)

export const esMiPedido = (codigo) => entradas().some((e) => e.codigo === codigo)

// Datos guardados de un pedido hecho desde este dispositivo, por código o por id (null si no es de acá).
export const datosDeMiPedido = (codigoOId) => entradas().find((e) => e.codigo === codigoOId || (e.id && e.id === codigoOId)) ?? null

export function recordarPedido(codigo, { telefono = '', id = '' } = {}) {
  try {
    const l = [{ codigo, telefono: String(telefono).replace(/\D/g, ''), id }, ...entradas().filter((e) => e.codigo !== codigo)].slice(0, MAX)
    localStorage.setItem(CLAVE, JSON.stringify(l))
  } catch {
    /* sin almacenamiento: el seguimiento pide el teléfono */
  }
}

// Datos del comprador para la próxima compra (opt-in en el checkout).
const CLAVE_COMPRADOR = 'tienda.comprador'
export function leerComprador() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_COMPRADOR) ?? 'null')
  } catch {
    return null
  }
}
export function guardarComprador(datos) {
  try {
    if (datos) localStorage.setItem(CLAVE_COMPRADOR, JSON.stringify(datos))
    else localStorage.removeItem(CLAVE_COMPRADOR)
  } catch {
    /* nada */
  }
}
