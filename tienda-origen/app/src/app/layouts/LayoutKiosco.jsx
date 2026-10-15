import { Suspense, useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button, Modal, Skeleton } from '../../components/ui/index.js'
import { useCarritoItems, useConfig, useKioscoDispositivo } from '../../data/hooks.js'
import { carrito } from '../../data/repos/index.js'
import { imprimirTicket } from '../../lib/imprimir.js'
import { pedirPantallaCompleta } from '../../lib/pantallaCompleta.js'
import AccesoEncargada from '../../features/kiosco/AccesoEncargada.jsx'
import Ticket from '../../features/kiosco/Ticket.jsx'
import { useInactividad } from '../../features/kiosco/useInactividad.js'
import ErrorBoundary from '../ErrorBoundary.jsx'
import { BASE_KIOSCO } from '../navegacion.js'
import { useSoloNoIndex } from '../../lib/seo.js'

const PRUEBA = { id: 'prueba', codigo: 'PRUEBA', origen: 'kiosco', estado: 'pagado', proveedor_pago: 'caja', moneda: 'bs', entrega: 'retiro', creado_en: new Date().toISOString(), items: [{ id: 'i', codigo: 'TEST', nombre: 'Impresión de prueba', color_nombre: 'ok', cantidad: 1, precio_cent: 0, subtotal_cent: 0 }], total_cent: 0, envio_costo_cent: 0 }

// Cáscara del kiosco (regla "Táctil generoso"): pantalla completa, "Volver" fijo arriba a la izquierda, carrito arriba a la
// derecha, inactividad que vuelve a Bienvenida y acceso oculto de la encargada.
export default function LayoutKiosco() {
  useSoloNoIndex()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const cfg = useConfig()
  const disp = useKioscoDispositivo()
  const items = useCarritoItems()
  const cantidad = (items.datos ?? []).reduce((t, i) => t + i.cantidad, 0)
  const [imprimiendo, setImprimiendo] = useState(null)
  const enBienvenida = pathname === BASE_KIOSCO || pathname === `${BASE_KIOSCO}/`
  const enActivar = pathname.startsWith(`${BASE_KIOSCO}/activar`)
  const k = cfg.datos?.kiosco ?? {}

  const reiniciar = useCallback(async () => {
    await carrito.vaciar()
    try {
      sessionStorage.removeItem('kiosco.ultimo')
    } catch {
      /* nada */
    }
    navigate(BASE_KIOSCO, { replace: true })
  }, [navigate])
  const { avisando, restante, seguir } = useInactividad(k.inactividad_seg ?? 90, reiniciar, { activo: !enBienvenida && !enActivar && !!disp.datos })

  // Pantalla completa al primer toque (si no está ya en modo kiosco del navegador).
  useEffect(() => {
    const pedir = () => pedirPantallaCompleta()
    window.addEventListener('pointerdown', pedir, { once: true })
    return () => window.removeEventListener('pointerdown', pedir)
  }, [])

  const imprimir = async (pedido) => {
    setImprimiendo(pedido)
    await new Promise((r) => setTimeout(r, 80))
    await imprimirTicket({ pedido, agenteUrl: k.agente_url, negocio: cfg.datos?.negocio?.nombre, whatsapp: cfg.datos?.whatsapp_tienda, pie: k.texto_ticket })
    setImprimiendo(null)
  }
  const reimprimirUltimo = () => {
    try {
      const ultimo = JSON.parse(sessionStorage.getItem('kiosco.ultimo') ?? 'null')
      if (ultimo) imprimir(ultimo)
    } catch {
      /* nada */
    }
  }

  return (
    <div className="flex min-h-dvh select-none flex-col bg-fondo text-kiosco">
      {!enBienvenida && !enActivar && (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-borde bg-superficie px-3 print:hidden">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-control-kiosco items-center gap-1 rounded-control px-3 text-kiosco text-texto-suave active:bg-superficie-2">
            <ChevronLeft size={24} strokeWidth={1.75} aria-hidden /> Volver
          </button>
          <Link to={`${BASE_KIOSCO}/carrito`} className="relative inline-flex min-h-control-kiosco items-center gap-2 rounded-control px-3 text-kiosco active:bg-superficie-2">
            <ShoppingBag size={26} strokeWidth={1.75} aria-hidden /> Carrito
            {cantidad > 0 && <span key={cantidad} className="pop flex min-w-7 items-center justify-center rounded-pildora bg-tinta px-1.5 text-sm font-semibold tabular-nums text-sobre-tinta">{cantidad}<span className="sr-only"> {cantidad === 1 ? 'artículo' : 'artículos'}</span></span>}
            {cantidad === 0 && <span className="sr-only"> vacío</span>}
          </Link>
        </header>
      )}
      <main className="flex flex-1 flex-col p-6 print:hidden">
        <ErrorBoundary>
          <Suspense fallback={<Skeleton className="h-40" />}>
            <Outlet context={{ imprimir, dispositivo: disp.datos }} />
          </Suspense>
        </ErrorBoundary>
      </main>
      {disp.datos && <AccesoEncargada dispositivo={disp.datos} onReimprimir={reimprimirUltimo} onProbarImpresora={() => imprimir(PRUEBA)} />}
      <Modal abierto={avisando} onCerrar={seguir} titulo="¿Seguís ahí?">
        <p className="mb-4 text-kiosco text-texto-suave">Si no tocás la pantalla, en <span className="font-semibold tabular-nums">{restante}</span> segundos se vacía el carrito y volvemos al inicio.</p>
        <Button onClick={seguir} className="min-h-control-kiosco w-full text-kiosco">Sigo acá</Button>
      </Modal>
      {imprimiendo && <Ticket pedido={imprimiendo} negocio={cfg.datos?.negocio?.nombre} whatsapp={cfg.datos?.whatsapp_tienda} pie={k.texto_ticket} />}
    </div>
  )
}
