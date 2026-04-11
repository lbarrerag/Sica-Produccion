import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })

  const especialidades = await prisma.especialidad.findMany({
    where: { estado: "VIGENTE" },
    orderBy: { nombre: "asc" },
  })

  return Response.json(especialidades)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { nombre } = body

  if (!nombre) return Response.json({ error: "El nombre es requerido" }, { status: 400 })

  const especialidad = await prisma.especialidad.create({
    data: { nombre },
  })

  return Response.json(especialidad, { status: 201 })
}
