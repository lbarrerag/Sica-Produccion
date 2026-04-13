import { requireRole, hasRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { formatFechaSolo } from "@/lib/utils"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ImportarExcel } from "@/components/ui/ImportarExcel"
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton"
import { Paginacion } from "@/components/ui/Paginacion"
import { revalidatePath } from "next/cache"

const POR_PAGINA = 20
const DIAS_INACTIVIDAD = 60

interface Props {
  searchParams: Promise<{ pagina?: string; q?: string; tab?: string }>
}

export default async function ObrasPage({ searchParams }: Props) {
  const user = await requireRole("ADMINISTRADOR", "SUPERVISOR_CENTRAL", "SUPERVISOR")
  const esAdmin = hasRole(user, "ADMINISTRADOR")

  const { pagina, q, tab } = await searchParams
  const paginaActual = Math.max(1, parseInt(pagina ?? "1", 10) || 1)
  const busqueda = q?.trim() ?? ""
  const tabActual = tab === "inactivas" ? "inactivas" : "activas"

  const estadosFiltro =
    tabActual === "activas" ? ["VIGENTE"] : ["INACTIVO"]

  const where = {
    estado: { in: estadosFiltro as ("VIGENTE" | "INACTIVO")[] },
    ...(busqueda
      ? { nombre: { contains: busqueda, mode: "insensitive" as const } }
      : {}),
  }

  // Fecha límite de inactividad
  const limiteInactividad = new Date(Date.now() - DIAS_INACTIVIDAD * 24 * 60 * 60 * 1000)

  const [totalActivas, totalInactivas, obras] = await Promise.all([
    prisma.obra.count({ where: { estado: { in: ["VIGENTE"] } } }),
    prisma.obra.count({ where: { estado: { in: ["INACTIVO"] } } }),
    prisma.obra.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (paginaActual - 1) * POR_PAGINA,
      take: POR_PAGINA,
      select: { id: true, nombre: true, centroCosto: true, estado: true, fechaInsert: true },
    }),
  ])

  // Una sola query agrupada para la última actividad de todas las obras de la página
  // (evita N subqueries — una por obra — sobre registro_acceso)
  const obraIds = obras.map((o) => o.id)
  const ultimasActividades = obraIds.length > 0
    ? await prisma.registroAcceso.groupBy({
        by: ["obraId"],
        where: { obraId: { in: obraIds } },
        _max: { fechaHora: true },
      })
    : []

  const ultimaActividadMap = new Map(
    ultimasActividades.map((r) => [r.obraId, r._max.fechaHora])
  )

  const totalPaginas = Math.ceil(
    (tabActual === "activas" ? totalActivas : totalInactivas) / POR_PAGINA
  )

  const extraParams = [
    `tab=${tabActual}`,
    busqueda ? `q=${encodeURIComponent(busqueda)}` : "",
  ].filter(Boolean).join("&")

  // ── Server actions ──────────────────────────────────────────────────────────
  async function desactivarObra(obraId: number) {
    "use server"
    const { prisma: db } = await import("@/lib/db")
    await db.obra.update({ where: { id: obraId }, data: { estado: "INACTIVO" } })
    revalidatePath("/obras")
  }

  async function reactivarObra(obraId: number) {
    "use server"
    const { prisma: db } = await import("@/lib/db")
    await db.obra.update({ where: { id: obraId }, data: { estado: "VIGENTE" } })
    revalidatePath("/obras")
  }

  async function eliminarObra(obraId: number, nombre: string) {
    "use server"
    const { prisma: db } = await import("@/lib/db")
    await db.obra.update({ where: { id: obraId }, data: { estado: "ELIMINADO" } })
    revalidatePath("/obras")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Obras</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de obras del sistema</p>
        </div>
        {esAdmin && (
          <div className="flex items-center gap-2">
            <ImportarExcel endpoint="/api/import/obras" label="Importar Excel" />
            <Button asChild>
              <Link href="/obras/new">+ Nueva Obra</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Activas / Inactivas */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <Link
          href={`/obras?tab=activas${busqueda ? `&q=${encodeURIComponent(busqueda)}` : ""}`}
          className={[
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tabActual === "activas"
              ? "border-[#0e7f6d] text-[#0e7f6d]"
              : "border-transparent text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          Activas
          <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {totalActivas}
          </span>
        </Link>
        <Link
          href={`/obras?tab=inactivas${busqueda ? `&q=${encodeURIComponent(busqueda)}` : ""}`}
          className={[
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tabActual === "inactivas"
              ? "border-[#0e7f6d] text-[#0e7f6d]"
              : "border-transparent text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          Inactivas
          <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {totalInactivas}
          </span>
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="GET" className="flex gap-2">
        <input type="hidden" name="tab" value={tabActual} />
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre…"
          className="h-9 flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
        />
        <Button type="submit" variant="outline" size="sm">Buscar</Button>
        {busqueda && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/obras?tab=${tabActual}`}>Limpiar</Link>
          </Button>
        )}
      </form>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {obras.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {busqueda ? `Sin resultados para "${busqueda}".` : `No hay obras ${tabActual}.`}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Centro Costo</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras.map((obra) => {
                  const ultimaActividad = ultimaActividadMap.get(obra.id) ?? null
                  const sinActividad60 =
                    !ultimaActividad || ultimaActividad < limiteInactividad

                  return (
                    <TableRow key={obra.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{obra.nombre}</span>
                          {tabActual === "activas" && sinActividad60 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Sin actividad {DIAS_INACTIVIDAD}+ días
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {obra.centroCosto ?? "—"}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {ultimaActividad
                          ? formatFechaSolo(ultimaActividad)
                          : <span className="text-gray-400 italic">Sin registros</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/obras/${obra.id}`}>Ver</Link>
                          </Button>
                          {esAdmin && (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/obras/${obra.id}/edit`}>Editar</Link>
                              </Button>

                              {tabActual === "activas" ? (
                                <ConfirmDeleteButton
                                  action={desactivarObra.bind(null, obra.id)}
                                  mensaje={`¿Desactivar la obra "${obra.nombre}"? Quedará oculta en el registro de acceso.`}
                                  className="inline-flex h-8 items-center rounded-md border border-amber-200 bg-white px-3 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                                  label="Desactivar"
                                />
                              ) : (
                                <ConfirmDeleteButton
                                  action={reactivarObra.bind(null, obra.id)}
                                  mensaje={`¿Reactivar la obra "${obra.nombre}"?`}
                                  className="inline-flex h-8 items-center rounded-md border border-green-200 bg-white px-3 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                                  label="Reactivar"
                                />
                              )}

                              <ConfirmDeleteButton
                                action={eliminarObra.bind(null, obra.id, obra.nombre)}
                                mensaje={`¿Está seguro de eliminar la obra "${obra.nombre}"? Esta acción no se puede deshacer.`}
                              />
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Paginacion
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              total={tabActual === "activas" ? totalActivas : totalInactivas}
              por_pagina={POR_PAGINA}
              basePath="/obras"
              extraParams={extraParams}
            />
          </>
        )}
      </div>
    </div>
  )
}
