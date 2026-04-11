import ExcelJS from "exceljs"
import { formatFecha } from "@/lib/utils"

type RegistroRow = {
  fechaHora: Date
  identificador: string
  nombre: string
  nombreContratista: string | null
  obra: string
  tipo: "ENTRADA" | "SALIDA"
}

export async function generarExcelRegistros(
  registros: RegistroRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Registros de Acceso")

  sheet.columns = [
    { header: "Fecha/Hora", key: "fechaHora", width: 20 },
    { header: "RUT", key: "identificador", width: 15 },
    { header: "Nombre", key: "nombre", width: 30 },
    { header: "Empresa", key: "empresa", width: 30 },
    { header: "Obra", key: "obra", width: 30 },
    { header: "Tipo", key: "tipo", width: 10 },
  ]

  // Header style
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" },
    }
    cell.alignment = { horizontal: "center" }
  })

  for (const r of registros) {
    sheet.addRow({
      fechaHora: formatFecha(r.fechaHora),
      identificador: r.identificador,
      nombre: r.nombre,
      empresa: r.nombreContratista ?? "",
      obra: r.obra,
      tipo: r.tipo,
    })
  }

  // Alternate row colors
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? "FFF1F5F9" : "FFFFFFFF" },
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
