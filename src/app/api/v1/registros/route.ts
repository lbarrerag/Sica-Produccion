import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"
import { chileInicioDelDia, chileFinDelDia, fechaEnChile } from "@/lib/chile-time"

/**
 * GET /api/v1/registros
 * Consulta registros de acceso en un rango de fechas.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *
 * Query params:
 *   fechaDesde  string YYYY-MM-DD  requerido  Fecha de inicio (inclusive), hora Chile
 *   fechaHasta  string YYYY-MM-DD  requerido  Fecha de fin    (inclusive), hora Chile
 *   obraId      number             opcional   Filtrar por obra
 *   rut         string             opcional   Filtrar por RUT del trabajador
 *   idExterno   number             opcional   Filtrar por ID externo del trabajador
 *
 * El rango máximo permitido es 31 días para evitar respuestas excesivamente grandes.
 *
 * Respuesta 200:
 *   {
 *     "total": 42,
 *     "registros": [
 *       {
 *         "fechaRegistro": "2026-04-13",
 *         "identificador": "12345678-9",
 *         "nombre": "Juan Pérez González",
 *         "especialidad": "Electricista",
 *         "obra": "Edificio Central",
 *         "centroCosto": "CC-001",
 *         "contratista": "Constructora XYZ",
 *         "fechaIngreso": "2026-04-13T09:15:00.000Z",
 *         "fechaSalida": "2026-04-13T18:30:00.000Z"
 *       }
 *     ]
 *   }
 */
export async function GET(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fechaDesde  = searchParams.get("fechaDesde")
  const fechaHasta  = searchParams.get("fechaHasta")
  const obraIdParam = searchParams.get("obraId")
  const rutParam    = searchParams.get("rut")
  const idExternoParam = searchParams.get("idExterno")

  // Ambas fechas son requeridas
  if (!fechaDesde || !fechaHasta) {
    return Response.json(
      { error: "Se requieren los parámetros: fechaDesde y fechaHasta (formato YYYY-MM-DD)" },
      { status: 400 }
    )
  }

  // Validar formato de fechas
  const reDate = /^\d{4}-\d{2}-\d{2}$/
  if (!reDate.test(fechaDesde) || !reDate.test(fechaHasta)) {
    return Response.json(
      { error: "fechaDesde y fechaHasta deben estar en formato YYYY-MM-DD" },
      { status: 400 }
    )
  }

  const gte = chileInicioDelDia(fechaDesde)
  const lte = chileFinDelDia(fechaHasta)

  if (gte > lte) {
    return Response.json(
      { error: "fechaDesde no puede ser posterior a fechaHasta" },
      { status: 400 }
    )
  }

  // Máximo 31 días por consulta
  const diffDias = Math.round((lte.getTime() - gte.getTime()) / (86_400_000))
  if (diffDias > 31) {
    return Response.json(
      { error: "El rango máximo permitido es 31 días" },
      { status: 400 }
    )
  }

  // Construir filtro de obra respetando permisos de la API key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { fechaHora: { gte, lte } }

  if (obraIdParam) {
    const obraIdNum = Number(obraIdParam)
    if (apiUser.obraIds.length > 0 && !apiUser.obraIds.includes(obraIdNum)) {
      return Response.json({ error: "Sin acceso a esta obra" }, { status: 403 })
    }
    where.obraId = obraIdNum
  } else if (apiUser.obraIds.length > 0) {
    where.obraId = { in: apiUser.obraIds }
  }

  // Filtrar por trabajador (rut o idExterno)
  if (rutParam) {
    const rutLimpio = rutParam.replace(/[.\-]/g, "")
    where.identificador = { contains: rutLimpio, mode: "insensitive" }
  } else if (idExternoParam) {
    const trabajador = await prisma.trabajador.findFirst({
      where: { idExterno: Number(idExternoParam) },
      select: { identificador: true },
    })
    if (!trabajador) {
      return Response.json({ error: "Trabajador con ese idExterno no encontrado" }, { status: 404 })
    }
    where.identificador = trabajador.identificador
  }

  const raw = await prisma.registroAcceso.findMany({
    where,
    include: {
      trabajador: { select: { nombre: true, especialidad: true, idExterno: true } },
      obra:       { select: { nombre: true, centroCosto: true } },
      contratista:{ select: { nombre: true } },
    },
    orderBy: { fechaHora: "asc" },
  })

  // Agrupar por (identificador, obraId, día-Chile) → una fila con ingreso y salida
  type Fila = {
    fechaRegistro: string
    identificador: string
    idExterno: number | null
    nombre: string
    especialidad: string | null
    obra: string
    centroCosto: string | null
    contratista: string | null
    fechaIngreso: string | null
    fechaSalida: string | null
  }

  const mapa = new Map<string, Fila>()

  for (const r of raw) {
    const dia   = fechaEnChile(r.fechaHora)
    const clave = `${r.identificador}||${r.obraId}||${dia}`

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        fechaRegistro: dia,
        identificador: r.identificador,
        idExterno:     r.trabajador.idExterno ?? null,
        nombre:        r.trabajador.nombre,
        especialidad:  r.trabajador.especialidad ?? null,
        obra:          r.obra.nombre,
        centroCosto:   r.obra.centroCosto ?? null,
        contratista:   r.contratista?.nombre ?? null,
        fechaIngreso:  null,
        fechaSalida:   null,
      })
    }

    const fila = mapa.get(clave)!
    if (r.tipo === "ENTRADA") {
      if (!fila.fechaIngreso) fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  const registros = Array.from(mapa.values()).sort((a, b) => {
    const dif = b.fechaRegistro.localeCompare(a.fechaRegistro)
    return dif !== 0 ? dif : a.nombre.localeCompare(b.nombre)
  })

  return Response.json({ total: registros.length, registros })
}
