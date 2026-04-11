import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
  const { nombre } = body

  if (!nombre) return Response.json({ error: "El nombre es requerido" }, { status: 400 })

  const especialidad = await prisma.especialidad.update({
    where: { id: Number(id) },
    data: { nombre },
  })

  return Response.json(especialidad)
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

  await prisma.especialidad.update({
    where: { id: Number(id) },
    data: { estado: "ELIMINADO" },
  })

  return Response.json({ success: true })
}
