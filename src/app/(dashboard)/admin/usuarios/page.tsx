import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
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

const ROL_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor",
  REGISTRO_MARCA: "Registro Marca",
  API: "API",
}

const ESTADO_STYLES: Record<string, string> = {
  VIGENTE:
    "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800",
  INACTIVO:
    "inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800",
  ELIMINADO:
    "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800",
}

export default async function UsuariosPage() {
  await requireRole("ADMINISTRADOR")

  const usuarios = await prisma.user.findMany({
    where: { estado: { not: "ELIMINADO" } },
    orderBy: { userName: "asc" },
    include: {
      userObras: { select: { id: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de usuarios del sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/new">+ Nuevo Usuario</Link>
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {usuarios.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay usuarios registrados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Obras asignadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.userName}</TableCell>
                  <TableCell className="text-gray-500">
                    {u.email ?? u.appEmail ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {ROL_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={ESTADO_STYLES[u.estado] ?? ""}>
                      {u.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {u.userObras.length > 0 ? (
                      <span>{u.userObras.length} obra(s)</span>
                    ) : (
                      <span className="text-gray-400">Sin obras</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/usuarios/${u.id}/edit`}>Editar</Link>
                    </Button>
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
