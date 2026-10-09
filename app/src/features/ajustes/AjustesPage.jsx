import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button, Encabezado, ErrorState, Input, Skeleton, useToast } from '../../components/ui/index.js'
import { useConfig, usePerfiles } from '../../data/hooks.js'
import { config, perfiles } from '../../data/repos/index.js'
import { urlDeImagen } from '../../lib/blobUrl.js'
import { fechaLarga } from '../../lib/fechas.js'
import { comprimirImagen } from '../../lib/imagen.js'
import { puede, ROLES } from '../../lib/permisos.js'
import { useAuth } from '../auth/AuthContext.js'
import { MODO_DEMO } from '../../lib/modoDemo.js'
import DatosDemo from './DatosDemo.jsx'
import { TarjetaAlmacenamiento } from '../almacenamiento/AvisoAlmacenamiento.jsx'

const aTexto = (n) => (n == null ? '' : String(n).replace('.', ','))
const aNumero = (t) => Number(String(t).trim().replace(',', '.'))
const soloDigitos = (t) => String(t ?? '').replace(/\D/g, '')

// Tarjeta con su propio botón Guardar: cada grupo de ajustes se guarda por separado.
function Seccion({ titulo, ayuda, onGuardar, soloLectura, children }) {
  const avisar = useToast()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      await onGuardar()
      avisar('Cambios guardados', 'exito')
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }
  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5">
      <div>
        <h2 className="text-lg">{titulo}</h2>
        {ayuda && <p className="text-sm text-texto-suave">{ayuda}</p>}
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">{children}</fieldset>
      {error && <p role="alert" className="rounded-control bg-error-fondo p-3 text-sm text-error">{error}</p>}
      {!soloLectura && <Button type="submit" cargando={guardando} className="self-start">Guardar</Button>}
    </form>
  )
}

function Negocio({ cfg, soloLectura }) {
  const [nombre, setNombre] = useState(cfg.negocio?.nombre ?? '')
  const [logo, setLogo] = useState(cfg.logo ?? null)
  const [procesando, setProcesando] = useState(false)
  const [errorLogo, setErrorLogo] = useState('')
  const input = useRef(null)
  const elegirLogo = async (archivo) => {
    if (!archivo) return
    setErrorLogo('')
    setProcesando(true)
    try {
      setLogo({ blob: await comprimirImagen(archivo, { maxLado: 600, calidad: 0.92 }), ruta: '' })
    } catch (e) {
      setErrorLogo(e.message)
    } finally {
      setProcesando(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <Seccion
      titulo="Negocio y logo"
      ayuda="El logo sale en el encabezado de la nota de venta."
      soloLectura={soloLectura}
      onGuardar={async () => {
        if (!nombre.trim()) throw new Error('El nombre del negocio es obligatorio.')
        await config.guardar('negocio', { ...cfg.negocio, nombre: nombre.trim() })
        if (logo) await config.guardar('logo', logo)
      }}
    >
      <Input etiqueta="Nombre del negocio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Logo</span>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center rounded-control border border-borde bg-white p-2">
            {logo ? <img src={urlDeImagen(logo)} alt="Logo actual" className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-texto-tenue">Sin logo</span>}
          </div>
          <Button variante="secundario" icono={ImagePlus} cargando={procesando} deshabilitado={soloLectura} onClick={() => input.current?.click()}>Subir logo</Button>
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => elegirLogo(e.target.files[0])} />
        </div>
        {errorLogo && <p role="alert" className="text-sm text-error">{errorLogo}</p>}
        {!logo && <p className="text-sm text-texto-suave">Hasta que se suba, la nota usa el nombre del negocio como título.</p>}
      </div>
    </Seccion>
  )
}

function TipoCambio({ cfg, soloLectura }) {
  const tc = cfg.tipo_cambio ?? {}
  const [bs, setBs] = useState(aTexto(tc.bs))
  const [ars, setArs] = useState(aTexto(tc.ars))
  return (
    <Seccion
      titulo="Tipo de cambio"
      ayuda="Cuántas unidades de cada moneda vale 1 US$. Las ventas ya hechas conservan el tipo de cambio con el que se hicieron."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const nBs = aNumero(bs)
        const nArs = aNumero(ars)
        if (!(nBs > 0)) throw new Error('El tipo de cambio de Bs debe ser un número mayor a 0.')
        if (!(nArs > 0)) throw new Error('El tipo de cambio de ARS debe ser un número mayor a 0.')
        await config.guardar('tipo_cambio', { bs: nBs, ars: nArs, actualizado_en: new Date().toISOString(), ejemplo: false })
      }}
    >
      {tc.ejemplo && <p className="rounded-control bg-alerta-fondo p-3 text-sm text-alerta">Estos valores son de ejemplo. Cargá los reales antes de vender.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input etiqueta="1 US$ = … Bs" inputMode="decimal" value={bs} onChange={(e) => setBs(e.target.value)} />
        <Input etiqueta="1 US$ = … $ (pesos argentinos)" inputMode="decimal" value={ars} onChange={(e) => setArs(e.target.value)} />
      </div>
      {tc.actualizado_en && <p className="text-sm text-texto-suave">Última actualización: {fechaLarga(tc.actualizado_en)}</p>}
    </Seccion>
  )
}

function Catalogo({ cfg, soloLectura }) {
  const [url, setUrl] = useState(cfg.url_catalogo ?? '')
  const [wsp, setWsp] = useState(cfg.whatsapp_tienda ?? '')
  const [precios, setPrecios] = useState(!!cfg.mostrar_precios_publico)
  return (
    <Seccion
      titulo="Catálogo y código QR"
      ayuda="La dirección del catálogo se imprime como QR en cada nota de venta."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const limpia = url.trim()
        if (limpia) {
          let ok = false
          try {
            ok = ['http:', 'https:'].includes(new URL(limpia).protocol)
          } catch {
            ok = false
          }
          if (!ok) throw new Error('La dirección del catálogo debe empezar con http:// o https://')
        }
        const tel = soloDigitos(wsp)
        if (tel && tel.length < 7) throw new Error('El WhatsApp de la tienda parece incompleto.')
        await config.guardar('url_catalogo', limpia)
        await config.guardar('whatsapp_tienda', tel)
        await config.guardar('mostrar_precios_publico', precios)
      }}
    >
      <Input etiqueta="Dirección del catálogo (para el QR)" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/c" ayuda="Todavía no hay dirección definitiva: cuando se publique, se carga acá." />
      <Input etiqueta="WhatsApp de la tienda (con código de país)" inputMode="tel" value={wsp} onChange={(e) => setWsp(e.target.value)} placeholder="59171234567" />
      <label className="flex min-h-11 items-center gap-3 text-base">
        <input type="checkbox" checked={precios} onChange={(e) => setPrecios(e.target.checked)} className="size-5 accent-tinta" />
        Mostrar precios en el catálogo público
      </label>
    </Seccion>
  )
}

