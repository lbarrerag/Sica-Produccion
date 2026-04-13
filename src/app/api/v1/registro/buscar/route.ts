import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * GET /api/v1/registro/buscar?rut=<rut>&obraId=<id>
 * Busca un trabajador y retorna su último registro de acceso.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *
 * Query params:
 *   rut     (requerido) — RUT del trabajador, ej: 12345678-9
 *   obraId  (opcional) — ID de obra para contextualizar el último registro
 *
 * Respuesta 200:
 *   {
 *     "id", "nombre", "identificador", "nombreContratista",
 *     "especialidad",
 *     "ultimoRegistro": { "tipo", "fechaHora" } | null,
 *     "accionSugerida": "ENTRADA" | "SALIDA"
 *   }
 */
export async function GET(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rut = searchParams.get("rut")
  const obraId = searchParams.get("obraId")

  if (!rut) {
    return Response.json({ error: "El parámetro rut es requerido" }, { status: 400 })
  }

  // Verificar acceso a la obra si se especifica
  if (obraId && apiUser.obraIds.length > 0 && !apiUser.obraIds.includes(Number(obraId))) {
    return Response.json({ error: "Sin acceso a esta obra" }, { status: 403 })
  }

  const trabajador = await prisma.trabajador.findFirst({
    where: { identificador: rut, estado: "VIGENTE" },
    include: { contratista: true },
  })

  if (!trabajador) {
    return Response.json(
      { error: "Trabajador no encontrado o no vigente" },
      { status: 404 }
    )
  }

  const ultimoRegistro = await prisma.registroAcceso.findFirst({
    where: {
      trabajadorId: trabajador.id,
      ...(obraId && { obraId: Number(obraId) }),
    },
    orderBy: { fechaHora: "desc" },
  })

  const accionSugerida: "ENTRADA" | "SALIDA" =
    ultimoRegistro?.tipo === "ENTRADA" ? "SALIDA" : "ENTRADA"

  return Response.json({
    id: trabajador.id,
    nombre: trabajador.nombre,
    identificador: trabajador.identificador,
    nombreContratista: trabajador.contratista?.nombre ?? null,
    especialidad: trabajador.especialidad ?? null,
    ultimoRegistro: ultimoRegistro
      ? {
          tipo: ultimoRegistro.tipo,
          fechaHora: ultimoRegistro.fechaHora.toISOString(),
        }
      : null,
    accionSugerida,
  })
}
