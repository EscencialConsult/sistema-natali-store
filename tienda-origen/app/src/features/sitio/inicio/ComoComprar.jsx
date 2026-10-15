// Tres pasos en una fila, sin tarjetas. El texto es editable desde el panel.
export default function ComoComprar({ pasos }) {
  if (!pasos?.length) return null
  return (
    <section aria-labelledby="como-comprar-titulo" className="flex flex-col gap-5 border-t border-borde pt-8">
      <h2 id="como-comprar-titulo" className="text-2xl md:text-3xl">Cómo comprar</h2>
      <ol className="grid gap-6 md:grid-cols-3 md:gap-10">
        {pasos.map((p, i) => (
          <li key={p.titulo} className="flex flex-col gap-1">
            <span aria-hidden className="font-titulo text-sm font-semibold text-tinta">0{i + 1}</span>
            <h3 className="text-lg">{p.titulo}</h3>
            <p className="text-sm text-texto-suave">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
