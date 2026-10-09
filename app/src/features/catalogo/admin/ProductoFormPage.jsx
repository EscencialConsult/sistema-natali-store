import { useNavigate, useParams } from 'react-router-dom'
import { Encabezado, ErrorState, Skeleton } from '../../../components/ui/index.js'
import { useCategorias, useProducto } from '../../../data/hooks.js'
import ProductoForm from './ProductoForm.jsx'

// Pantalla completa para crear/editar (celular, o si se entra directo por la dirección).
// En escritorio el listado abre el mismo formulario en un modal.
export default function ProductoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const prod = useProducto(id)
  const cats = useCategorias()

  if (prod.cargando || cats.cargando) return <Skeleton className="h-96" />
  if (prod.error || cats.error) return <ErrorState mensaje="No pudimos cargar el producto." onReintentar={() => { prod.reintentar(); cats.reintentar() }} />
  if (id && !prod.datos) return <ErrorState mensaje="Ese producto no existe." />
  return (
    <div className="flex flex-col gap-6">
      <Encabezado volver={{ a: '/catalogo/admin', texto: 'Volver a productos' }} titulo={prod.datos ? `Editar ${prod.datos.codigo}` : 'Nuevo producto'} descripcion={prod.datos?.nombre} />
      <ProductoForm key={id ?? 'nuevo'} producto={prod.datos} listaCategorias={cats.datos} onListo={() => navigate('/catalogo/admin')} />
    </div>
  )
}
