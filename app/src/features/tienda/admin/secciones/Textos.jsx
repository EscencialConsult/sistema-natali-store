import { useState } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button, Input } from '../../../../components/ui/index.js'
import { TEMAS_AYUDA } from '../../lib/configTienda.js'
import { PAGINAS_TEXTOS, textosDe, VALIDADORES_PROPIOS, validarTextos } from '../../lib/textos.js'
import { guardarClave } from '../api.js'
import { Tarjeta } from '../componentes.jsx'

const AREA = 'min-h-24 w-full rounded-control border border-borde-campo bg-fondo p-3 text-base font-normal'
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// En el formulario, las listas de líneas se editan como texto (una por línea).
const aEditable = (c, valor) => (c.tipo === 'lineas' ? (valor ?? []).join('\n') : valor)

function BotonOriginal({ visible, onClick }) {
  if (!visible) return null
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-1 self-start text-xs text-texto-suave hover:text-tinta">
      <RotateCcw size={13} aria-hidden /> Volver al texto original
    </button>
  )
}

function Lista({ filas, onCambiar, max, nueva, etiquetaAgregar, children }) {
  return (
    <div className="flex flex-col gap-3">
      {filas.map((f, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-control border border-borde/70 p-3">
          {children(f, (campo, valor) => onCambiar(filas.map((x, k) => (k === i ? { ...x, [campo]: valor } : x))))}
          <button type="button" onClick={() => onCambiar(filas.filter((_, k) => k !== i))} className="inline-flex min-h-10 items-center gap-2 self-start text-sm text-texto-suave hover:text-tinta">
            <Trash2 size={15} aria-hidden /> Quitar
          </button>
        </div>
      ))}
      {filas.length < max && (
        <Button type="button" variante="secundario" icono={Plus} onClick={() => onCambiar([...filas, nueva()])} className="self-start">{etiquetaAgregar}</Button>
      )}
    </div>
  )
}

function Campo({ campo: c, valor, onCambiar }) {
  const original = aEditable(c, c.defecto)
  const distinto = !igual(valor, original)
  const volver = <BotonOriginal visible={distinto} onClick={() => onCambiar(original)} />
  if (c.tipo === 'linea') {
    return (
      <div className="flex flex-col gap-1">
        <Input etiqueta={c.etiqueta} value={valor ?? ''} onChange={(e) => onCambiar(e.target.value)} maxLength={120} />
        {volver}
      </div>
    )
  }
  if (c.tipo === 'parrafo' || c.tipo === 'lineas') {
    return (
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {c.etiqueta}
          <textarea value={valor ?? ''} onChange={(e) => onCambiar(e.target.value)} rows={c.tipo === 'lineas' ? Math.min(8, Math.max(3, (c.max ?? 6) + 1)) : 3} className={AREA} />
        </label>
        {volver}
      </div>
    )
  }
  if (c.tipo === 'items') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{c.etiqueta}</p>
        <Lista filas={valor ?? []} onCambiar={onCambiar} max={c.max ?? 6} nueva={() => ({ titulo: '', texto: '' })} etiquetaAgregar="Agregar">
          {(f, set) => (
            <>
              <Input etiqueta="Título" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} maxLength={80} />
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Texto
                <textarea value={f.texto} onChange={(e) => set('texto', e.target.value)} rows={2} className={AREA} />
              </label>
            </>
          )}
        </Lista>
        {volver}
      </div>
    )
  }
  if (c.tipo === 'preguntas') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{c.etiqueta}</p>
        <Lista filas={valor ?? []} onCambiar={onCambiar} max={c.max ?? 30} nueva={() => ({ tema: TEMAS_AYUDA[0].id, p: '', r: '' })} etiquetaAgregar="Agregar pregunta">
          {(f, set) => (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Tema
                <select value={f.tema} onChange={(e) => set('tema', e.target.value)} className="min-h-11 rounded-control border border-borde-campo bg-fondo px-3 text-base font-normal">
                  {TEMAS_AYUDA.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              </label>
              <Input etiqueta="Pregunta" value={f.p} onChange={(e) => set('p', e.target.value)} maxLength={160} />
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Respuesta
                <textarea value={f.r} onChange={(e) => set('r', e.target.value)} rows={2} className={AREA} />
              </label>
            </>
          )}
        </Lista>
        {volver}
      </div>
    )
  }
  return null
}

