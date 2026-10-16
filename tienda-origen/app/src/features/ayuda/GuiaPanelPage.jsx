import { useEffect, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BASE_PANEL } from '../../app/navegacion.js'
import { useAuth } from '../auth/AuthContext.js'
import { puede } from '../../lib/permisos.js'
import { seccionesPanel } from './contenidoPanel.js'
import GuiaLayout from './GuiaLayout.jsx'

// /administracion/ayuda — Manual del panel dentro de la app. Lo ve cualquier persona con acceso al panel.
export default function GuiaPanelPage() {
  const { usuario } = useAuth()
  useEffect(() => {
    document.title = 'Manual del panel · Administración · Modas Naty'
  }, [])
  const secciones = useMemo(() => seccionesPanel(), [])
  const veGuiaMp = puede(usuario.rol, 'reportes.ver') || puede(usuario.rol, 'pedidos.ver')
  return (
    <GuiaLayout
      titulo="Manual del panel"
      intro="Para qué sirve cada pantalla y cómo se hacen las tareas del día a día. Lo que no aparece en tu menú no forma parte de tu rol."
      secciones={secciones}
      pie={
        veGuiaMp && (
          <Link to={`${BASE_PANEL}/guia-mercado-pago`} className="inline-flex min-h-11 items-center gap-2 self-start rounded-control bg-acento-tinte px-4 text-sm font-medium">
            <BookOpen size={18} strokeWidth={1.75} aria-hidden /> Guía de Mercado Pago: retenciones y descuentos
          </Link>
        )
      }
    />
  )
}
