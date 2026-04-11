import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR")
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file)
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 })

    const buffer = new Uint8Array(await file.arrayBuffer())
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as Buffer)
    const sheet = workbook.worksheets[0]

    // Fila 1 = título, fila 2 = cabeceras, fila 3+ = datos
    const headers: string[] = []
    sheet.getRow(2).eachCell({ includeEmpty: true }, (cell) =>
      headers.push(String(cell.value ?? "").trim())
    )

    const idx = (name: string) =>
      headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))
    const iNombre = idx("nombre")
    const iCentro = idx("centro")
    const iEstado = idx("estado")

    let importados = 0
    let errores = 0
    const mensajes: string[] = []

    for (let r = 3; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const val = (i: number) =>
        i >= 0 ? String(row.getCell(i + 1).value ?? "").trim() : ""
      const nombre = val(iNombre)
      if (!nombre) continue
      const estadoRaw = val(iEstado).toLowerCase()
      const estado = estadoRaw === "vigente" ? "VIGENTE" : "ELIMINADO"
      const centroCosto = val(iCentro) || null
      try {
        await prisma.obra.create({
          data: { nombre, centroCosto, estado },
        })
        importados++
      } catch {
        errores++
        mensajes.push(`Fila ${r}: error al importar "${nombre}"`)
      }
    }

    return NextResponse.json({ importados, errores, mensajes })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
