import { cn } from '../lib/cn.js'

// Marca de Modas Naty (logo dorado de la clienta). Variantes:
//   horizontal (por defecto): monograma + nombre, para cabeceras.
//   completo: imagotipo (monograma con el nombre debajo), para el login y pantallas de bienvenida.
//   iso: solo el monograma, para espacios chicos (menú contraído, íconos).
// Los tamaños salen del `className` (alto); width/height evitan saltos de diseño al cargar.
export default function Logo({ className, variante = 'horizontal' }) {
  if (variante === 'completo') {
    return <img src="/brand/imagotipo.png" width="420" height="402" alt="Modas Naty" className={cn('h-28 w-auto', className)} />
  }
  if (variante === 'iso') {
    return <img src="/brand/isotipo.png" width="240" height="134" alt="Modas Naty" className={cn('h-7 w-auto', className)} />
  }
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <img src="/brand/isotipo.png" width="240" height="134" alt="" aria-hidden className="h-7 w-auto" />
      <span className="font-titulo text-xl font-semibold tracking-tight">Modas Naty</span>
    </span>
  )
}
