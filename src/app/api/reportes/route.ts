import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

  const registros = await prisma.registroAcceso.findMany({
    where: {
      ...(fechaDesde && { fechaHora: { gte: new Date(fechaDesde) } }),
      ...(fechaHasta && {
        fechaHora: {
          ...(fechaDesde && { gte: new Date(fechaDesde) }),
          lte: new Date(fechaHasta),
        },
      }),
      ...(obraId && { obraId: Number(obraId) }),
      ...(contratistaId && {
        trabajador: { contratistaId: Number(contratistaId) },
      }),
    },
    include: {
      trabajador: {
        select: { nombre: true },
      },
      obra: {
        select: { nombre: true },
      },
    },
    orderBy: { fechaHora: "desc" },
  })

  return Response.json(registros)
}
