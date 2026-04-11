import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
      userObras: { select: { obraId: true } },
    },
    orderBy: { userName: "asc" },
  })

  return Response.json(users)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { userName, email, password, role: userRole } = body

  if (!userName || !password)
    return Response.json({ error: "El nombre de usuario y contraseña son requeridos" }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { userName } })
  if (existing) return Response.json({ error: "El nombre de usuario ya existe" }, { status: 409 })

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      userName,
      email,
      passwordHash,
      role: userRole ?? "REGISTRO_MARCA",
      estado: "VIGENTE",
      passwordVigente: false,
    },
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
    },
  })

  return Response.json(user, { status: 201 })
}
