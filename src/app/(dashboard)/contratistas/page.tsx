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
import { ImportarExcel } from "@/components/ui/ImportarExcel"
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton"

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
        <div className="flex items-center gap-2">
          <ImportarExcel endpoint="/api/import/contratistas" label="Importar Excel" />
          <Button asChild>
            <Link href="/contratistas/new">+ Nuevo Contratista</Link>
          </Button>
        </div>
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
                      <ConfirmDeleteButton
                        action={async () => {
                          "use server"
                          const { prisma: db } = await import("@/lib/db")
                          await db.contratista.update({
                            where: { id: contratista.id },
                            data: { estado: "ELIMINADO" },
                          })
                          const { revalidatePath } = await import("next/cache")
                          revalidatePath("/contratistas")
                        }}
                        mensaje={`¿Está seguro de eliminar el contratista "${contratista.nombre}"?`}
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

