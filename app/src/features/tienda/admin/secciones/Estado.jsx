import { useState } from 'react'
import { ExternalLink, Store, TriangleAlert } from 'lucide-react'
import { Button, Input, useToast } from '../../../../components/ui/index.js'
import { fechaDia } from '../../../../lib/fechas.js'
import { MENSAJE_CERRADA_POR_DEFECTO, validarEstadoTienda } from '../../lib/configTienda.js'
import { guardarClave } from '../api.js'

// Abrir o cerrar la tienda al público. Cerrada, las clientas ven una pantalla de mantenimiento con el WhatsApp y los locales;
// el sistema del equipo sigue igual. Con ?previa=1 la administración la ve abierta para revisarla antes de abrirla de verdad.
export default function Estado({ config, soloLectura, alGuardar, origen }) {
  const avisar = useToast()
  const actual = validarEstadoTienda(config.tienda).valor
  const [cerrando, setCerrando] = useState(false)
  const [mensaje, setMensaje] = useState(actual.mensaje)
  const [accion, setAccion] = useState(null)
  const [error, setError] = useState('')

  const guardar = async (cerrada, nombreAccion) => {
    setError('')
    setAccion(nombreAccion)
    try {
      const nuevo = { ...validarEstadoTienda({ cerrada, mensaje }).valor, actualizado_en: new Date().toISOString() }
      await guardarClave('tienda', nuevo)
      alGuardar?.('tienda', nuevo)
      setCerrando(false)
      avisar(cerrada ? 'La tienda quedó cerrada al público' : 'La tienda quedó abierta al público', 'exito')
    } catch (e) {
      setError(e.message)
    } finally {
      setAccion(null)
    }
  }

  const Icono = actual.cerrada ? TriangleAlert : Store
  const verTienda = `${origen}/${actual.cerrada ? '?previa=1' : ''}`

  return (
    <section aria-labelledby="estado-tienda" className={`flex flex-col gap-4 rounded-tarjeta border p-4 sm:p-5 ${actual.cerrada ? 'border-alerta/40 bg-alerta-fondo' : 'border-borde/70 bg-superficie shadow-tarjeta'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icono size={22} strokeWidth={1.75} aria-hidden className={`mt-0.5 shrink-0 ${actual.cerrada ? 'text-alerta' : 'text-tinta'}`} />
          <div>
            <h3 id="estado-tienda" className="text-lg">{actual.cerrada ? 'Tienda cerrada al público' : 'Tienda abierta al público'}</h3>
            <p className="text-sm text-texto-suave">
              {actual.cerrada
                ? `Las clientas ven un aviso de mantenimiento con el WhatsApp y los locales${actual.actualizado_en ? `, desde el ${fechaDia(actual.actualizado_en)}` : ''}. El sistema del equipo sigue funcionando igual.`
                : 'Cerrala solo para preparar cambios grandes. Mientras esté cerrada, las clientas ven un aviso con el WhatsApp y los locales.'}
            </p>
          </div>
        </div>
        {origen && (
          <a href={verTienda} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta underline-offset-4 hover:underline">
            <ExternalLink size={16} aria-hidden /> {actual.cerrada ? 'Ver la tienda (vista previa)' : 'Ver la tienda'}
          </a>
        )}
      </div>

      {!soloLectura && (actual.cerrada || cerrando) && (
        <Input etiqueta="Mensaje para las clientas (opcional)" value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={300} placeholder={MENSAJE_CERRADA_POR_DEFECTO} />
      )}
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {!soloLectura && (
        <div className="flex flex-wrap gap-2">
          {actual.cerrada ? (
            <>
              <Button onClick={() => guardar(false, 'abrir')} cargando={accion === 'abrir'} deshabilitado={accion !== null}>Abrir la tienda</Button>
              <Button variante="secundario" onClick={() => guardar(true, 'mensaje')} cargando={accion === 'mensaje'} deshabilitado={accion !== null}>Guardar mensaje</Button>
            </>
          ) : cerrando ? (
            <>
              <Button onClick={() => guardar(true, 'cerrar')} cargando={accion === 'cerrar'}>Confirmar cierre</Button>
              <Button variante="secundario" onClick={() => setCerrando(false)} deshabilitado={accion !== null}>Cancelar</Button>
            </>
          ) : (
            <Button variante="secundario" onClick={() => setCerrando(true)}>Cerrar al público…</Button>
          )}
        </div>
      )}
    </section>
  )
}
