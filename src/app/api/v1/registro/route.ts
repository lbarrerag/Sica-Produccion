import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * POST /api/v1/registro
 * Registra una entrada o salida de un trabajador.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *   Content-Type: application/json
 *
 * Body:
 *   { "rut": "12345678-9", "obraId": 1, "tipo": "ENTRADA" | "SALIDA" }
 *
 * Respuesta 201:
 *   { "success": true, "registro": { "id", "tipo", "fechaHora", "trabajador": { "nombre" } } }
 */
export async function POST(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Body JSON inválido" }, { status: 400 })

  const { rut, obraId, tipo, fechaHora } = body as {
    rut: string
    obraId: number
    tipo: string
    fechaHora?: string
  }

  if (!rut || !obraId || !tipo) {
    return Response.json(
      { error: "Se requieren los campos: rut, obraId, tipo" },
      { status: 400 }
    )
  }

  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return Response.json(
      { error: "El campo tipo debe ser ENTRADA o SALIDA" },
      { status: 400 }
    )
  }

  let fechaRegistro: Date
  if (fechaHora) {
    fechaRegistro = new Date(fechaHora)
    if (isNaN(fechaRegistro.getTime())) {
      return Response.json(
        { error: "El campo fechaHora no es una fecha válida (usa ISO 8601, ej: 2026-04-13T09:15:00)" },
        { status: 400 }
      )
    }
  } else {
    fechaRegistro = new Date()
  }

  // Verificar acceso a la obra
  if (apiUser.obraIds.length > 0 && !apiUser.obraIds.includes(Number(obraId))) {
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

  const registro = await prisma.registroAcceso.create({
    data: {
      trabajadorId: trabajador.id,
      obraId: Number(obraId),
      identificador: trabajador.identificador,
      tipo: tipo as "ENTRADA" | "SALIDA",
      fechaHora: fechaRegistro,
      contratistaId: trabajador.contratistaId ?? undefined,
      identificadorContratista: trabajador.identificadorContratista ?? undefined,
    },
    include: {
      trabajador: { select: { nombre: true } },
    },
  })

  return Response.json(
    {
      success: true,
      registro: {
        id: registro.id,
        tipo: registro.tipo,
        fechaHora: registro.fechaHora,
        trabajador: registro.trabajador,
      },
    },
    { status: 201 }
  )
}
