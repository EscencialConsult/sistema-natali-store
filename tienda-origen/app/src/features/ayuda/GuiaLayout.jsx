import { Fragment } from 'react'
import { cn } from '../../lib/cn.js'

// Disposición común de las guías de ayuda (la de la clienta y la del panel): índice a la izquierda en pantallas grandes,
// secciones con ancla y bloques simples. El contenido vive en datos (ver contenidoCliente.js y contenidoPanel.js).
//
// Tipos de bloque: { h } subtítulo · { p } párrafo · { pasos: [...] } lista numerada · { lista: [...] } viñetas · { nota } aviso suave ·
// { ojo } advertencia · { tabla: { cabecera: [...], filas: [[...]] } } · { faq: [{ p, r }] } preguntas y respuestas.

function Bloque({ b }) {
  if (b.h) return <h3 className="mt-2 text-base font-medium">{b.h}</h3>
  if (b.p) return <p className="text-base leading-relaxed text-texto">{b.p}</p>
  if (b.pasos) {
    return (
      <ol className="flex flex-col gap-2 pl-5 [list-style:decimal]">
        {b.pasos.map((x, i) => <li key={i} className="pl-1 leading-relaxed">{x}</li>)}
      </ol>
    )
  }
  if (b.lista) {
    return (
      <ul className="flex flex-col gap-1.5 pl-5 [list-style:disc]">
        {b.lista.map((x, i) => <li key={i} className="pl-1 leading-relaxed">{x}</li>)}
      </ul>
    )
  }
  if (b.nota) return <p role="note" className="rounded-control bg-superficie-2 px-4 py-3 text-sm text-texto-suave">{b.nota}</p>
  if (b.ojo) return <p role="note" className="rounded-control bg-alerta-fondo px-4 py-3 text-sm text-alerta">{b.ojo}</p>
  if (b.tabla) {
    return (
      <div className="overflow-x-auto rounded-control border border-borde">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-superficie-2 text-left text-xs uppercase tracking-wide text-texto-suave">
              {b.tabla.cabecera.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {b.tabla.filas.map((f, i) => (
              <tr key={i} className="align-top">
                {f.map((c, j) => <td key={j} className={cn('px-3 py-2', j === 0 && 'font-medium')}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (b.faq) {
    return (
      <div className="flex flex-col divide-y divide-borde rounded-control border border-borde">
        {b.faq.map((q) => (
          <details key={q.p} className="group px-4 py-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium">
              {q.p}
              <span aria-hidden className="text-texto-suave transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pt-2 leading-relaxed text-texto-suave">{q.r}</p>
          </details>
        ))}
      </div>
    )
  }
  return null
}

export default function GuiaLayout({ titulo, intro, secciones, pie }) {
  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:items-start md:gap-10">
      <div className="flex flex-col gap-2 md:col-span-2">
        <h1 className="text-3xl md:text-4xl">{titulo}</h1>
        {intro && <p className="max-w-2xl text-texto-suave">{intro}</p>}
      </div>

      <nav aria-label="Índice de la guía" className="md:sticky md:top-20">
        <ol className="flex flex-wrap gap-2 md:flex-col md:gap-0.5">
          {secciones.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-control bg-superficie-2 px-3 text-sm text-texto-suave hover:text-texto md:w-full md:bg-transparent md:px-2">
                <span aria-hidden className="tabular-nums text-texto-tenue">{i + 1}.</span> {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        {secciones.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="flex scroll-mt-24 flex-col gap-3 rounded-tarjeta bg-superficie p-4 md:p-6">
            <h2 id={`${s.id}-t`} className="text-xl md:text-2xl"><span className="tabular-nums text-texto-tenue">{i + 1}. </span>{s.titulo}</h2>
            {s.bloques.map((b, j) => <Fragment key={j}><Bloque b={b} /></Fragment>)}
          </section>
        ))}
        {pie}
      </div>
    </div>
  )
}
