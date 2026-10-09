import { BadgeCheck, ReceiptText, Search, WifiOff } from 'lucide-react'
import Logo, { MarcaIcono } from '../../components/Logo.jsx'
import { useMarca } from '../../components/useMarca.js'

const PUNTOS = [
  { icono: Search, texto: 'Encontrá cualquier modelo por su código al instante' },
  { icono: ReceiptText, texto: 'Notas de venta listas para imprimir o enviar por WhatsApp' },
  { icono: WifiOff, texto: 'Funciona aunque no haya señal: se sincroniza sola' },
]

// Pantalla de ingreso: panel de marca a la izquierda (escritorio) y formulario a la derecha.
export default function MarcoIngreso({ children }) {
  const { nombre } = useMarca()
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-pie p-12 text-sobre-tinta lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-tinta/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-tinta/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <MarcaIcono claro className="size-10" />
          <span className="font-titulo text-xl font-semibold tracking-tight">{nombre}</span>
        </div>
        <div className="relative flex max-w-md flex-col gap-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sobre-tinta/60">Venta mayorista</p>
            <h2 className="text-4xl leading-[1.1] xl:text-5xl">Tu tienda, tu catálogo y tus ventas en un solo lugar.</h2>
          </div>
          <ul className="flex flex-col gap-4">
            {PUNTOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sobre-tinta/85">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-sobre-tinta/10 ring-1 ring-inset ring-sobre-tinta/15">
                  <Icono size={18} strokeWidth={1.75} aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-sobre-tinta/60">
          <BadgeCheck size={16} strokeWidth={1.75} aria-hidden /> Acceso solo para el equipo de la tienda
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <header className="flex flex-col items-center gap-3 text-center lg:hidden">
            <Logo conBajada />
          </header>
          {children}
        </div>
      </main>
    </div>
  )
}
