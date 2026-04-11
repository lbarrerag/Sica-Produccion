import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const contratistaId = searchParams.get("contratistaId")

  const trabajadores = await prisma.trabajador.findMany({
    where: {
      estado: "VIGENTE",
      ...(contratistaId && { contratistaId: Number(contratistaId) }),
    },
    orderBy: { nombre: "asc" },
    include: {
      contratista: true,
    },
  })

  return Response.json(trabajadores)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()

  const trabajador = await prisma.trabajador.create({
    data: body,
  })

  return Response.json(trabajador, { status: 201 })
}
