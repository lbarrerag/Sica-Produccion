import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// ── Eliminación masiva ───────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as { role: string }).role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")
  const obraId = searchParams.get("obraId")
  const contratistaId = searchParams.get("contratistaId")

  const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999Z`) : undefined

  const { count } = await prisma.registroAcceso.deleteMany({
    where: {
      ...(fechaDesde && {
        fechaHora: {
          gte: new Date(`${fechaDesde}T00:00:00.000Z`),
          ...(hasta && { lte: hasta }),
        },
      }),
      ...(!fechaDesde && hasta && { fechaHora: { lte: hasta } }),
      ...(obraId && { obraId: Number(obraId) }),
      ...(contratistaId && { contratistaId: Number(contratistaId) }),
    },
  })

  return Response.json({ eliminados: count })
}

// ── Consulta ─────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")
  const obraId = searchParams.get("obraId")
  const contratistaId = searchParams.get("contratistaId")

  // fechaHasta incluye todo el día
  const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999Z`) : undefined

  const raw = await prisma.registroAcceso.findMany({
    where: {
      ...(fechaDesde && {
        fechaHora: {
          gte: new Date(`${fechaDesde}T00:00:00.000Z`),
          ...(hasta && { lte: hasta }),
        },
      }),
      ...(!fechaDesde && hasta && { fechaHora: { lte: hasta } }),
      ...(obraId && { obraId: Number(obraId) }),
      ...(contratistaId && { contratistaId: Number(contratistaId) }),
    },
    include: {
      trabajador: { select: { nombre: true } },
      obra: { select: { nombre: true, centroCosto: true } },
      contratista: { select: { nombre: true } },
    },
    orderBy: { fechaHora: "asc" },
  })

  // ── Agrupar por (identificador, obraId, fecha-día) ───────────────────────
  type Fila = {
    id: number
    fechaRegistro: string         // YYYY-MM-DD
    identificador: string
    nombre: string
    obra: string
    centroCosto: string | null
    contratista: string | null
    fechaIngreso: string | null   // ISO string
    fechaSalida: string | null    // ISO string
  }

  const mapaFilas = new Map<string, Fila>()

  for (const r of raw) {
    const dia = r.fechaHora.toISOString().slice(0, 10)           // YYYY-MM-DD
    const clave = `${r.identificador}||${r.obraId}||${dia}`

    if (!mapaFilas.has(clave)) {
      mapaFilas.set(clave, {
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

    const fila = mapaFilas.get(clave)!
    if (r.tipo === "ENTRADA") {
      // Guardar la primera ENTRADA del día
      if (!fila.fechaIngreso) fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      // Guardar la última SALIDA del día
      fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  // Ordenar por fecha desc, luego nombre asc
  const filas = Array.from(mapaFilas.values()).sort((a, b) => {
    const dif = b.fechaRegistro.localeCompare(a.fechaRegistro)
    return dif !== 0 ? dif : a.nombre.localeCompare(b.nombre)
  })

  return Response.json(filas)
}
