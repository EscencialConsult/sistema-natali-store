import { useState } from 'react'
import { Input } from '../../../../components/ui/index.js'
import { fechaDia } from '../../../../lib/fechas.js'
import { MONEDAS_TRANSFERENCIA, NOMBRE_MONEDA, estadoCuenta, formatearCuit, validarTransferencia } from '../../lib/configTienda.js'
import { guardarClave } from '../api.js'
import { Aviso, Tarjeta } from '../componentes.jsx'

// Cuenta de transferencia: lo que ve la clienta al pagar. Con fecha de cambio opcional para que el sistema avise a tiempo.
export default function Cuenta({ config, soloLectura, alGuardar }) {
  const t = validarTransferencia(config.transferencia).valor ?? {}
  const [v, setV] = useState({
    banco: t.banco ?? '', titular: t.titular ?? '', cuit: t.cuit ?? '', cbu: t.cbu ?? '', cuenta: t.cuenta ?? '',
    alias: t.alias ?? '', nota: t.nota ?? '', moneda: t.moneda ?? 'ars', cambiar_el: t.cambiar_el ?? '',
  })
  const cambiar = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }))
  const estado = estadoCuenta(t)

  return (
    <Tarjeta
      titulo="Cuenta de transferencia"
      ayuda="La ve la clienta al elegir «Transferencia» en su pedido. Se cambia cada 2 meses: poné la fecha y el sistema te avisa antes."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const { valor, errores } = validarTransferencia(v)
        if (errores.length) return errores
        // actualizado_en queda registrado en cada guardado: sin fecha de cambio, la tienda avisa por antigüedad.
        const nuevo = valor ? { ...valor, actualizado_en: new Date().toISOString() } : {}
        await guardarClave('transferencia', nuevo)
        alGuardar?.('transferencia', nuevo)
        return []
      }}
    >
      {estado.estado === 'vencida' && (
        <Aviso nivel="alta">Esta cuenta ya venció{estado.motivo === 'fecha_de_cambio' ? ` el ${fechaDia(`${t.cambiar_el}T12:00:00`)}` : ''}. Cargá la cuenta nueva y guardá.</Aviso>
      )}
      {estado.estado === 'por_vencer' && <Aviso nivel="media">Esta cuenta se cambia {estado.dias <= 0 ? 'hoy' : `en ${estado.dias} días`}. Tené lista la nueva.</Aviso>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input etiqueta="Titular" value={v.titular} onChange={cambiar('titular')} maxLength={80} />
        <Input etiqueta="CUIT o CUIL" inputMode="numeric" value={v.cuit} onChange={cambiar('cuit')} maxLength={16} ayuda={v.cuit.replace(/\D/g, '').length === 11 ? formatearCuit(v.cuit.replace(/\D/g, '')) : '11 números'} />
        <Input etiqueta="Banco" value={v.banco} onChange={cambiar('banco')} maxLength={60} />
        <Input etiqueta="CBU" inputMode="numeric" value={v.cbu} onChange={cambiar('cbu')} maxLength={30} ayuda="22 números" />
        <Input etiqueta="Alias" value={v.alias} onChange={cambiar('alias')} maxLength={60} />
        <Input etiqueta="Número de cuenta" value={v.cuenta} onChange={cambiar('cuenta')} maxLength={60} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          La clienta transfiere en
          <select value={v.moneda} onChange={cambiar('moneda')} className="min-h-11 rounded-control border border-borde-campo bg-fondo px-3 text-base font-normal">
            {MONEDAS_TRANSFERENCIA.map((m) => <option key={m} value={m}>{NOMBRE_MONEDA[m]}</option>)}
          </select>
        </label>
        <Input etiqueta="Cambiar esta cuenta el (opcional)" type="date" value={v.cambiar_el} onChange={cambiar('cambiar_el')} ayuda="Una semana antes aparece un aviso acá y en Ajustes." />
      </div>
      <Input etiqueta="Nota (opcional)" value={v.nota} onChange={cambiar('nota')} maxLength={300} ayuda="Ej.: indicá tu nombre y el modelo en el comprobante." />
    </Tarjeta>
  )
}
