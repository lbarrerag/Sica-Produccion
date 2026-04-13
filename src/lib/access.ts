import { prisma } from "@/lib/db"

/**
 * Roles que tienen acceso irrestricto a todas las obras.
 * No necesitan asignación de obras.
 */
export const ROLES_ACCESO_TOTAL = ["ADMINISTRADOR", "SUPERVISOR_CENTRAL"]

/**
 * Roles que necesitan tener obras asignadas para ver datos.
 * Si no tienen obras asignadas, no verán nada.
 */
export const ROLES_FILTRADO_POR_OBRA = ["SUPERVISOR", "REGISTRO_MARCA"]

/**
 * Devuelve los obraIds a los que el usuario tiene acceso:
 * - null → acceso total (ADMINISTRADOR, SUPERVISOR_CENTRAL)
 * - number[] → solo esas obras (SUPERVISOR, REGISTRO_MARCA)
 */
export async function getObraIdsPermitidos(
  userId: string,
  role: string
): Promise<number[] | null> {
  if (ROLES_ACCESO_TOTAL.includes(role)) return null

  const userObras = await prisma.userObra.findMany({
    where: { userId },
    select: { obraId: true },
  })

  return userObras.map((uo) => uo.obraId)
}

/**
 * Construye el filtro Prisma de obras para un usuario.
 * Retorna `{}` si tiene acceso total, o `{ id: { in: [...] } }` para filtrado.
 * Si el array está vacío devuelve `{ id: { in: [] } }` (sin resultados).
 */
export function buildObraFilter(obraIds: number[] | null) {
  if (obraIds === null) return {}
  return { id: { in: obraIds } }
}

/**
 * Construye el filtro para registroAcceso por obraId.
 * Retorna `{}` si tiene acceso total, o `{ obraId: { in: [...] } }`.
 */
export function buildRegistroObraFilter(obraIds: number[] | null) {
  if (obraIds === null) return {}
  return { obraId: { in: obraIds } }
}
