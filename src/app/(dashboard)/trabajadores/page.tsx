import { requireRole, hasRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { formatRUT } from "@/lib/rut"
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

const POR_PAGINA = 20

interface Props {
  searchParams: Promise<{ contratistaId?: string; pagina?: string; q?: string }>
}

export default async function TrabajadoresPage({ searchParams }: Props) {
  const user = await requireRole("ADMINISTRADOR", "SUPERVISOR")
  const esAdmin = hasRole(user, "ADMINISTRADOR")

  const { contratistaId, pagina, q } = await searchParams
  const paginaActual = Math.max(1, parseInt(pagina ?? "1", 10) || 1)
  const contratistaIdNum = contratistaId ? parseInt(contratistaId, 10) : undefined
  const busqueda = q?.trim() ?? ""

  const where = {
    estado: "VIGENTE" as const,
    ...(contratistaIdNum && !isNaN(contratistaIdNum)
      ? { contratistaId: contratistaIdNum }
      : {}),
    ...(busqueda
      ? {
          OR: [
            { nombre: { contains: busqueda, mode: "insensitive" as const } },
            { identificador: { contains: busqueda, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [total, trabajadores, contratistas] = await Promise.all([
    prisma.trabajador.count({ where }),
    prisma.trabajador.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (paginaActual - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        contratista: { select: { id: true, nombre: true } },
      },
    }),
    prisma.contratista.findMany({
      where: { estado: "VIGENTE" },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  // Parámetros extra para la paginación (preservar filtros)
  const extraParams = [
    contratistaId ? `contratistaId=${contratistaId}` : "",
    busqueda ? `q=${encodeURIComponent(busqueda)}` : "",
  ]
    .filter(Boolean)
    .join("&")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trabajadores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de trabajadores del sistema
          </p>
        </div>
        {esAdmin && (
          <div className="flex items-center gap-2">
            <ImportarExcel endpoint="/api/import/trabajadores" label="Importar Excel" />
            <Button asChild>
              <Link href="/trabajadores/new">+ Nuevo Trabajador</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda por nombre/RUT */}
        <form method="GET" className="flex items-center gap-2">
          {contratistaId && (
            <input type="hidden" name="contratistaId" value={contratistaId} />
          )}
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre o RUT…"
            className="h-9 w-56 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
          />
          <Button type="submit" variant="outline" size="sm">Buscar</Button>
        </form>

        {/* Filtro por contratista */}
        <form method="GET" className="flex items-center gap-2">
          {busqueda && <input type="hidden" name="q" value={busqueda} />}
          <select
            name="contratistaId"
            defaultValue={contratistaId ?? ""}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
          >
            <option value="">Todos los contratistas</option>
            {contratistas.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        </form>

        {(contratistaId || busqueda) && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/trabajadores">Limpiar filtros</Link>
          </Button>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {trabajadores.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {busqueda || contratistaId
              ? "Sin resultados para los filtros aplicados."
              : "No hay trabajadores registrados."}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-400">ID Ext.</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contratista</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trabajadores.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-gray-400">{t.idExterno ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatRUT(t.identificador)}
                    </TableCell>
                    <TableCell className="font-medium">{t.nombre}</TableCell>
                    <TableCell className="text-gray-500">
                      {t.contratista?.nombre ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {t.especialidad ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/trabajadores/${t.id}`}>Ver</Link>
                        </Button>
                        {esAdmin && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/trabajadores/${t.id}/edit`}>
                                Editar
                              </Link>
                            </Button>
                            <ConfirmDeleteButton
                              action={async () => {
                                "use server"
                                const { prisma: db } = await import("@/lib/db")
                                await db.trabajador.update({
                                  where: { id: t.id },
                                  data: { estado: "ELIMINADO" },
                                })
                                const { revalidatePath } = await import("next/cache")
                                revalidatePath("/trabajadores")
                              }}
                              mensaje={`¿Está seguro de eliminar al trabajador "${t.nombre}"?`}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Paginacion
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              total={total}
              por_pagina={POR_PAGINA}
              basePath="/trabajadores"
              extraParams={extraParams}
            />
          </>
        )}
      </div>
    </div>
  )
}
