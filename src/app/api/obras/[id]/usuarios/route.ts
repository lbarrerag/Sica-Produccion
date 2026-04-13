import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/obras/[id]/usuarios — lista usuarios asignados a la obra
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  const obraId = parseInt(id, 10)
  if (isNaN(obraId)) return Response.json({ error: "ID inválido" }, { status: 400 })

  const userObras = await prisma.userObra.findMany({
    where: { obraId },
    include: {
      user: {
        select: { id: true, userName: true, email: true, role: true, estado: true },
      },
    },
  })

  return Response.json(userObras.map((uo) => uo.user))
}

// PUT /api/obras/[id]/usuarios — reemplaza la lista de usuarios asignados a la obra
// Body: { userIds: string[] }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  const obraId = parseInt(id, 10)
  if (isNaN(obraId)) return Response.json({ error: "ID inválido" }, { status: 400 })

  const body = await request.json()
  const { userIds } = body as { userIds: string[] }

  if (!Array.isArray(userIds))
    return Response.json({ error: "userIds debe ser un arreglo" }, { status: 400 })

  // Reemplazar asignaciones
  await prisma.userObra.deleteMany({ where: { obraId } })
  if (userIds.length > 0) {
    await prisma.userObra.createMany({
      data: userIds.map((userId) => ({ userId, obraId })),
    })
  }

  return Response.json({ ok: true })
}
