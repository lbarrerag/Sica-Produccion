import { requireRole, hasRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { formatRUT } from "@/lib/rut"
import Link from "next/link"
import { redirect } from "next/navigation"
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

interface Props {
  searchParams: Promise<{ contratistaId?: string }>
}

export default async function TrabajadoresPage({ searchParams }: Props) {
  const user = await requireRole("ADMINISTRADOR", "SUPERVISOR")
  const esAdmin = hasRole(user, "ADMINISTRADOR")

  const { contratistaId } = await searchParams
  const contratistaIdNum = contratistaId ? parseInt(contratistaId, 10) : undefined

  const [trabajadores, contratistas] = await Promise.all([
    prisma.trabajador.findMany({
      where: {
        estado: "VIGENTE",
        ...(contratistaIdNum && !isNaN(contratistaIdNum)
          ? { contratistaId: contratistaIdNum }
          : {}),
      },
      orderBy: { nombre: "asc" },
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

      {/* Filtro por contratista */}
      <div className="flex items-center gap-3">
        <form
          action={async (formData: FormData) => {
            "use server"
            const val = formData.get("contratistaId") as string
            if (val) {
              redirect(`/trabajadores?contratistaId=${val}`)
            } else {
              redirect("/trabajadores")
            }
          }}
          className="flex items-center gap-2"
        >
          <select
            name="contratistaId"
            defaultValue={contratistaId ?? ""}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              // handled via form submit on server
            }}
          >
            <option value="">Todos los contratistas</option>
            {contratistas.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filtrar
          </Button>
          {contratistaId && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trabajadores">Limpiar</Link>
            </Button>
          )}
        </form>
        {contratistaId && (
          <p className="text-sm text-gray-500">
            Mostrando {trabajadores.length}{" "}
            {trabajadores.length === 1 ? "trabajador" : "trabajadores"}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {trabajadores.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay trabajadores registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
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
                          <DeleteTrabajadorButton
                            id={t.id}
                            nombre={t.nombre}
                          />
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

function DeleteTrabajadorButton({
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
        await db.trabajador.update({
          where: { id },
          data: { estado: "ELIMINADO" },
        })
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/trabajadores")
      }}
    >
      <button
        type="submit"
        onClick={(e) => {
          if (
            !confirm(`¿Está seguro de eliminar al trabajador "${nombre}"?`)
          ) {
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
