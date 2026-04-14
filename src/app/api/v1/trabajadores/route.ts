import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * POST /api/v1/trabajadores
 * Crea un trabajador nuevo o lo reactiva si ya existe con ese RUT.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *   Content-Type: application/json
 *
 * Body:
 *   {
 *     "rut": "12345678-9",          // requerido
 *     "nombre": "Juan Pérez",       // requerido
 *     "contratistaRut": "76543210-1", // opcional — RUT del contratista
 *     "especialidad": "Electricista", // opcional
 *     "direccion": "Calle 123",     // opcional
 *     "ciudad": "Santiago",         // opcional
 *     "telefono": "+56912345678",   // opcional
 *     "idExterno": 1001             // opcional — ID en sistema externo
 *   }
 */
export async function POST(request: Request) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Body JSON inválido" }, { status: 400 })

  const { rut, nombre, contratistaRut, especialidad, direccion, ciudad, telefono, idExterno } = body as {
    rut: string
    nombre: string
    contratistaRut?: string
    especialidad?: string
    direccion?: string
    ciudad?: string
    telefono?: string
    idExterno?: number
  }

  if (!rut || !nombre) {
    return Response.json({ error: "Se requieren los campos: rut, nombre" }, { status: 400 })
  }

  // Resolver contratista si se proporcionó
  let contratistaId: number | undefined
  let identificadorContratista: string | undefined
  let nombreContratista: string | undefined

  if (contratistaRut) {
    const contratista = await prisma.contratista.findUnique({
      where: { identificador: contratistaRut },
      select: { id: true, nombre: true, identificador: true },
    })
    if (!contratista) {
      return Response.json(
        { error: `Contratista con RUT ${contratistaRut} no encontrado` },
        { status: 404 }
      )
    }
    contratistaId = contratista.id
    identificadorContratista = contratista.identificador
    nombreContratista = contratista.nombre
  }

  // Upsert: crea o reactiva si ya existe
  const trabajador = await prisma.trabajador.upsert({
    where: { identificador: rut },
    update: {
      nombre,
      estado: "VIGENTE",
      ...(contratistaId !== undefined && { contratistaId, identificadorContratista, nombreContratista }),
      ...(especialidad !== undefined && { especialidad }),
      ...(direccion !== undefined && { direccion }),
      ...(ciudad !== undefined && { ciudad }),
      ...(telefono !== undefined && { telefono }),
      ...(idExterno !== undefined && { idExterno }),
    },
    create: {
      identificador: rut,
      nombre,
      estado: "VIGENTE",
      contratistaId,
      identificadorContratista,
      nombreContratista,
      especialidad,
      direccion,
      ciudad,
      telefono,
      idExterno,
    },
    select: {
      id: true,
      identificador: true,
      nombre: true,
      estado: true,
      especialidad: true,
      contratistaId: true,
      nombreContratista: true,
    },
  })

  return Response.json({ success: true, trabajador }, { status: 201 })
}
