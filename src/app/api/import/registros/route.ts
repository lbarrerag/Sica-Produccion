import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import ExcelJS from "exceljs"

const BATCH = 200 // registros por lote de insertMany

/**
 * Retorna el offset en horas de Chile Continental respecto a UTC.
 * Chile usa UTC-3 en horario de verano (oct–abr ~primer sábado)
 * y UTC-4 en horario de invierno (abr–oct).
 * Referencia: America/Santiago (IANA).
 */
function chileOffsetHoras(fecha: Date): number {
  const mes = fecha.getUTCMonth() + 1 // 1-12
  const dia = fecha.getUTCDate()
  // Horario de invierno: desde ~primer sábado de abril hasta ~primer sábado de octubre → UTC-4
  // Horario de verano : desde ~primer sábado de octubre hasta ~primer sábado de abril → UTC-3
  // Aproximación conservadora: abril completo y septiembre completo son bordes; usamos día 6 como corte
  const invierno =
    (mes > 4 && mes < 10) ||         // mayo–septiembre completo
    (mes === 4 && dia >= 6) ||        // abril desde el 6
    (mes === 10 && dia < 6)           // octubre antes del 6
  return invierno ? 4 : 3
}

/**
 * Combina una fecha base (Date de Excel, en UTC midnight) con la hora local de Chile
 * y devuelve un Date en UTC correcto.
 * ExcelJS puede entregar la hora como: Date, string "HH:MM:SS" o número (fracción del día).
 */
