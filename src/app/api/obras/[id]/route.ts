import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const obra = await prisma.obra.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      nombre: true,
      centroCosto: true,
      estado: true,
      fechaInsert: true,
      registros: {
        take: 50,
        orderBy: { fechaHora: "desc" },
        select: {
          id: true,
          identificador: true,
          tipo: true,
          fechaHora: true,
          trabajador: { select: { id: true, nombre: true } },
        },
      },
    },
  })

  if (!obra) return Response.json({ error: "Obra no encontrada" }, { status: 404 })

  return Response.json(obra)
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

  const obra = await prisma.obra.update({
    where: { id: Number(id) },
    data: body,
  })

  return Response.json(obra)
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

  await prisma.obra.update({
    where: { id: Number(id) },
    data: { estado: "ELIMINADO" },
  })

  return Response.json({ success: true })
}
