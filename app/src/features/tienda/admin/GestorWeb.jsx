// Gestor web: todo lo que toca la tienda pública, en un solo lugar y solo para el superadministrador.
// Lee la configuración del sistema (naty_config) sin modificarla; escribe únicamente en las tablas tienda_*.
import { useMemo, useState } from 'react'
import { resumenGlobal } from '../lib/gestor.js'
import Cuenta from './secciones/Cuenta.jsx'
import Contacto from './secciones/Contacto.jsx'
import Direcciones from './secciones/Direcciones.jsx'
import Modelos from './secciones/Modelos.jsx'
import Resumen from './secciones/Resumen.jsx'
import Textos from './secciones/Textos.jsx'

const PESTANAS = [
  { id: 'resumen', nombre: 'Resumen' },
  { id: 'cuenta', nombre: 'Cuenta' },
  { id: 'contacto', nombre: 'Contacto y locales' },
  { id: 'textos', nombre: 'Textos' },
  { id: 'modelos', nombre: 'Modelos' },
  { id: 'direcciones', nombre: 'Direcciones' },
]

export default function GestorWeb({ configInicial, naty, soloLectura }) {
  const [config, setConfig] = useState(configInicial)
  const [pestana, setPestana] = useState('resumen')
  // Las secciones avisan lo que guardaron para que el resumen y los avisos se pongan al día sin recargar.
  const alGuardar = (clave, valor) => setConfig((c) => ({ ...c, [clave]: valor }))
  const origen = typeof window === 'undefined' ? '' : window.location.origin
  const resumen = useMemo(() => resumenGlobal({ config, naty, origen }), [config, naty, origen])
  const urgentes = resumen.alertas.filter((a) => a.nivel !== 'info').length

  return (
    <section className="flex flex-col gap-5 lg:col-span-2" aria-labelledby="gestor-web">
      <div>
        <h2 id="gestor-web" className="text-xl">Gestor web</h2>
        <p className="text-sm text-texto-suave">Todo lo que ve la clienta en la tienda pública. Solo para el superadministrador.</p>
      </div>

      <div role="tablist" aria-label="Secciones del gestor web" className="flex gap-1 overflow-x-auto border-b border-borde/70">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            id={`gw-${p.id}`}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            aria-controls="gw-panel"
            onClick={() => setPestana(p.id)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium ${pestana === p.id ? 'border-tinta text-tinta' : 'border-transparent text-texto-suave'}`}
          >
            {p.nombre}
            {p.id === 'resumen' && urgentes > 0 && <span className="ml-1.5 rounded-full bg-alerta-fondo px-1.5 text-xs text-alerta">{urgentes}</span>}
          </button>
        ))}
      </div>

      <div id="gw-panel" role="tabpanel" aria-labelledby={`gw-${pestana}`} className="flex flex-col gap-5">
        {pestana === 'resumen' && <Resumen resumen={resumen} irA={setPestana} />}
        {pestana === 'cuenta' && <Cuenta config={config} soloLectura={soloLectura} alGuardar={alGuardar} />}
        {pestana === 'contacto' && <Contacto config={config} soloLectura={soloLectura} alGuardar={alGuardar} />}
        {pestana === 'textos' && <Textos config={config} soloLectura={soloLectura} alGuardar={alGuardar} />}
        {pestana === 'modelos' && <Modelos soloLectura={soloLectura} />}
        {pestana === 'direcciones' && <Direcciones resumen={resumen} />}
      </div>
    </section>
  )
}
