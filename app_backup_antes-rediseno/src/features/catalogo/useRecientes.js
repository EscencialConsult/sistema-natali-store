import { useCallback, useState } from 'react'

const CLAVE = 'naty.busquedas'
const MAX = 8

const leer = () => {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(v) ? v.slice(0, MAX) : []
  } catch {
    return []
  }
}

// Últimos códigos que el vendedor abrió (comodidad por dispositivo; si no hay almacenamiento, no pasa nada).
export function useRecientes() {
  const [lista, setLista] = useState(leer)
  const agregar = useCallback((codigo) => {
    setLista((prev) => {
      const nueva = [codigo, ...prev.filter((c) => c !== codigo)].slice(0, MAX)
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nueva))
      } catch {
        /* sin almacenamiento */
      }
      return nueva
    })
  }, [])
  return { recientes: lista, agregar }
}
