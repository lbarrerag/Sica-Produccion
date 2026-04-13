import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * GET /api/v1/obras
 * Lista las obras disponibles para esta API key.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *
 * Respuesta 200:
 *   [{ "id", "nombre", "centroCosto" }]
 */
export async function GET(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const obras = await prisma.obra.findMany({
    where: {
      estado: "VIGENTE",
      ...(apiUser.obraIds.length > 0 && { id: { in: apiUser.obraIds } }),
    },
    select: { id: true, nombre: true, centroCosto: true },
    orderBy: { nombre: "asc" },
  })

  return Response.json(obras)
}
