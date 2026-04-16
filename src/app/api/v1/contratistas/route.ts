import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * GET /api/v1/contratistas
 * Lista todos los contratistas del sistema.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *
 * Query params:
 *   estado  "VIGENTE"  opcional  Filtrar por estado (por defecto todos)
 *   rut     string     opcional  Buscar por RUT (parcial)
 *   nombre  string     opcional  Buscar por nombre (parcial)
 */
export async function GET(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const estadoParam = searchParams.get("estado")
  const rutParam    = searchParams.get("rut")
  const nombreParam = searchParams.get("nombre")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (estadoParam) where.estado = estadoParam
  if (rutParam)    where.identificador = { contains: rutParam.replace(/[.\-]/g, ""), mode: "insensitive" }
  if (nombreParam) where.nombre        = { contains: nombreParam, mode: "insensitive" }

  const contratistas = await prisma.contratista.findMany({
    where,
    select: {
      id:            true,
      identificador: true,
      nombre:        true,
      estado:        true,
      especialidad:  true,
      ciudad:        true,
      telefono:      true,
      email:         true,
      nombreContador:true,
    },
    orderBy: { nombre: "asc" },
  })

  return Response.json({ total: contratistas.length, contratistas })
}

/**
 * POST /api/v1/contratistas
 * Crea un contratista nuevo o actualiza sus datos si ya existe ese RUT.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     "rut": "76543210-1",          // requerido — identificador único
 *     "nombre": "Constructora XYZ", // requerido
 *     "direccion": "Av. Central 100", // opcional
 *     "email": "admin@xyz.cl",      // opcional
 *     "telefono": "+56222334455",   // opcional
 *     "ciudad": "Santiago",         // opcional
 *     "especialidad": "Construcción", // opcional
 *     "nombreContador": "Pedro Soto"  // opcional
 *   }
 */
export async function POST(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Body JSON inválido" }, { status: 400 })

  const { rut, nombre, direccion, email, telefono, ciudad, especialidad, nombreContador } = body as {
    rut: string
    nombre: string
    direccion?: string
    email?: string
    telefono?: string
    ciudad?: string
    especialidad?: string
    nombreContador?: string
  }

  if (!rut || !nombre) {
    return Response.json({ error: "Se requieren los campos: rut, nombre" }, { status: 400 })
  }

  // Upsert: crea o actualiza si ya existe
  const contratista = await prisma.contratista.upsert({
    where: { identificador: rut },
    update: {
      nombre,
      estado: "VIGENTE",
      ...(direccion !== undefined && { direccion }),
      ...(email !== undefined && { email }),
      ...(telefono !== undefined && { telefono }),
      ...(ciudad !== undefined && { ciudad }),
      ...(especialidad !== undefined && { especialidad }),
      ...(nombreContador !== undefined && { nombreContador }),
    },
    create: {
      identificador: rut,
      nombre,
      estado: "VIGENTE",
      direccion,
      email,
      telefono,
      ciudad,
      especialidad,
      nombreContador,
    },
    select: {
      id: true,
      identificador: true,
      nombre: true,
      estado: true,
      ciudad: true,
      especialidad: true,
    },
  })

  return Response.json({ success: true, contratista }, { status: 201 })
}
