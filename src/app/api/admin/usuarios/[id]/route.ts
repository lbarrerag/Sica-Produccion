import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
      updatedAt: true,
      userObras: {
        include: { obra: true },
      },
    },
  })

  if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 })

  return Response.json(user)
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
  const { role: userRole, estado, email, obras } = body

  // Update user fields
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(userRole !== undefined && { role: userRole }),
      ...(estado !== undefined && { estado }),
      ...(email !== undefined && { email }),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Sync UserObra table if obras array is provided
  if (Array.isArray(obras)) {
    // Delete all existing UserObra entries for this user
    await prisma.userObra.deleteMany({ where: { userId: id } })

    // Create new entries
    if (obras.length > 0) {
      await prisma.userObra.createMany({
        data: obras.map((obraId: number) => ({ userId: id, obraId })),
      })
    }
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
      updatedAt: true,
      userObras: {
        include: { obra: true },
      },
    },
  })

  return Response.json(updatedUser)
}
