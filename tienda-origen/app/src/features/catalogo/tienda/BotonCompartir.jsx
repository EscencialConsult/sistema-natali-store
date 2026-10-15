import { Button, useToast } from '../../../components/ui/index.js'

// Web Share API donde existe (celular); si no, copia el enlace.
export default function BotonCompartir({ titulo, texto }) {
  const avisar = useToast()
  const compartir = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: texto, url })
        return
      }
      await navigator.clipboard.writeText(url)
      avisar('Enlace copiado', 'exito')
    } catch (e) {
      if (e?.name !== 'AbortError') avisar('No se pudo compartir. Copiá la dirección de la barra del navegador.', 'error')
    }
  }
  return <Button variante="secundario" onClick={compartir}>Compartir</Button>
}
