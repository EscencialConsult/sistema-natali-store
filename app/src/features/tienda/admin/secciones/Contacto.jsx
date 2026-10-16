import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../../../components/ui/index.js'
import { ROLES } from '../../../../lib/permisos.js'
import { validarLocales } from '../../lib/configTienda.js'
import { soloDigitos } from '../../lib/whatsapp.js'
import { conClave, guardarClave } from '../api.js'
import { Filas, Tarjeta } from '../componentes.jsx'

const LOCAL_VACIO = () => ({ nombre: '', direccion: '', indicaciones: '', horario: '', mapa: '', lat: '', lng: '' })

// Los vendedores que ve la clienta salen solos de Usuarios: rol vendedor/a, activos y con teléfono. Acá solo se muestra
// quién aparece y quién no; se cambian en Usuarios (pantalla de Renzo), no acá.
function Vendedores({ equipo }) {
  const vendedores = (equipo ?? []).filter((p) => p.rol === 'vendedor' && p.activo)
  const conTelefono = (p) => soloDigitos(p.telefono).length >= 8
  return (
    <section aria-labelledby="vendedores-tienda" className="flex flex-col gap-3 rounded-tarjeta border border-borde/70 bg-superficie p-4 shadow-tarjeta sm:p-5">
      <div>
        <h3 id="vendedores-tienda" className="text-lg">Vendedores que ve la clienta</h3>
        <p className="text-sm text-texto-suave">
          Son las personas con rol «{ROLES.vendedor}» en Usuarios, activas y con teléfono cargado. Aparecen en «Contacto» y se eligen al armar el pedido. Para cambiar
          algo, editá a la persona en <Link to="/usuarios" className="text-tinta underline-offset-4 hover:underline">Usuarios</Link>.
        </p>
      </div>
      {vendedores.length === 0 ? (
        <p className="text-sm">No hay vendedores activos. Hasta que haya, la clienta escribe al WhatsApp de la tienda.</p>
      ) : (
        <ul className="divide-y divide-borde/60">
          {vendedores.map((p) => (
            <li key={p.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="font-medium">{p.nombre}</span>
              {conTelefono(p) ? (
                <span className="tabular-nums text-texto-suave">{soloDigitos(p.telefono)}</span>
              ) : (
                <span className="rounded-pildora bg-alerta-fondo px-2 py-0.5 text-xs text-alerta">Sin teléfono: no aparece en la tienda</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Contacto({ config, equipo, soloLectura, alGuardar }) {
  const [locales, setLocales] = useState(() => {
    const v = validarLocales(config.locales).valor
    return (v.length ? v : [LOCAL_VACIO()]).map(conClave)
  })

  return (
    <div className="flex flex-col gap-5">
      <Vendedores equipo={equipo} />

      <Tarjeta
        titulo="Locales"
        ayuda="Dirección, cómo llegar, horario y la ubicación en el mapa de cada local."
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input etiqueta="Latitud (para el mapa)" inputMode="decimal" value={f.lat ?? ''} onChange={(e) => set('lat', e.target.value)} maxLength={14} placeholder="-22.7326" />
                <Input etiqueta="Longitud (para el mapa)" inputMode="decimal" value={f.lng ?? ''} onChange={(e) => set('lng', e.target.value)} maxLength={14} placeholder="-64.3412" ayuda="En Google Maps: tocá y mantené el punto y copiá los dos números." />
              </div>
            </>
          )}
        </Filas>
      </Tarjeta>
    </div>
  )
}