// Una tarjeta por página de la tienda, con las secciones y los campos en el mismo orden en que los ve la clienta.
function PaginaTextos({ pagina, config, soloLectura, alGuardar }) {
  const [v, setV] = useState(() => {
    const t = textosDe(config)
    const inicial = {}
    for (const s of pagina.secciones) for (const c of s.campos) inicial[c.clave] = aEditable(c, t(c.clave))
    return inicial
  })
  const cambiar = (clave, valor) => setV((x) => ({ ...x, [clave]: valor }))

  return (
    <Tarjeta
      titulo={`Página «${pagina.titulo}»`}
      ayuda="Cada sección se llama igual que en la tienda. Si dejás un texto vacío, vuelve el original."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const errores = []
        const propias = []
        // Lo de esta página se suma a lo ya guardado de las demás páginas (la clave `textos` es una sola).
        const nuevos = { ...validarTextos(config.textos).valor }
        for (const s of pagina.secciones) {
          for (const c of s.campos) {
            if (c.propia) {
              const r = VALIDADORES_PROPIOS[c.clave](v[c.clave])
              if (r.errores.length) errores.push(...r.errores.map((m) => `${s.titulo}: ${m}`))
              else propias.push([c.clave, r.valor])
            } else {
              nuevos[c.clave] = c.tipo === 'lineas' ? String(v[c.clave] ?? '').split('\n') : v[c.clave]
              // Vacío = volver al original: se saca de lo guardado.
              if (c.tipo === 'lineas' ? !String(v[c.clave] ?? '').trim() : !v[c.clave] || (Array.isArray(v[c.clave]) && !v[c.clave].length)) delete nuevos[c.clave]
            }
          }
        }
        if (errores.length) return errores
        const textos = validarTextos(nuevos).valor
        await guardarClave('textos', textos)
        alGuardar?.('textos', textos)
        for (const [clave, valor] of propias) {
          await guardarClave(clave, valor)
          alGuardar?.(clave, valor)
        }
        return []
      }}
    >
      {pagina.secciones.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-3 border-t border-borde/60 pt-4 first:border-t-0 first:pt-0">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-texto-suave">{s.titulo}</h4>
          {s.campos.map((c) => <Campo key={c.clave} campo={{ tipo: 'linea', ...c }} valor={v[c.clave]} onCambiar={(valor) => cambiar(c.clave, valor)} />)}
        </section>
      ))}
    </Tarjeta>
  )
}

// Una página por vez, elegida arriba; las demás quedan montadas (ocultas) para no perder lo que se estaba escribiendo.
export default function Textos({ config, soloLectura, alGuardar }) {
  const [pagina, setPagina] = useState(PAGINAS_TEXTOS[0].id)
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Página de la tienda" className="flex flex-wrap gap-2">
        {PAGINAS_TEXTOS.map((p) => (
          <button
            key={p.id}
            id={`textos-${p.id}`}
            role="tab"
            type="button"
            aria-selected={pagina === p.id}
            aria-controls={`textos-panel-${p.id}`}
            onClick={() => setPagina(p.id)}
            className={`min-h-11 rounded-pildora border px-4 text-sm font-medium transition-colors ${pagina === p.id ? 'border-tinta bg-tinta text-sobre-tinta' : 'border-borde bg-superficie text-texto-suave hover:text-texto'}`}
          >
            {p.titulo}
          </button>
        ))}
      </div>
      {PAGINAS_TEXTOS.map((p) => (
        <div key={p.id} id={`textos-panel-${p.id}`} role="tabpanel" aria-labelledby={`textos-${p.id}`} hidden={pagina !== p.id}>
          <PaginaTextos pagina={p} config={config} soloLectura={soloLectura} alGuardar={alGuardar} />
        </div>
      ))}
    </div>
  )
}
