import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getObraIdsPermitidos, buildRegistroObraFilter } from "@/lib/access"
import { chileInicioDelDia, chileFinDelDia, fechaEnChile } from "@/lib/chile-time"

// Re-exportar para que export/route.ts pueda importar desde aquí
export { chileInicioDelDia, chileFinDelDia }
export const fechaChile = fechaEnChile

function buildWhere(params: URLSearchParams, obraIdsPermitidos: number[] | null) {
  const fechaDesde    = params.get("fechaDesde")
  const fechaHasta    = params.get("fechaHasta")
  const obraId        = params.get("obraId")
  const contratistaId = params.get("contratistaId")
  const trabajador    = params.get("trabajador")?.trim() ?? ""

  // Convertir fechas seleccionadas (hora Chile) a rangos UTC
  const gte = fechaDesde ? chileInicioDelDia(fechaDesde) : undefined
  const lte = fechaHasta ? chileFinDelDia(fechaHasta)   : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (gte || lte) {
    where.fechaHora = {
      ...(gte && { gte }),
      ...(lte && { lte }),
    }
  }

  // Si el usuario pidió filtrar por una obra específica, la usamos (si tiene acceso)
  if (obraId) {
    const obraIdNum = Number(obraId)
    // Si tiene restricción de obras, verificar que la obra solicitada esté en su lista
    if (obraIdsPermitidos === null || obraIdsPermitidos.includes(obraIdNum)) {
      where.obraId = obraIdNum
    } else {
      // Obra no permitida: forzar sin resultados
      where.obraId = -1
    }
  } else {
    // Sin filtro de obra específico: aplicar restricción automática del usuario
    const filtro = buildRegistroObraFilter(obraIdsPermitidos)
    Object.assign(where, filtro)
  }
  if (contratistaId) where.contratistaId = Number(contratistaId)

  // Filtrar por nombre del trabajador O por RUT (identificador)
  if (trabajador) {
    // Normalizar: quitar puntos y guiones para comparar RUT desnudo
    const rutLimpio = trabajador.replace(/[.\-]/g, "")
    where.OR = [
      { trabajador: { nombre: { contains: trabajador, mode: "insensitive" } } },
      { identificador: { contains: rutLimpio,   mode: "insensitive" } },
    ]
  }

  return where
}

// ── Eliminación masiva ───────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  if ((session.user as { role: string }).role !== "ADMINISTRADOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const { count } = await prisma.registroAcceso.deleteMany({ where: buildWhere(searchParams, null) })
  return Response.json({ eliminados: count })
}

// ── Consulta ─────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: "No autorizado" }, { status: 401 })
  const role = (session.user as { role: string }).role
  if (role !== "ADMINISTRADOR" && role !== "SUPERVISOR_CENTRAL" && role !== "SUPERVISOR")
    return Response.json({ error: "Acceso denegado" }, { status: 403 })

  const userId = (session.user as { id: string }).id
  const obraIdsPermitidos = await getObraIdsPermitidos(userId, role)

  const { searchParams } = new URL(request.url)

  const raw = await prisma.registroAcceso.findMany({
    where: buildWhere(searchParams, obraIdsPermitidos),
    include: {
      trabajador: { select: { nombre: true, especialidad: true } },
      obra:       { select: { nombre: true, centroCosto: true } },
      contratista:{ select: { nombre: true } },
    },
    orderBy: { fechaHora: "asc" },
  })

  // ── Agrupar por (identificador, obraId, fecha-día) ───────────────────────
  type Fila = {
    id: number
    fechaRegistro: string
    identificador: string
    nombre: string
    especialidad: string | null
    obra: string
    centroCosto: string | null
    contratista: string | null
    fechaIngreso: string | null
    fechaSalida: string | null
  }

  const mapaFilas = new Map<string, Fila>()

  for (const r of raw) {
    const dia   = fechaChile(r.fechaHora)          // fecha en hora Chile, no UTC
    const clave = `${r.identificador}||${r.obraId}||${dia}`

    if (!mapaFilas.has(clave)) {
      mapaFilas.set(clave, {
        id:           r.id,
        fechaRegistro:r.fechaHora.toISOString().slice(0, 10),
        identificador:r.identificador,
        nombre:       r.trabajador.nombre,
        especialidad: r.trabajador.especialidad ?? null,
        obra:         r.obra.nombre,
        centroCosto:  r.obra.centroCosto ?? null,
        contratista:  r.contratista?.nombre ?? null,
        fechaIngreso: null,
        fechaSalida:  null,
      })
    }

    const fila = mapaFilas.get(clave)!
    if (r.tipo === "ENTRADA") {
      if (!fila.fechaIngreso) fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  const filas = Array.from(mapaFilas.values()).sort((a, b) => {
    const dif = b.fechaRegistro.localeCompare(a.fechaRegistro)
    return dif !== 0 ? dif : a.nombre.localeCompare(b.nombre)
  })

  return Response.json(filas)
}
