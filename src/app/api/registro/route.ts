import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

  const trabajador = await prisma.trabajador.findFirst({
    where: { identificador, estado: "VIGENTE" },
    include: { contratista: true },
  })

  if (!trabajador)
    return Response.json({ error: "Trabajador no encontrado o no vigente" }, { status: 404 })

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
