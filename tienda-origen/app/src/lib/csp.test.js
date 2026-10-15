import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CABECERAS_SEGURIDAD, CSP } from '../../csp.js'

const toml = (() => {
  for (const r of ['../../../netlify.toml', '../../netlify.toml']) {
    try {
      return readFileSync(fileURLToPath(new URL(r, import.meta.url)), 'utf8')
    } catch {
      /* se prueba la siguiente */
    }
  }
  return ''
})()

describe('cabeceras de seguridad', () => {
  it('netlify.toml lleva exactamente la misma CSP y cabeceras que app/csp.js', () => {
    expect(toml).not.toBe('')
    for (const [nombre, valor] of Object.entries(CABECERAS_SEGURIDAD)) expect(toml, nombre).toContain(`${nombre} = "${valor}"`)
  })
  it('la CSP no permite scripts inline, eval ni iframes', () => {
    expect(CSP).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/)
    expect(CSP).toContain("frame-ancestors 'none'")
    expect(CSP).toContain("object-src 'none'")
    expect(CSP).not.toMatch(/\*(?!\.)/)
  })
})
