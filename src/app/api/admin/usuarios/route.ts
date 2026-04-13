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

function generarPasswordTemporal(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { userName, email, role: userRole, obraIds } = body

  if (!userName)
    return Response.json({ error: "El nombre de usuario es requerido" }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { userName } })
  if (existing) return Response.json({ error: "El nombre de usuario ya existe" }, { status: 409 })

  const tempPassword = generarPasswordTemporal()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const rolFinal = userRole ?? "REGISTRO_MARCA"
  const esApiRole = rolFinal === "API"
  const rolesConObras = ["SUPERVISOR", "REGISTRO_MARCA", "API"]
  const asignarObras = rolesConObras.includes(rolFinal) &&
    Array.isArray(obraIds) && obraIds.length > 0

  const user = await prisma.user.create({
    data: {
      userName,
      email: email || null,
      passwordHash,
      role: rolFinal,
      estado: "VIGENTE",
      passwordVigente: false,
      // Para rol API, guardar el apiKey en texto plano para autenticación por Bearer token
      ...(esApiRole ? { apiKey: tempPassword } : {}),
      ...(asignarObras
        ? { userObras: { create: obraIds.map((id: number) => ({ obraId: id })) } }
        : {}),
    },
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      estado: true,
      passwordVigente: true,
      createdAt: true,
      apiKey: true,
    },
  })

  return Response.json({ ...user, tempPassword }, { status: 201 })
}
