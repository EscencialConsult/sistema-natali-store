import { Link } from 'react-router-dom'
import { clasesBoton } from './estilos.js'

// Enlace con aspecto de botón. Mismas variantes que Button.
export default function BotonLink({ variante = 'primario', icono: Icono, ancho = false, className, children, ...resto }) {
  return (
    <Link className={clasesBoton({ variante, ancho, className })} {...resto}>
      {Icono && <Icono size={18} strokeWidth={1.75} aria-hidden />}
      {children}
    </Link>
  )
}
