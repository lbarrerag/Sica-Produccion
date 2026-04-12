import ExcelJS from "exceljs"

type FilaReporte = {
  id: number
  fechaRegistro: string
  identificador: string
  nombre: string
  obra: string
  centroCosto: string | null
  contratista: string | null
  fechaIngreso: string | null
  fechaSalida: string | null
}

function fmt(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export async function generarExcelRegistros(filas: FilaReporte[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Registros de Acceso")

  sheet.columns = [
    { header: "Id",               key: "id",           width: 10 },
    { header: "Fecha Registro",   key: "fechaRegistro",width: 14 },
    { header: "Identificador",    key: "identificador",width: 16 },
    { header: "Nombre",           key: "nombre",       width: 30 },
    { header: "Obra",             key: "obra",         width: 35 },
    { header: "Centro Costo",     key: "centroCosto",  width: 14 },
    { header: "Contratista",      key: "contratista",  width: 35 },
    { header: "Fecha/Hora Ingreso", key: "fechaIngreso", width: 20 },
    { header: "Fecha/Hora Salida",  key: "fechaSalida",  width: 20 },
  ]

  // Header style — verde oscuro
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF085c4e" } }
    cell.alignment = { horizontal: "center", vertical: "middle" }
  })
  sheet.getRow(1).height = 20

  for (const f of filas) {
    sheet.addRow({
      id:           f.id,
      fechaRegistro:f.fechaRegistro,
      identificador:f.identificador,
      nombre:       f.nombre,
      obra:         f.obra,
      centroCosto:  f.centroCosto ?? "",
      contratista:  f.contratista ?? "",
      fechaIngreso: fmt(f.fechaIngreso),
      fechaSalida:  fmt(f.fechaSalida),
    })
  }

  // Filas alternadas
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? "FFF0FAF7" : "FFFFFFFF" },
      }
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } }
    })
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Buffer.from(await workbook.xlsx.writeBuffer() as any)
}
