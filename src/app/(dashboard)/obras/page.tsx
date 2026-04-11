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

export default async function ObrasPage() {
  const user = await requireRole("ADMINISTRADOR", "SUPERVISOR")
  const esAdmin = hasRole(user, "ADMINISTRADOR")

  const obras = await prisma.obra.findMany({
    where: { estado: "VIGENTE" },
    orderBy: { nombre: "asc" },
  })

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
          <Button asChild>
            <Link href="/obras/new">+ Nueva Obra</Link>
          </Button>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {obras.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay obras registradas.
          </div>
        ) : (
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
                          <DeleteObraButton id={obra.id} nombre={obra.nombre} />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

// Componente inline para el botón de eliminar (requiere client action)
function DeleteObraButton({ id, nombre }: { id: number; nombre: string }) {
  return (
    <form
      action={async () => {
        "use server"
        const { prisma: db } = await import("@/lib/db")
        await db.obra.update({
          where: { id },
          data: { estado: "ELIMINADO" },
        })
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/obras")
      }}
    >
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`¿Está seguro de eliminar la obra "${nombre}"?`)) {
            e.preventDefault()
          }
        }}
        className="inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        Eliminar
      </button>
    </form>
  )
}
