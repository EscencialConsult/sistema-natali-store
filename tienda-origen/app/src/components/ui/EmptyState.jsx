export default function EmptyState({ icono: Icono, titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icono && <Icono size={32} strokeWidth={1.5} aria-hidden className="text-texto-tenue" />}
      <h3 className="text-lg">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm text-texto-suave">{texto}</p>}
      {accion}
    </div>
  )
}
