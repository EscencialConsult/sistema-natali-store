import { useState } from 'react'
import { Inbox, Search } from 'lucide-react'
import { Badge, BuscadorLista, Button, Chip, EmptyState, ErrorState, Input, Select, Sheet, Skeleton, Tabs, useToast } from '../components/ui/index.js'
import seed from '../data/seed/productos.json'
import { reiniciarDatos } from '../data/seed/cargar.js'

const TOKENS = ['fondo', 'superficie', 'superficie-2', 'borde', 'texto', 'texto-suave', 'tinta', 'pie', 'exito', 'alerta', 'error', 'info', 'whatsapp']
const MONEDAS = [
  { valor: 'usd', etiqueta: 'US$ · Dólares' },
  { valor: 'ars', etiqueta: '$ · Pesos arg.' },
  { valor: 'bs', etiqueta: 'Bs · Bolivianos' },
]

export default function Muestra() {
  const [moneda, setMoneda] = useState('usd')
  const [tab, setTab] = useState('a')
  const [chip, setChip] = useState(true)
  const [hoja, setHoja] = useState(false)
  const [confirmaReinicio, setConfirmaReinicio] = useState(false)
  const [reiniciando, setReiniciando] = useState(false)
  const avisar = useToast()
  const opciones = seed.productos.slice(0, 40).map((p) => ({ valor: p.codigo, etiqueta: p.nombre, detalle: p.codigo }))

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 pb-24">
      <h1 className="text-3xl">Muestra de diseño</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Colores</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {TOKENS.map((t) => (
            <div key={t} className="overflow-hidden rounded-tarjeta border border-borde text-xs">
              <div className="h-10" style={{ background: `var(--color-${t})` }} />
              <p className="bg-superficie p-1.5">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Botones</h2>
        <div className="flex flex-wrap gap-2">
          <Button icono={Search}>Primario</Button>
          <Button variante="secundario">Secundario</Button>
          <Button variante="fantasma">Fantasma</Button>
          <Button variante="peligro">Peligro</Button>
          <Button variante="whatsapp">WhatsApp</Button>
          <Button cargando>Guardando</Button>
          <Button deshabilitado>Deshabilitado</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Campos</h2>
        <Input etiqueta="Código" placeholder="MN-001" ayuda="Podés escribir mn1" />
        <Input etiqueta="Cantidad" inputMode="numeric" error="Ingresá una cantidad mayor a 0" />
        <Select etiqueta="Moneda" opciones={MONEDAS} valor={moneda} onChange={setMoneda} />
        <BuscadorLista etiqueta="Producto" opciones={opciones} onElegir={(o) => avisar(`Elegiste ${o.detalle}`, 'exito')} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Etiquetas y chips</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutro</Badge>
          <Badge tono="exito">Sincronizada</Badge>
          <Badge tono="alerta">Pendiente</Badge>
          <Badge tono="error">Agotado</Badge>
          <Badge tono="info">Nuevo</Badge>
          <Badge tono="tinta">Novedad</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip activo={chip} onClick={() => setChip(!chip)}>Todos</Chip>
          <Chip muestra="#c0262d">Rojo</Chip>
          <Chip muestra="#1f2f5a">Azul marino</Chip>
        </div>
        <Tabs items={[{ valor: 'a', etiqueta: 'Hoy' }, { valor: 'b', etiqueta: 'Semana' }, { valor: 'c', etiqueta: 'Mes' }]} valor={tab} onChange={setTab} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Estados</h2>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="aspect-[3/4]" />
          <div className="flex flex-col gap-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-5 w-1/2" /></div>
        </div>
        <div className="rounded-tarjeta border border-borde bg-superficie"><EmptyState icono={Inbox} titulo="Todavía no hay ventas hoy" texto="Empezá una venta y va a aparecer acá." /></div>
        <div className="rounded-tarjeta border border-borde bg-superficie"><ErrorState mensaje="No pudimos cargar los productos." onReintentar={() => avisar('Reintentando…')} /></div>
      </section>

      <section className="flex gap-2">
        <Button variante="secundario" onClick={() => setHoja(true)}>Abrir panel</Button>
        <Button variante="secundario" onClick={() => avisar('Venta guardada', 'exito')}>Mostrar aviso</Button>
      </section>
      <section className="flex flex-col gap-2 rounded-tarjeta border border-borde bg-superficie p-4">
        <h2 className="text-xl">Datos de prueba (solo desarrollo)</h2>
        <p className="text-sm text-texto-suave">Borra todo lo guardado en este dispositivo (ventas, stock, sesión) y vuelve a cargar el catálogo de ejemplo.</p>
        {!confirmaReinicio ? (
          <Button variante="secundario" onClick={() => setConfirmaReinicio(true)}>Reiniciar datos de prueba</Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variante="peligro"
              cargando={reiniciando}
              onClick={async () => {
                setReiniciando(true)
                await reiniciarDatos()
                localStorage.removeItem('naty.sesion')
                window.location.assign('/')
              }}
            >
              Sí, borrar todo
            </Button>
            <Button variante="fantasma" onClick={() => setConfirmaReinicio(false)}>Cancelar</Button>
          </div>
        )}
      </section>
      <Sheet abierto={hoja} onCerrar={() => setHoja(false)} titulo="Panel de ejemplo">
        <p className="text-sm text-texto-suave">En celular sube desde abajo; en escritorio es un modal centrado.</p>
      </Sheet>
    </main>
  )
}
