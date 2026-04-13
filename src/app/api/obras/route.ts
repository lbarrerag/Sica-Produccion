import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getObraIdsPermitidos, buildObraFilter } from "@/lib/access"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const role = (session.user as { role: string }).role

  const obraIds = await getObraIdsPermitidos(userId, role)
  const obraFilter = buildObraFilter(obraIds)

  const obras = await prisma.obra.findMany({
    where: { estado: "VIGENTE", ...obraFilter },
    orderBy: { nombre: "asc" },
  })

  return Response.json(obras)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const { nombre, centroCosto } = body

  if (!nombre) return Response.json({ error: "El nombre es requerido" }, { status: 400 })

  const obra = await prisma.obra.create({
    data: {
      nombre,
      ...(centroCosto !== undefined && { centroCosto }),
    },
  })

  return Response.json(obra, { status: 201 })
}
