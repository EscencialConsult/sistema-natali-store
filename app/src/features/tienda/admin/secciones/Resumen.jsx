import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { fechaDia } from '../../../../lib/fechas.js'
import { formatearCuit } from '../../lib/configTienda.js'
import { Aviso, Dato } from '../componentes.jsx'

const ETIQUETA_ESTADO = {
  sin_datos: 'Sin cargar',
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencida: 'Vencida: hay que cambiarla',
}

const Caja = ({ titulo, pestana, irA, children }) => (
  <section className="flex flex-col gap-3 border-t border-borde pt-4">
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-base font-semibold">{titulo}</h3>
      {pestana && <button type="button" onClick={() => irA(pestana)} className="min-h-11 min-w-11 text-sm text-tinta underline-offset-4 hover:underline">Editar</button>}
    </div>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
  </section>
)

// Configuración global: qué está conectado y qué necesita atención. Solo lectura.
export default function Resumen({ resumen: r, irA }) {
  const [verCbu, setVerCbu] = useState(false)
  const { cuenta, conversion, contacto, sitio, alertas } = r
  const fecha = (iso) => (iso ? fechaDia(iso) : '')
  const diaCambio = cuenta.cambiarEl ? fechaDia(`${cuenta.cambiarEl}T12:00:00`) : ''

  return (
    <div className="flex flex-col gap-5">
      {alertas.length === 0 ? (
        <Aviso nivel="info">Todo en orden: no hay nada que necesite atención.</Aviso>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Avisos">
          {alertas.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1"><Aviso nivel={a.nivel}>{a.texto}</Aviso></div>
              {a.pestana && <button type="button" onClick={() => irA(a.pestana)} className="min-h-11 min-w-11 shrink-0 text-sm text-tinta underline-offset-4 hover:underline">Resolver</button>}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Caja titulo="Cuenta conectada" pestana="cuenta" irA={irA}>
          <Dato etiqueta="Estado">
            <span className={cuenta.estado === 'vencida' ? 'text-error' : cuenta.estado === 'por_vencer' ? 'text-alerta' : ''}>{ETIQUETA_ESTADO[cuenta.estado]}</span>
          </Dato>
          <Dato etiqueta="Cambiar la cuenta el">{diaCambio}</Dato>
          <Dato etiqueta="Titular">{cuenta.titular}</Dato>
          <Dato etiqueta="Banco">{cuenta.banco}</Dato>
          <Dato etiqueta="Alias">{cuenta.alias}</Dato>
          <Dato etiqueta="Transfieren en">{cuenta.estado === 'sin_datos' ? '' : cuenta.monedaTexto}</Dato>
          <Dato etiqueta="CBU">
            {cuenta.cbu && (
              <span className="inline-flex items-center gap-2">
                <span className="tabular-nums">{verCbu ? cuenta.cbu : cuenta.cbuEnmascarado}</span>
                <button type="button" onClick={() => setVerCbu((v) => !v)} aria-label={verCbu ? 'Ocultar el CBU' : 'Mostrar el CBU'} className="inline-flex size-11 items-center justify-center rounded-full">
                  {verCbu ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                </button>
              </span>
            )}
          </Dato>
          <Dato etiqueta="Última carga">{fecha(cuenta.actualizadoEn)}</Dato>
        </Caja>

        <Caja titulo="Conversión en uso" irA={irA}>
          <Dato etiqueta="1 US$ en pesos">{conversion.ars ? `$ ${conversion.ars.toLocaleString('es-AR')}` : ''}</Dato>
          <Dato etiqueta="1 US$ en bolivianos">{conversion.bs ? `Bs ${conversion.bs.toLocaleString('es-AR')}` : ''}</Dato>
          <Dato etiqueta="Cotización del">{fecha(conversion.actualizadoEn)}</Dato>
          <Dato etiqueta="Tipo">{conversion.esEjemplo ? 'De ejemplo' : 'Real'}</Dato>
          <Dato etiqueta="Precios en la tienda">{conversion.preciosVisibles ? 'Se muestran' : 'Ocultos ("a consultar")'}</Dato>
          <Dato etiqueta="Se cambia en">Ajustes → Tipo de cambio</Dato>
        </Caja>

        <Caja titulo="Contacto" pestana="contacto" irA={irA}>
          <Dato etiqueta="WhatsApp principal">{contacto.principal ? `${contacto.principal.telefono} (${contacto.principal.nombre})` : ''}</Dato>
          <Dato etiqueta="Vendedores en la lista">{String(contacto.contactos)}</Dato>
          <Dato etiqueta="Locales">{String(contacto.locales)}</Dato>
        </Caja>

        <Caja titulo="Sitio" pestana="direcciones" irA={irA}>
          <Dato etiqueta="Tienda pública">{sitio.urlPublica}</Dato>
          <Dato etiqueta="Sistema del equipo">{sitio.urlSistema}</Dato>
          <Dato etiqueta="QR de la nota apunta a">{sitio.urlQr}</Dato>
          <Dato etiqueta="CUIT/CUIL de la cuenta">{formatearCuit(r.cuenta.cuit ?? '')}</Dato>
        </Caja>
      </div>
    </div>
  )
}