function parseFechaHora(fecha: Date, horaCell: ExcelJS.CellValue): Date | null {
  if (!horaCell) return null

  let hh = 0, mm = 0, ss = 0

  if (horaCell instanceof Date) {
    // ExcelJS devuelve horas como Date con base 1899-12-30; la parte UTC es la hora local
    hh = horaCell.getUTCHours()
    mm = horaCell.getUTCMinutes()
    ss = horaCell.getUTCSeconds()
  } else if (typeof horaCell === "string") {
    const parts = horaCell.trim().split(":")
    hh = parseInt(parts[0] ?? "0", 10)
    mm = parseInt(parts[1] ?? "0", 10)
    ss = parseInt(parts[2] ?? "0", 10)
  } else if (typeof horaCell === "number") {
    // Fracción del día: 0.5 = 12:00
    const totalSec = Math.round(horaCell * 86400)
    hh = Math.floor(totalSec / 3600)
    mm = Math.floor((totalSec % 3600) / 60)
    ss = totalSec % 60
  } else {
    return null
  }

  if (isNaN(hh) || isNaN(mm) || isNaN(ss)) return null

  // La hora del Excel es hora local Chile. Convertimos a UTC sumando el offset.
  // setUTCHours maneja desbordamiento automáticamente (ej: 23+4 → siguiente día a las 03).
  const dt = new Date(fecha)
  dt.setUTCHours(hh + chileOffsetHoras(fecha), mm, ss, 0)
  return dt
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as { role: string }).role !== "ADMINISTRADOR")
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
    // Columnas (base 1): B=2 Fecha, C=3 Identificador, D=4 Nombre,
    //   E=5 Obra, F=6 CentroCosto, G=7 Contratista, H=8 Ingreso, I=9 Salida

    // ── Cargar mapas de entidades existentes ──────────────────────────────────
    const [trabajadoresDB, obrasDB, contratistasDB] = await Promise.all([
      prisma.trabajador.findMany({ select: { id: true, identificador: true } }),
      prisma.obra.findMany({ select: { id: true, nombre: true } }),
      prisma.contratista.findMany({ select: { id: true, nombre: true, identificador: true } }),
    ])

    const mapaT = new Map(trabajadoresDB.map((t) => [t.identificador, t.id]))
    const mapaO = new Map(obrasDB.map((o) => [o.nombre.trim().toUpperCase(), o.id]))
    const mapaC = new Map(contratistasDB.map((c) => [c.nombre.trim().toUpperCase(), c.id]))

    const str = (v: ExcelJS.CellValue) => String(v ?? "").trim()

    let importados = 0
    let omitidos = 0
    const errores: string[] = []

    // Acumular lotes para insertMany
    const lote: {
      trabajadorId: number
      obraId: number
      identificador: string
      contratistaId: number | null
      tipo: "ENTRADA" | "SALIDA"
      fechaHora: Date
    }[] = []

    async function flushLote() {
      if (lote.length === 0) return
      await prisma.registroAcceso.createMany({ data: lote, skipDuplicates: false })
      importados += lote.length
      lote.length = 0
    }

    for (let r = 3; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const fechaCell = row.getCell(2).value
      const identificador = str(row.getCell(3).value)
      const nombre = str(row.getCell(4).value)
      const obraNombre = str(row.getCell(5).value)
      const centroCosto = str(row.getCell(6).value)
      const contratistaNombre = str(row.getCell(7).value)
      const ingresoCell = row.getCell(8).value
      const salidaCell = row.getCell(9).value

      if (!identificador || !obraNombre) {
        omitidos++
        continue
      }

      // Fecha base de la fila
      const fecha =
        fechaCell instanceof Date
          ? fechaCell
          : fechaCell
          ? new Date(String(fechaCell))
          : null
      if (!fecha || isNaN(fecha.getTime())) {
        omitidos++
        continue
      }

      // ── Resolver trabajadorId (crear si no existe) ─────────────────────────
      let trabajadorId = mapaT.get(identificador) ?? null
      if (!trabajadorId) {
        try {
          const t = await prisma.trabajador.upsert({
            where: { identificador },
            update: {},
            create: {
              identificador,
              nombre: nombre || identificador,
              estado: "VIGENTE",
            },
            select: { id: true },
          })
          mapaT.set(identificador, t.id)
          trabajadorId = t.id
        } catch {
          errores.push(`Fila ${r}: no se pudo crear trabajador ${identificador}`)
          continue
        }
      }

      // ── Resolver obraId (crear si no existe) ───────────────────────────────
      const obraKey = obraNombre.toUpperCase()
      let obraId = mapaO.get(obraKey) ?? null
      if (!obraId) {
        try {
          const o = await prisma.obra.create({
            data: {
              nombre: obraNombre,
              centroCosto: centroCosto || null,
              estado: "VIGENTE",
            },
            select: { id: true },
          })
          mapaO.set(obraKey, o.id)
          obraId = o.id
        } catch {
          errores.push(`Fila ${r}: no se pudo crear obra "${obraNombre}"`)
          continue
        }
      }

      // ── Resolver contratistaId (crear si no existe) ────────────────────────
      let contratistaId: number | null = null
      if (contratistaNombre) {
        const cKey = contratistaNombre.toUpperCase()
        contratistaId = mapaC.get(cKey) ?? null
        if (!contratistaId) {
          try {
            const c = await prisma.contratista.create({
              data: {
                nombre: contratistaNombre,
                identificador: `HIST-${Date.now()}-${r}`,
                estado: "VIGENTE",
              },
              select: { id: true },
            })
            mapaC.set(cKey, c.id)
            contratistaId = c.id
          } catch {
            // Si falla la creación, continuamos sin contratistaId
          }
        }
      }

      // ── Registro ENTRADA ───────────────────────────────────────────────────
      const dtIngreso = parseFechaHora(fecha, ingresoCell)
      if (dtIngreso) {
        lote.push({
          trabajadorId,
          obraId,
          identificador,
          contratistaId,
          tipo: "ENTRADA",
          fechaHora: dtIngreso,
        })
      }

      // ── Registro SALIDA ────────────────────────────────────────────────────
      const dtSalida = parseFechaHora(fecha, salidaCell)
      if (dtSalida) {
        lote.push({
          trabajadorId,
          obraId,
          identificador,
          contratistaId,
          tipo: "SALIDA",
          fechaHora: dtSalida,
        })
      }

      if (!dtIngreso && !dtSalida) omitidos++

      // Flush cada BATCH registros
      if (lote.length >= BATCH) await flushLote()
    }

    // Flush final
    await flushLote()

    return NextResponse.json({
      importados,
      omitidos,
      errores: errores.slice(0, 20), // máximo 20 mensajes
      totalErrores: errores.length,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
