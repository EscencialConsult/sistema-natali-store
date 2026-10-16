// Gestor web: todo lo que toca la tienda pública, en un solo lugar, para la administración (admin y superadmin).
// Lee la configuración del sistema (naty_config) sin modificarla; escribe únicamente en las tablas tienda_*.
import { useMemo, useRef, useState } from 'react'
import { resumenGlobal } from '../lib/gestor.js'
import Cuenta from './secciones/Cuenta.jsx'
import Contacto from './secciones/Contacto.jsx'
import Direcciones from './secciones/Direcciones.jsx'
import Estado from './secciones/Estado.jsx'
import Modelos from './secciones/Modelos.jsx'
import Resumen from './secciones/Resumen.jsx'
import Textos from './secciones/Textos.jsx'

const PESTANAS = [
  { id: 'resumen', nombre: 'Configuración global' },
  { id: 'cuenta', nombre: 'Cuenta' },
  { id: 'contacto', nombre: 'Contacto y locales' },
  { id: 'textos', nombre: 'Textos' },
  { id: 'modelos', nombre: 'Modelos' },
  { id: 'direcciones', nombre: 'Direcciones' },
]

export default function GestorWeb({ configInicial, naty, soloLectura }) {
  const [config, setConfig] = useState(configInicial)
  const [pestana, setPestana] = useState('resumen')
  const pestanas = useRef({})
  // Cambiar de pestaña lleva el foco a la pestaña elegida (sirve para «Editar» y «Resolver» del resumen).
  const irA = (id) => {
    setPestana(id)
    requestAnimationFrame(() => pestanas.current[id]?.focus())
  }
  const teclado = (e, i) => {
    const salto = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    const destino = e.key === 'Home' ? 0 : e.key === 'End' ? PESTANAS.length - 1 : salto ? (i + salto + PESTANAS.length) % PESTANAS.length : null
    if (destino === null) return
    e.preventDefault()
    irA(PESTANAS[destino].id)
  }
  // Las secciones avisan lo que guardaron para que el resumen y los avisos se pongan al día sin recargar.
  const alGuardar = (clave, valor) => setConfig((c) => ({ ...c, [clave]: valor }))
  const origen = typeof window === 'undefined' ? '' : window.location.origin
  const resumen = useMemo(() => resumenGlobal({ config, naty, origen }), [config, naty, origen])
  const urgentes = resumen.alertas.filter((a) => a.nivel !== 'info').length

  return (
    <section className="flex flex-col gap-5 lg:col-span-2" aria-labelledby="gestor-web">
      <div>
        <h2 id="gestor-web" className="text-xl">Gestor web</h2>
        <p className="text-sm text-texto-suave">Todo lo que ve la clienta en la tienda pública. Solo para la administración.</p>
      </div>

      <Estado config={config} soloLectura={soloLectura} alGuardar={alGuardar} origen={origen} />

      <div role="tablist" aria-label="Secciones del gestor web" className="flex gap-1 overflow-x-auto border-b border-borde/70">
        {PESTANAS.map((p, i) => (
          <button
            key={p.id}
            id={`gw-${p.id}`}
            ref={(el) => {
              pestanas.current[p.id] = el
            }}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            aria-controls={`gw-panel-${p.id}`}
            tabIndex={pestana === p.id ? 0 : -1}
            onKeyDown={(e) => teclado(e, i)}
            onClick={() => setPestana(p.id)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${pestana === p.id ? 'border-tinta text-tinta' : 'border-transparent text-texto-suave'}`}
          >
            {p.nombre}
            {p.id === 'resumen' && urgentes > 0 && <span className="ml-1.5 rounded-full bg-alerta-fondo px-1.5 text-xs text-alerta">{urgentes}</span>}
          </button>
        ))}
      </div>

      {/* Todos los paneles quedan montados: al cambiar de pestaña no se pierde lo que se estaba escribiendo. */}
      {[
        ['resumen', <Resumen key="r" resumen={resumen} irA={irA} />],
        ['cuenta', <Cuenta key="c" config={config} soloLectura={soloLectura} alGuardar={alGuardar} />],
        ['contacto', <Contacto key="co" config={config} soloLectura={soloLectura} alGuardar={alGuardar} />],
        ['textos', <Textos key="t" config={config} soloLectura={soloLectura} alGuardar={alGuardar} />],
        ['modelos', <Modelos key="m" soloLectura={soloLectura} />],
        ['direcciones', <Direcciones key="d" resumen={resumen} />],
      ].map(([id, panel]) => (
        <div key={id} id={`gw-panel-${id}`} role="tabpanel" aria-labelledby={`gw-${id}`} hidden={pestana !== id} className="flex flex-col gap-5">
          {panel}
        </div>
      ))}
    </section>
  )
}
