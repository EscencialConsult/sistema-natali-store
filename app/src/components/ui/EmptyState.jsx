export default function EmptyState({ icono: Icono, titulo, texto, accion }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icono && (
        <span className="mb-1 flex size-14 items-center justify-center rounded-full bg-tinte text-tinta">
          <Icono size={26} strokeWidth={1.6} aria-hidden />
        </span>
      )}
      <h3 className="text-lg">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm text-texto-suave">{texto}</p>}
      {accion && <div className="mt-1">{accion}</div>}
    </div>
  )
}
