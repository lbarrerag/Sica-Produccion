import { requireRole } from "@/lib/auth-utils"
import { hasRole } from "@/lib/auth-utils"
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

const POR_PAGINA = 20

interface Props {
  searchParams: Promise<{ pagina?: string; q?: string }>
}

export default async function ObrasPage({ searchParams }: Props) {
  const user = await requireRole("ADMINISTRADOR", "SUPERVISOR")
  const esAdmin = hasRole(user, "ADMINISTRADOR")

  const { pagina, q } = await searchParams
  const paginaActual = Math.max(1, parseInt(pagina ?? "1", 10) || 1)
  const busqueda = q?.trim() ?? ""

  const where = {
    estado: "VIGENTE" as const,
    ...(busqueda
      ? { nombre: { contains: busqueda, mode: "insensitive" as const } }
      : {}),
  }

  const [total, obras] = await Promise.all([
    prisma.obra.count({ where }),
    prisma.obra.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (paginaActual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Obras</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de obras del sistema
          </p>
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

      {/* Búsqueda */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre…"
          className="h-9 flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
        />
        <Button type="submit" variant="outline" size="sm">Buscar</Button>
        {busqueda && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/obras">Limpiar</Link>
          </Button>
        )}
      </form>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {obras.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {busqueda ? `Sin resultados para "${busqueda}".` : "No hay obras registradas."}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Centro Costo</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras.map((obra) => (
                  <TableRow key={obra.id}>
                    <TableCell className="font-medium">{obra.nombre}</TableCell>
                    <TableCell className="text-gray-500">
                      {obra.centroCosto ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatFechaSolo(obra.fechaInsert)}
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
                            <ConfirmDeleteButton
                              action={async () => {
                                "use server"
                                const { prisma: db } = await import("@/lib/db")
                                await db.obra.update({
                                  where: { id: obra.id },
                                  data: { estado: "ELIMINADO" },
                                })
                                const { revalidatePath } = await import("next/cache")
                                revalidatePath("/obras")
                              }}
                              mensaje={`¿Está seguro de eliminar la obra "${obra.nombre}"?`}
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
              basePath="/obras"
              extraParams={busqueda ? `q=${encodeURIComponent(busqueda)}` : ""}
            />
          </>
        )}
      </div>
    </div>
  )
}
