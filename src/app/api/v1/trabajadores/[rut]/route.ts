import { prisma } from "@/lib/db"
import { validateApiKey } from "@/lib/api-auth"

/**
 * PUT /api/v1/trabajadores/:rut
 * Actualiza los datos de un trabajador existente.
 * Solo se actualizan los campos enviados en el body.
 *
 * Headers:
 *   Authorization: Bearer <apiKey>
 *   Content-Type: application/json
 *
 * Body (todos opcionales):
 *   {
 *     "nombre": "Juan Pérez González",
 *     "estado": "VIGENTE" | "NO_VIGENTE",
 *     "contratistaRut": "76543210-1",
 *     "especialidad": "Gasfiter",
 *     "direccion": "Av. Principal 456",
 *     "ciudad": "Valparaíso",
 *     "telefono": "+56987654321",
 *     "idExterno": 1002
 *   }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ rut: string }> }
) {
  const apiUser = await validateApiKey(request)
  if (!apiUser) {
    return Response.json({ error: "API key inválida o inactiva" }, { status: 401 })
  }

  const { rut } = await params

  const trabajador = await prisma.trabajador.findUnique({
    where: { identificador: rut },
    select: { id: true },
  })
  if (!trabajador) {
    return Response.json({ error: "Trabajador no encontrado" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ error: "Body JSON inválido" }, { status: 400 })

  const { nombre, estado, contratistaRut, especialidad, direccion, ciudad, telefono, idExterno } = body as {
    nombre?: string
    estado?: string
    contratistaRut?: string
    especialidad?: string
    direccion?: string
    ciudad?: string
    telefono?: string
    idExterno?: number
  }

  if (estado && estado !== "VIGENTE" && estado !== "NO_VIGENTE") {
    return Response.json(
      { error: 'El campo estado debe ser "VIGENTE" o "NO_VIGENTE"' },
      { status: 400 }
    )
  }

  // Resolver contratista si se proporcionó
  let contratistaFields: {
    contratista: { connect: { id: number } }
    identificadorContratista: string
    nombreContratista: string
  } | undefined

  if (contratistaRut !== undefined) {
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
    contratistaFields = {
      contratista: { connect: { id: contratista.id } },
      identificadorContratista: contratista.identificador,
      nombreContratista: contratista.nombre,
    }
  }

  const actualizado = await prisma.trabajador.update({
    where: { identificador: rut },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(estado !== undefined && { estado: estado as "VIGENTE" | "NO_VIGENTE" }),
      ...(contratistaFields !== undefined && contratistaFields),
      ...(especialidad !== undefined && { especialidad }),
      ...(direccion !== undefined && { direccion }),
      ...(ciudad !== undefined && { ciudad }),
      ...(telefono !== undefined && { telefono }),
      ...(idExterno !== undefined && { idExterno }),
    },
    select: {
      id: true,
      identificador: true,
      nombre: true,
      estado: true,
      especialidad: true,
      contratistaId: true,
      nombreContratista: true,
      ciudad: true,
    },
  })

  return Response.json({ success: true, trabajador: actualizado })
}