function Inventario({ cfg, soloLectura }) {
  const [umbral, setUmbral] = useState(String(cfg.stock_bajo_unidades ?? 24))
  return (
    <Seccion
      titulo="Inventario"
      soloLectura={soloLectura}
      onGuardar={async () => {
        const n = Number(umbral)
        if (!Number.isInteger(n) || n < 0) throw new Error('El umbral de stock bajo debe ser un número entero, 0 o más.')
        await config.guardar('stock_bajo_unidades', n)
      }}
    >
      <Input etiqueta="Avisar “stock bajo” cuando queden (unidades) o menos" inputMode="numeric" value={umbral} onChange={(e) => setUmbral(soloDigitos(e.target.value))} />
    </Seccion>
  )
}

function Telefonos({ lista, soloLectura }) {
  const [valores, setValores] = useState(() => Object.fromEntries(lista.map((p) => [p.id, p.telefono ?? ''])))
  return (
    <Seccion
      titulo="Teléfonos del equipo"
      ayuda="Salen en el pie de la nota de venta: los de las vendedoras/es y el de la encargada de tienda."
      soloLectura={soloLectura}
      onGuardar={async () => {
        for (const p of lista) {
          const tel = soloDigitos(valores[p.id])
          if (tel && tel.length < 7) throw new Error(`El teléfono de ${p.nombre} parece incompleto.`)
        }
        for (const p of lista) await perfiles.actualizar(p.id, { telefono: soloDigitos(valores[p.id]) || null })
      }}
    >
      {lista.map((p) => (
        <Input key={p.id} etiqueta={`${p.nombre} · ${ROLES[p.rol]}`} inputMode="tel" value={valores[p.id]} onChange={(e) => setValores((v) => ({ ...v, [p.id]: e.target.value }))} placeholder="Teléfono" />
      ))}
    </Seccion>
  )
}

export default function AjustesPage() {
  const { usuario } = useAuth()
  const cfg = useConfig()
  const equipo = usePerfiles()
  const soloLectura = !puede(usuario.rol, 'ajustes.editar')

  if (cfg.cargando || equipo.cargando) return <div className="flex flex-col gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
  if (cfg.error || equipo.error) return <ErrorState mensaje="No pudimos cargar los ajustes." onReintentar={() => { cfg.reintentar(); equipo.reintentar() }} />

  return (
    <div className="flex flex-col gap-6">
      <Encabezado
        titulo="Ajustes"
        descripcion={soloLectura ? 'Podés ver los ajustes, pero solo la administración puede cambiarlos.' : 'Datos del negocio, tipo de cambio, catálogo, teléfonos de la nota e inventario.'}
      />
      {/* Escritorio: dos columnas que se apilan solas; celular: una sola. */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Negocio cfg={cfg.datos} soloLectura={soloLectura} />
          <Catalogo cfg={cfg.datos} soloLectura={soloLectura} />
          <Inventario cfg={cfg.datos} soloLectura={soloLectura} />
        </div>
        <div className="flex flex-col gap-5">
          <TipoCambio cfg={cfg.datos} soloLectura={soloLectura} />
          <Telefonos lista={equipo.datos} soloLectura={soloLectura} />
          <TarjetaAlmacenamiento />
          {MODO_DEMO && !soloLectura && <DatosDemo />}
        </div>
      </div>
    </div>
  )
}
