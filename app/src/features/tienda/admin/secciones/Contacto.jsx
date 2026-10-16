import { useState } from 'react'
import { Input } from '../../../../components/ui/index.js'
import { validarContactos, validarLocales } from '../../lib/configTienda.js'
import { guardarClave } from '../api.js'
import { Filas, Tarjeta } from '../componentes.jsx'

const LOCAL_VACIO = () => ({ nombre: '', direccion: '', indicaciones: '', horario: '', mapa: '' })

export default function Contacto({ config, soloLectura, alGuardar }) {
  const [contactos, setContactos] = useState(() => {
    const v = validarContactos(config.contactos).valor
    return v.length ? v : [{ nombre: '', telefono: '' }]
  })
  const [locales, setLocales] = useState(() => {
    const v = validarLocales(config.locales).valor
    return v.length ? v : [LOCAL_VACIO()]
  })

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta
        titulo="Vendedores y WhatsApp"
        ayuda="Los que salen para elegir en el pedido y en «Contacto». Con código de país, solo números (ej. 59171234567). Publicá solo los teléfonos que cada persona autorizó."
        soloLectura={soloLectura}
        onGuardar={async () => {
          const { valor, errores } = validarContactos(contactos)
          if (errores.length) return errores
          await guardarClave('contactos', valor)
          alGuardar?.('contactos', valor)
          return []
        }}
      >
        <Filas filas={contactos} setFilas={setContactos} nueva={() => ({ nombre: '', telefono: '' })} max={12} etiquetaAgregar="Agregar contacto">
          {(f, set) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input etiqueta="Nombre" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={60} />
              <Input etiqueta="WhatsApp" inputMode="tel" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} maxLength={30} placeholder="59171234567" />
            </div>
          )}
        </Filas>
      </Tarjeta>

      <Tarjeta
        titulo="Locales"
        ayuda="Dirección, cómo llegar y horario de cada local."
        soloLectura={soloLectura}
        onGuardar={async () => {
          const { valor, errores } = validarLocales(locales)
          if (errores.length) return errores
          await guardarClave('locales', valor)
          alGuardar?.('locales', valor)
          return []
        }}
      >
        <Filas filas={locales} setFilas={setLocales} nueva={LOCAL_VACIO} max={6} etiquetaAgregar="Agregar local">
          {(f, set) => (
            <>
              <Input etiqueta="Nombre del local" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} maxLength={60} />
              <Input etiqueta="Dirección" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} maxLength={160} />
              <Input etiqueta="Horario de este local" value={f.horario ?? ''} onChange={(e) => set('horario', e.target.value)} maxLength={160} placeholder="6:00 a 12:00 y 14:00 a 16:00" ayuda="Si es distinto del horario general." />
              <Input etiqueta="Cómo llegar (opcional)" value={f.indicaciones} onChange={(e) => set('indicaciones', e.target.value)} maxLength={300} />
              <Input etiqueta="Enlace de Google Maps (opcional)" inputMode="url" value={f.mapa} onChange={(e) => set('mapa', e.target.value)} maxLength={500} placeholder="https://maps.app.goo.gl/…" />
            </>
          )}
        </Filas>
      </Tarjeta>
    </div>
  )
}
