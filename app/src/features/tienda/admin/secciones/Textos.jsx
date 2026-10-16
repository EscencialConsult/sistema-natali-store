import { useState } from 'react'
import { validarComoComprar, validarHorarios, validarQuienesSomos } from '../../lib/configTienda.js'
import { guardarClave } from '../api.js'
import { Tarjeta } from '../componentes.jsx'

const AREA = 'rounded-control border border-borde-campo bg-fondo p-3 text-base font-normal'

export default function Textos({ config, soloLectura, alGuardar }) {
  const [horarios, setHorarios] = useState(() => validarHorarios(config.horarios).valor.join('\n'))
  const [pasos, setPasos] = useState(() => validarComoComprar(config.como_comprar).valor.join('\n'))
  const [quienes, setQuienes] = useState(() => validarQuienesSomos(config.quienes_somos).valor.join('\n'))

  return (
    <Tarjeta
      titulo="Textos de la tienda"
      ayuda="Un renglón por línea. Si dejás «Cómo comprar» o «Quiénes somos» vacíos, se usan los textos por defecto."
      soloLectura={soloLectura}
      onGuardar={async () => {
        const h = validarHorarios(horarios)
        const p = validarComoComprar(pasos)
        const q = validarQuienesSomos(quienes)
        const errores = [...h.errores, ...p.errores, ...q.errores]
        if (errores.length) return errores
        await guardarClave('horarios', h.valor)
        await guardarClave('como_comprar', p.valor)
        await guardarClave('quienes_somos', q.valor)
        alGuardar?.('horarios', h.valor)
        alGuardar?.('como_comprar', p.valor)
        alGuardar?.('quienes_somos', q.valor)
        return []
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Horarios de atención
        <textarea value={horarios} onChange={(e) => setHorarios(e.target.value)} rows={4} className={AREA} placeholder="Lunes a sábado: 8:00 a 18:00" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Pasos de «Cómo comprar»
        <textarea value={pasos} onChange={(e) => setPasos(e.target.value)} rows={5} className={AREA} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        «Quiénes somos» (un párrafo por línea)
        <textarea value={quienes} onChange={(e) => setQuienes(e.target.value)} rows={5} className={AREA} />
      </label>
    </Tarjeta>
  )
}
