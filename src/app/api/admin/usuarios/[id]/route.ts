import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

function generarApiKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let key = ""
  for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length))
  return key
}

const SELECT_USER = {
  id: true,
  userName: true,
  email: true,
  role: true,
  estado: true,
  passwordVigente: true,
  createdAt: true,
  apiKey: true,
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
  const rolesConObras = ["SUPERVISOR", "REGISTRO_MARCA", "API"]
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

// PATCH /api/admin/usuarios/[id] — regenerar API key (solo para usuarios rol API)
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 })
  if (user.role !== "API") return Response.json({ error: "Solo aplica para usuarios de tipo API" }, { status: 400 })

  const newApiKey = generarApiKey()
  const passwordHash = await bcrypt.hash(newApiKey, 10)

  await prisma.user.update({
    where: { id },
    data: { apiKey: newApiKey, passwordHash },
  })

  return Response.json({ apiKey: newApiKey })
}
