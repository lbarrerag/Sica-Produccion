import { prisma } from "@/lib/db"

export type ApiUser = {
  id: string
  userName: string
  role: string
  obraIds: number[]
}

/**
 * Valida el token Bearer del header Authorization.
 * Formato esperado: Authorization: Bearer <apiKey>
 * Retorna el usuario API si es válido y activo, o null si no.
 */
export async function validateApiKey(request: Request): Promise<ApiUser | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  const user = await prisma.user.findFirst({
    where: {
      apiKey: token,
      role: "API",
      estado: "VIGENTE",
    },
    include: {
      userObras: { select: { obraId: true } },
    },
  })

  if (!user) return null

  return {
    id: user.id,
    userName: user.userName,
    role: user.role,
    obraIds: user.userObras.map((uo) => uo.obraId),
  }
}
