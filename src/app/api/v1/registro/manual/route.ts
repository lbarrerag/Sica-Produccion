import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"
import { fechaEnChile, chileInicioDelDia } from "@/lib/chile-time"

/**
 * POST /api/v1/registro/manual
 * Registra una entrada o salida con fecha y hora específica.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *   Content-Type: application/json
 *
 * Body:
 *   { "rut": "12345678-9", "obraId": 1, "tipo": "ENTRADA" | "SALIDA", "fechaHora": "2026-04-13T09:15:00" }
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
    fechaHora: string
  }

  if (!rut || !obraId || !tipo || !fechaHora) {
    return Response.json(
      { error: "Se requieren los campos: rut, obraId, tipo, fechaHora" },
      { status: 400 }
    )
  }

  if (tipo !== "ENTRADA" && tipo !== "SALIDA") {
    return Response.json(
      { error: "El campo tipo debe ser ENTRADA o SALIDA" },
      { status: 400 }
    )
  }

  const fechaRegistro = new Date(fechaHora)
  if (isNaN(fechaRegistro.getTime())) {
    return Response.json(
      { error: "fechaHora no es una fecha válida. Usa formato ISO 8601, ej: 2026-04-13T09:15:00" },
      { status: 400 }
    )
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

  // Bloquear doble ENTRADA o doble SALIDA consecutiva en la misma obra
  // Se evalúa solo dentro del día Chile de la fechaHora enviada
  const diaFecha = fechaEnChile(fechaRegistro)
  const ultimoRegistro = await prisma.registroAcceso.findFirst({
    where: {
      trabajadorId: trabajador.id,
      obraId: Number(obraId),
      fechaHora: {
        gte: chileInicioDelDia(diaFecha),
        lt:  new Date(chileInicioDelDia(diaFecha).getTime() + 24 * 3_600_000),
      },
    },
    orderBy: { fechaHora: "desc" },
    select: { tipo: true },
  })

  if (ultimoRegistro?.tipo === tipo) {
    const accion = tipo === "ENTRADA" ? "entrada" : "salida"
    const pendiente = tipo === "ENTRADA" ? "salida" : "entrada"
    return Response.json(
      { error: `El trabajador ya tiene una ${accion} registrada en esta obra. Debe registrar ${pendiente} primero.` },
      { status: 409 }
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
