import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const contratistas = await prisma.contratista.findMany({
    where: { estado: "VIGENTE" },
    orderBy: { nombre: "asc" },
  })

  return Response.json(contratistas)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR") return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()

  const contratista = await prisma.contratista.create({
    data: body,
  })

  return Response.json(contratista, { status: 201 })
}
