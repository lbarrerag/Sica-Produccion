import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const SELECT_USER = {
  id: true,
  userName: true,
  email: true,
  role: true,
  estado: true,
  passwordVigente: true,
  createdAt: true,
} as const

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
      ...SELECT_USER,
      userObras: { include: { obra: true } },
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
  const { role: userRole, estado, email, obraIds } = body

  await prisma.user.update({
    where: { id },
    data: {
      ...(userRole !== undefined && { role: userRole }),
      ...(estado !== undefined && { estado }),
      ...(email !== undefined && { email }),
    },
  })

  // Sincronizar obras si el rol las necesita; si no, limpiar asignaciones
  const rolesConObras = ["SUPERVISOR", "REGISTRO_MARCA"]
  const rolFinal = userRole ?? (await prisma.user.findUnique({ where: { id }, select: { role: true } }))?.role
  if (!rolesConObras.includes(rolFinal as string)) {
    // ADMINISTRADOR, SUPERVISOR_CENTRAL, API → sin restricción de obras
    await prisma.userObra.deleteMany({ where: { userId: id } })
  } else if (Array.isArray(obraIds)) {
    await prisma.userObra.deleteMany({ where: { userId: id } })
    if (obraIds.length > 0) {
      await prisma.userObra.createMany({
        data: obraIds.map((obraId: number) => ({ userId: id, obraId })),
      })
    }
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id },
    select: {
      ...SELECT_USER,
      userObras: { include: { obra: true } },
    },
  })

  return Response.json(updatedUser)
}
