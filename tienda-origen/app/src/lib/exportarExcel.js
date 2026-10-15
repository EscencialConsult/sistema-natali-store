// Exporta tablas a Excel (exceljs se baja solo cuando se usa). Los importes van como números (no texto), en la moneda indicada.
// columnas: [{ header, key, width?, moneda?: true }]. filas: objetos con los `key`; los importes en centavos se convierten.
export async function crearExcel(hojas) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  for (const h of hojas) {
    const ws = wb.addWorksheet(h.nombre.slice(0, 31))
    ws.columns = h.columnas.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }))
    ws.getRow(1).font = { bold: true }
    for (const f of h.filas) {
      const fila = { ...f }
      for (const c of h.columnas) if (c.moneda && typeof fila[c.key] === 'number') fila[c.key] = fila[c.key] / 100
      ws.addRow(fila)
    }
    for (const c of h.columnas) if (c.moneda) ws.getColumn(c.key).numFmt = '#,##0.00'
  }
  return new Blob([await wb.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
