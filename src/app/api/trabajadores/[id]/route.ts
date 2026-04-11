import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: Number(id) },
    include: {
      contratista: true,
      especialidad: true,
      registros: {
        orderBy: { fechaHora: "desc" },
        take: 20,
        include: { obra: true },
      },
    },
  })

  if (!trabajador) return Response.json({ error: "Trabajador no encontrado" }, { status: 404 })

  return Response.json(trabajador)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  const trabajador = await prisma.trabajador.update({
    where: { id: Number(id) },
    data: body,
  })

  return Response.json(trabajador)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  await prisma.trabajador.update({
    where: { id: Number(id) },
    data: { estado: "ELIMINADO" },
  })

  return Response.json({ success: true })
}
