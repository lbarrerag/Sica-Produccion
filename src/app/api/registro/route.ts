import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getObraIdsPermitidos } from "@/lib/access"
import { chileInicioHoy } from "@/lib/chile-time"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "REGISTRO_MARCA" && role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { identificador, obraId, tipo } = body as {
    identificador: string
    obraId: number
    tipo: "ENTRADA" | "SALIDA"
  }

  if (!identificador || !obraId || !tipo)
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 })

  // Validar que el usuario tiene acceso a esta obra
  const userId = (session.user as { id: string }).id
  const obraIds = await getObraIdsPermitidos(userId, role)
  if (obraIds !== null && !obraIds.includes(Number(obraId)))
    return Response.json({ error: "No tiene acceso a esta obra" }, { status: 403 })

  const trabajador = await prisma.trabajador.findFirst({
    where: { identificador, estado: "VIGENTE" },
    include: { contratista: true },
  })

  if (!trabajador)
    return Response.json({ error: "Trabajador no encontrado o no vigente" }, { status: 404 })

  // Bloquear doble ENTRADA o doble SALIDA consecutiva en la misma obra (solo hoy)
  const ultimoRegistro = await prisma.registroAcceso.findFirst({
    where: {
      trabajadorId: trabajador.id,
      obraId: Number(obraId),
      fechaHora: { gte: chileInicioHoy() },
    },
    orderBy: { fechaHora: "desc" },
    select: { tipo: true },
  })

  if (ultimoRegistro?.tipo === tipo) {
    const accion = tipo === "ENTRADA" ? "entrada" : "salida"
    const pendiente = tipo === "ENTRADA" ? "salida" : "entrada"
    return Response.json(
      { error: `El trabajador ya tiene una ${accion} registrada en esta obra. Debe registrar ${pendiente} primero.` },
      { status: 409 }
    )
  }

  const registro = await prisma.registroAcceso.create({
    data: {
      trabajadorId: trabajador.id,
      obraId: Number(obraId),
      identificador: trabajador.identificador,
      tipo,
      fechaHora: new Date(),
      contratistaId: trabajador.contratistaId ?? undefined,
      identificadorContratista: trabajador.identificadorContratista ?? undefined,
    },
    include: {
      trabajador: { select: { nombre: true } },
    },
  })

  return Response.json({
    success: true,
    registro: {
      id: registro.id,
      tipo: registro.tipo,
      fechaHora: registro.fechaHora,
      trabajador: registro.trabajador,
    },
  }, { status: 201 })
}
