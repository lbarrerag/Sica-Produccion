import { requireRole } from "@/lib/auth-utils"
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

export default async function ContratistasPage() {
  await requireRole("ADMINISTRADOR")

  const contratistas = await prisma.contratista.findMany({
    where: { estado: "VIGENTE" },
    orderBy: { nombre: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contratistas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de empresas contratistas
          </p>
        </div>
        <Button asChild>
          <Link href="/contratistas/new">+ Nuevo Contratista</Link>
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {contratistas.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay contratistas registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratistas.map((contratista) => (
                <TableRow key={contratista.id}>
                  <TableCell className="font-medium">
                    {contratista.nombre}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatRUT(contratista.identificador)}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {contratista.ciudad ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {contratista.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contratistas/${contratista.id}`}>Ver</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/contratistas/${contratista.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                      <DeleteContratistaButton
                        id={contratista.id}
                        nombre={contratista.nombre}
                      />
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

function DeleteContratistaButton({
  id,
  nombre,
}: {
  id: number
  nombre: string
}) {
  return (
    <form
      action={async () => {
        "use server"
        const { prisma: db } = await import("@/lib/db")
        await db.contratista.update({
          where: { id },
          data: { estado: "ELIMINADO" },
        })
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/contratistas")
      }}
    >
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`¿Está seguro de eliminar el contratista "${nombre}"?`)) {
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
