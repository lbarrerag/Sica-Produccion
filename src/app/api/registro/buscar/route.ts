import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getObraIdsPermitidos } from "@/lib/access"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "REGISTRO_MARCA" && role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const rut = searchParams.get("rut")
  const obraId = searchParams.get("obraId")

  if (!rut) return Response.json({ error: "El parámetro rut es requerido" }, { status: 400 })

  // Validar acceso a la obra si se especifica
  if (obraId) {
    const userId = (session.user as { id: string }).id
    const obraIds = await getObraIdsPermitidos(userId, role)
    if (obraIds !== null && !obraIds.includes(Number(obraId)))
      return Response.json({ error: "No tiene acceso a esta obra" }, { status: 403 })
  }

  const trabajador = await prisma.trabajador.findFirst({
    where: { identificador: rut, estado: "VIGENTE" },
    include: {
      contratista: true,
    },
  })

  if (!trabajador)
    return Response.json({ error: "Trabajador no encontrado o no vigente" }, { status: 404 })

  const ultimoRegistro = await prisma.registroAcceso.findFirst({
    where: {
      trabajadorId: trabajador.id,
      ...(obraId && { obraId: Number(obraId) }),
    },
    orderBy: { fechaHora: "desc" },
  })

  const accionSugerida: "ENTRADA" | "SALIDA" =
    ultimoRegistro?.tipo === "ENTRADA" ? "SALIDA" : "ENTRADA"

  return Response.json({
    id: trabajador.id,
    nombre: trabajador.nombre,
    identificador: trabajador.identificador,
    nombreContratista: trabajador.contratista?.nombre ?? null,
    especialidad: trabajador.especialidad ?? null,
    ultimoRegistro: ultimoRegistro
      ? {
          tipo: ultimoRegistro.tipo,
          fechaHora: ultimoRegistro.fechaHora.toISOString(),
        }
      : null,
    accionSugerida,
  })
}
