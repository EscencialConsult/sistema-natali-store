// Los códigos tienen forma "MN-005": letras + número. El vendedor escribe como le sale ("mn5", "5", "MN 05").

export function partirCodigo(texto) {
  const limpio = String(texto ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const m = limpio.match(/^([A-Z]*)(\d*)(.*)$/)
  return { letras: m[1], digitos: m[2], resto: m[3] }
}

export const formatearCodigo = (prefijo, n) => `${prefijo}-${String(n).padStart(3, '0')}`

// Puntaje para ordenar resultados: menor es mejor; null = no coincide.
export function puntajeCodigo(consulta, codigo) {
  const q = partirCodigo(consulta)
  const c = partirCodigo(codigo)
  if (!q.letras && !q.digitos) return null
  if (q.letras && !c.letras.startsWith(q.letras)) return null
  if (!q.digitos) return 1
  const qn = String(Number(q.digitos))
  const cn = String(Number(c.digitos))
  if (qn === cn) return 0
  if (cn.startsWith(qn)) return 2 + Number(c.digitos) / 1e6
  return null
}
