import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generarExcelRegistros } from "@/lib/excel"
import { getObraIdsPermitidos, buildRegistroObraFilter } from "@/lib/access"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR_CENTRAL" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const userId = (session.user as { id: string }).id
  const obraIdsPermitidos = await getObraIdsPermitidos(userId, role)

  const { searchParams } = new URL(request.url)
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")
  const obraId = searchParams.get("obraId")
  const contratistaId = searchParams.get("contratistaId")

  const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999Z`) : undefined

  // Construir filtro de obra respetando permisos del usuario
  let obraWhere: object = buildRegistroObraFilter(obraIdsPermitidos)
  if (obraId) {
    const obraIdNum = Number(obraId)
    if (obraIdsPermitidos === null || obraIdsPermitidos.includes(obraIdNum)) {
      obraWhere = { obraId: obraIdNum }
    } else {
      obraWhere = { obraId: -1 }
    }
  }

  const raw = await prisma.registroAcceso.findMany({
    where: {
      ...obraWhere,
      ...(fechaDesde && {
        fechaHora: {
          gte: new Date(`${fechaDesde}T00:00:00.000Z`),
          ...(hasta && { lte: hasta }),
        },
      }),
      ...(!fechaDesde && hasta && { fechaHora: { lte: hasta } }),
      ...(contratistaId && { contratistaId: Number(contratistaId) }),
    },
    include: {
      trabajador: { select: { nombre: true } },
      obra: { select: { nombre: true, centroCosto: true } },
      contratista: { select: { nombre: true } },
    },
    orderBy: { fechaHora: "asc" },
  })

  // Mismo agrupamiento que el API de reportes
  type Fila = {
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

  const mapa = new Map<string, Fila>()

  for (const r of raw) {
    const dia = r.fechaHora.toISOString().slice(0, 10)
    const clave = `${r.identificador}||${r.obraId}||${dia}`
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        id: r.id,
        fechaRegistro: dia,
        identificador: r.identificador,
        nombre: r.trabajador.nombre,
        obra: r.obra.nombre,
        centroCosto: r.obra.centroCosto ?? null,
        contratista: r.contratista?.nombre ?? null,
        fechaIngreso: null,
        fechaSalida: null,
      })
    }
    const fila = mapa.get(clave)!
    if (r.tipo === "ENTRADA") {
      if (!fila.fechaIngreso) fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  const filas = Array.from(mapa.values()).sort((a, b) => {
    const dif = b.fechaRegistro.localeCompare(a.fechaRegistro)
    return dif !== 0 ? dif : a.nombre.localeCompare(b.nombre)
  })

  const buffer = await generarExcelRegistros(filas)

  return new Response(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="registros.xlsx"',
    },
  })
}
