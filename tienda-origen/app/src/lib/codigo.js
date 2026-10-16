// Los códigos tienen forma "MN-005": letras + número. La persona escribe como le sale ("mn5", "5", "MN 05").

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

// Próximo código libre: toma el prefijo más usado entre los códigos con forma "MN-005" y suma uno al número más alto.
// `codigos` incluye también los de productos dados de baja, para no reutilizar un código viejo.
export function siguienteCodigo(codigos, prefijoPorDefecto = 'MN') {
  const cuentas = new Map()
  const maximos = new Map()
  for (const c of codigos ?? []) {
    const { letras, digitos } = partirCodigo(c)
    if (!letras || !digitos) continue
    cuentas.set(letras, (cuentas.get(letras) ?? 0) + 1)
    maximos.set(letras, Math.max(maximos.get(letras) ?? 0, Number(digitos)))
  }
  const prefijo = [...cuentas.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? prefijoPorDefecto
  return formatearCodigo(prefijo, (maximos.get(prefijo) ?? 0) + 1)
}
