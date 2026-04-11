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
    const iIdentificador = idx("identificador")
    const iNombre = idx("nombre")
    // "Identificador Contratista" — buscamos la cabecera que tiene "contratista" e "identif"
    const iIdentContratista = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("identificador") &&
        h.toLowerCase().includes("contratista")
    )
    const iNombreContratista = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("nombre") &&
        h.toLowerCase().includes("contratista")
    )
    const iEstado = idx("estado")
    const iDireccion = idx("direcci")
    const iFechaNacimiento = idx("fecha")
    const iCiudad = idx("ciudad")
    const iEspecialidad = idx("especialidad")
    const iTelefono = idx("telefono")

    // Cargar todos los contratistas para hacer el mapa rut → id
    const contratistasDb = await prisma.contratista.findMany({
      select: { id: true, identificador: true },
    })
    const mapaContratistas = new Map(
      contratistasDb.map((c) => [c.identificador, c.id])
    )

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
      const ciudad = val(iCiudad) || null
      const especialidad = val(iEspecialidad) || null
      const telefono = val(iTelefono) || null
      const identificadorContratista = val(iIdentContratista) || null
      const nombreContratista = val(iNombreContratista) || null

      // Resolver contratistaId desde el mapa
      const contratistaId = identificadorContratista
        ? (mapaContratistas.get(identificadorContratista) ?? null)
        : null

      // Parsear fecha de nacimiento
      let fechaNacimiento: Date | null = null
      const fechaRaw = val(iFechaNacimiento)
      if (fechaRaw) {
        const parsed = new Date(fechaRaw)
        if (!isNaN(parsed.getTime())) {
          fechaNacimiento = parsed
        }
      }

      try {
        await prisma.trabajador.upsert({
          where: { identificador },
          update: {
            nombre,
            contratistaId,
            identificadorContratista,
            nombreContratista,
            estado,
            direccion,
            ciudad,
            especialidad,
            telefono,
            fechaNacimiento,
          },
          create: {
            identificador,
            nombre,
            contratistaId,
            identificadorContratista,
            nombreContratista,
            estado,
            direccion,
            ciudad,
            especialidad,
            telefono,
            fechaNacimiento,
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
