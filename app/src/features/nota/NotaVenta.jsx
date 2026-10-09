import { QRCodeSVG } from 'qrcode.react'
import { urlDeImagen } from '../../lib/blobUrl.js'
import { fechaLarga } from '../../lib/fechas.js'
import { formatear, META_MONEDA } from '../../lib/moneda.js'
import './nota.css'

const PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia' }
const tasa = (n) => String(n).replace('.', ',')

// Nota de venta A5. Es solo presentación: recibe la venta ya guardada (con copia de nombres) y la configuración.
// Teléfonos del pie: vendedores y encargada de tienda, tomados de los perfiles (Ajustes).
export default function NotaVenta({ venta, cfg, equipo }) {
  const vendedores = equipo.filter((p) => p.rol === 'vendedor' && p.telefono)
  const tienda = equipo.filter((p) => p.rol === 'enc_tienda' && p.telefono)
  const logo = urlDeImagen(cfg.logo)
  const nombre = cfg.negocio?.nombre ?? 'Modas Naty'
  const url = cfg.url_catalogo
  const docenas = venta.items.reduce((t, i) => t + (i.unidad === 'docena' ? i.cantidad : 0), 0)
  const prendas = venta.items.reduce((t, i) => t + i.unidades, 0)

  return (
    <div className={venta.estado === 'anulada' ? 'nota nota--anulada' : 'nota'}>
      <table className="nota-tabla">
        <thead>
          <tr>
            <td>
              <div className="nota-cab">
                {logo ? <img className="nota-logo" src={logo} alt={nombre} /> : <div className="nota-marca">{nombre}</div>}
                {url && (
                  <div className="nota-qr">
                    <QRCodeSVG value={url} size={256} level="M" marginSize={2} title="Código QR del catálogo" />
                    <span>Escaneá y mirá el catálogo</span>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="nota-cuerpo">
              <div className="nota-titulo">
                <h1>NOTA DE VENTA</h1>
                <p>
                  <span className="nota-numero">{venta.numero}</span>
                  <br />
                  {fechaLarga(venta.creada_en)}
                </p>
              </div>

              <dl className="nota-datos">
                <div><dt>Cliente: </dt><dd>{venta.cliente_nombre || '—'}</dd></div>
                <div><dt>Vendedor/a: </dt><dd>{venta.vendedor_nombre || '—'}</dd></div>
                <div><dt>Pago: </dt><dd>{PAGO[venta.metodo_pago]}</dd></div>
                <div>
                  <dt>Moneda: </dt>
                  <dd>
                    {META_MONEDA[venta.moneda].nombre}
                    {venta.moneda !== 'usd' && ` (1 US$ = ${META_MONEDA[venta.moneda].simbolo} ${tasa(venta.tipo_cambio)})`}
                  </dd>
                </div>
                {venta.estado === 'anulada' && <div><dt>Estado: </dt><dd>ANULADA</dd></div>}
              </dl>

              <table className="nota-items">
                <thead>
                  <tr>
                    <th>Cód.</th>
                    <th>Descripción</th>
                    <th className="num">Doc.</th>
                    <th className="num">Precio</th>
                    <th className="num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((i) => (
                    <tr key={i.id}>
                      <td className="cod">{i.codigo}</td>
                      <td>
                        {i.nombre}
                        <span className="color">{i.color_nombre}</span>
                      </td>
                      <td className="num">{i.cantidad}{i.unidad === 'unidad' ? ' u.' : ''}</td>
                      <td className="num">{formatear(i.precio_cent, venta.moneda)}</td>
                      <td className="num">{formatear(i.subtotal_cent, venta.moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="nota-total">
                <div>
                  <span>TOTAL</span>
                  <small>{docenas} {docenas === 1 ? 'docena' : 'docenas'} · {prendas} prendas</small>
                </div>
                <strong>{formatear(venta.total_cent, venta.moneda)}</strong>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <div className="nota-pie">
                <div>
                  <h2>Vendedores</h2>
                  <ul>{vendedores.map((p) => <li key={p.id}>{p.nombre}: {p.telefono}</li>)}</ul>
                </div>
                <div>
                  <h2>Encargada de tienda</h2>
                  <ul>{tienda.map((p) => <li key={p.id}>{p.nombre}: {p.telefono}</li>)}</ul>
                </div>
                <p className="nota-gracias">¡Gracias por tu compra!</p>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
