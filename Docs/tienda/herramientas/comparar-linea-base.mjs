// Compara dos fotos de la base (salida de linea-base.sql) y dice si algún objeto naty_* (o `proyectos`) cambió.
// Uso: node comparar-linea-base.mjs antes.json despues.json
// Sale con código 0 si no hay cambios en objetos naty_*, y 1 si los hay.
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const esDeRenzo = (nombre) => /^naty_/.test(nombre) || nombre === 'proyectos'
const clave = (x, campos) => campos.map((c) => x[c]).join(' | ')

// Cada sección: cómo se identifica cada elemento y qué campo del elemento es el nombre de la tabla/objeto.
const SECCIONES = {
  relaciones: { id: ['nombre'], dueno: 'nombre' },
  columnas: { id: ['tabla', 'columna'], dueno: 'tabla' },
  politicas: { id: ['tabla', 'politica'], dueno: 'tabla' },
  funciones: { id: ['nombre', 'args'], dueno: 'nombre' },
  permisos_tablas: { id: ['tabla', 'para', 'permiso'], dueno: 'tabla' },
  permisos_funciones: { id: ['funcion', 'para', 'permiso'], dueno: 'funcion' },
  triggers: { id: ['tabla', 'trigger'], dueno: 'tabla' },
  indices: { id: ['tabla', 'indice'], dueno: 'tabla' },
  restricciones: { id: ['tabla', 'nombre'], dueno: 'tabla' },
}

export function comparar(antes, despues) {
  const cambios = []
  for (const [seccion, { id, dueno }] of Object.entries(SECCIONES)) {
    const a = new Map((antes[seccion] ?? []).filter((x) => esDeRenzo(x[dueno])).map((x) => [clave(x, id), x]))
    const d = new Map((despues[seccion] ?? []).filter((x) => esDeRenzo(x[dueno])).map((x) => [clave(x, id), x]))
    for (const [k, v] of a) {
      if (!d.has(k)) cambios.push(`${seccion}: ELIMINADO ${k}`)
      else if (JSON.stringify(v) !== JSON.stringify(d.get(k))) cambios.push(`${seccion}: MODIFICADO ${k}`)
    }
    for (const k of d.keys()) if (!a.has(k)) cambios.push(`${seccion}: AGREGADO ${k}`)
  }
  const ea = antes.enums ?? {}
  const ed = despues.enums ?? {}
  for (const nombre of new Set([...Object.keys(ea), ...Object.keys(ed)])) {
    if (!esDeRenzo(nombre)) continue
    if (JSON.stringify(ea[nombre]) !== JSON.stringify(ed[nombre])) cambios.push(`enums: MODIFICADO ${nombre}`)
  }
  const ca = antes.config_claves ?? []
  const cd = despues.config_claves ?? []
  for (const k of ca) if (!cd.includes(k)) cambios.push(`config_claves: ELIMINADA ${k}`)
  return cambios
}

export function diferenciasDeFilas(antes, despues) {
  const fa = antes.filas ?? {}
  const fd = despues.filas ?? {}
  return Object.keys({ ...fa, ...fd })
    .filter((t) => esDeRenzo(t) && fa[t] !== fd[t])
    .map((t) => `${t}: ${fa[t] ?? '—'} → ${fd[t] ?? '—'}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [rutaA, rutaD] = process.argv.slice(2)
  if (!rutaA || !rutaD) {
    console.error('Uso: node comparar-linea-base.mjs antes.json despues.json')
    process.exit(2)
  }
  const leer = (r) => JSON.parse(readFileSync(r, 'utf8').replace(/^﻿/, ''))
  const a = leer(rutaA)
  const d = leer(rutaD)
  const cambios = comparar(a, d)
  const filas = diferenciasDeFilas(a, d)
  console.log(cambios.length ? `CAMBIOS en objetos de Renzo (${cambios.length}):\n  ${cambios.join('\n  ')}` : 'Objetos naty_*: SIN CAMBIOS (esquema, permisos, políticas, funciones y triggers idénticos).')
  console.log(filas.length ? `\nFilas que cambiaron (informativo, esperable si hubo ventas en el medio):\n  ${filas.join('\n  ')}` : '\nFilas: sin diferencias.')
  process.exit(cambios.length ? 1 : 0)
}
