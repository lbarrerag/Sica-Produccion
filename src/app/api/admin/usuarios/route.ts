import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcrypt"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const users = await prisma.user.findMany({
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
    orderBy: { nombre: "asc" },
  })

  return Response.json(users)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { nombre, email, password, role: userRole, estado } = body

  if (!nombre || !email || !password)
    return Response.json({ error: "Nombre, email y password son requeridos" }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      nombre,
      email,
      passwordHash,
      role: userRole,
      estado,
      passwordVigente: false,
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

  return Response.json(user, { status: 201 })
}
