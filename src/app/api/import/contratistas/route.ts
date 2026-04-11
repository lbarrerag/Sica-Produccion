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

    const workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as any)
    const sheet = workbook.worksheets[0]

    // Fila 1 = título, fila 2 = cabeceras, fila 3+ = datos
    const headers: string[] = []
    sheet.getRow(2).eachCell({ includeEmpty: true }, (cell) =>
      headers.push(String(cell.value ?? "").trim())
    )

    const idx = (name: string) =>
      headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))
    const iIdentificador = idx("identificador")
    const iNombre = idx("nombre")
    const iEstado = idx("estado")
    const iDireccion = idx("direcci")
    const iEmail = idx("email")
    const iNombreContador = idx("contador")
    const iTelefono = idx("telefono")
    const iCiudad = idx("ciudad")
    const iEspecialidad = idx("especialidad")

    let importados = 0
    let errores = 0
    const mensajes: string[] = []

    for (let r = 3; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const val = (i: number) =>
        i >= 0 ? String(row.getCell(i + 1).value ?? "").trim() : ""
      const identificador = val(iIdentificador)
      const nombre = val(iNombre)
      if (!identificador || !nombre) continue
      const estadoRaw = val(iEstado).toLowerCase()
      const estado = estadoRaw === "vigente" ? "VIGENTE" : "ELIMINADO"
      const direccion = val(iDireccion) || null
      const email = val(iEmail) || null
      const nombreContador = val(iNombreContador) || null
      const telefono = val(iTelefono) || null
      const ciudad = val(iCiudad) || null
      const especialidad = val(iEspecialidad) || null
      try {
        await prisma.contratista.upsert({
          where: { identificador },
          update: {
            nombre,
            estado,
            direccion,
            email,
            nombreContador,
            telefono,
            ciudad,
            especialidad,
          },
          create: {
            identificador,
            nombre,
            estado,
            direccion,
            email,
            nombreContador,
            telefono,
            ciudad,
            especialidad,
          },
        })
        importados++
      } catch {
        errores++
        mensajes.push(`Fila ${r}: error al importar "${nombre}" (${identificador})`)
      }
    }

    return NextResponse.json({ importados, errores, mensajes })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
