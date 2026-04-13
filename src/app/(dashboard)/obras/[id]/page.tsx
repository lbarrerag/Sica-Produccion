import { requireAuth } from "@/lib/auth-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import UsuariosObra from "./_usuarios-obra"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatFecha, formatFechaSolo } from "@/lib/utils"
import { formatRUT } from "@/lib/rut"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ObraDetailPage({ params }: Props) {
  await requireAuth()
  const session = await auth()
  const role = (session?.user as { role?: string })?.role ?? ""
  const { id } = await params
  const obraId = parseInt(id, 10)

  if (isNaN(obraId)) notFound()

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      registros: {
        take: 20,
        orderBy: { fechaHora: "desc" },
        include: {
          trabajador: { select: { nombre: true } },
        },
      },
    },
  })

  if (!obra) notFound()

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/obras">← Volver</Link>
            </Button>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            {obra.nombre}
          </h1>
          {obra.centroCosto && (
            <p className="mt-1 text-sm text-gray-500">
              Centro de Costo: {obra.centroCosto}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href={`/obras/${obra.id}/edit`}>Editar</Link>
        </Button>
      </div>

      {/* Detalle de la obra */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Información de la Obra
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1 text-sm text-gray-900">{obra.nombre}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Centro de Costo</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {obra.centroCosto ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {obra.estado}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatFechaSolo(obra.fechaInsert)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Usuarios asignados (solo para administrador) */}
      {role === "ADMINISTRADOR" && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              Usuarios asignados
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Supervisores y Registro Marca con acceso a esta obra
            </p>
          </div>
          <UsuariosObra obraId={obraId} />
        </div>
      )}

      {/* Últimos registros */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Últimos Registros de Acceso
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Los 20 registros más recientes para esta obra
          </p>
        </div>

        {obra.registros.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay registros de acceso para esta obra.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obra.registros.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {formatFecha(reg.fechaHora)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatRUT(reg.identificador)}
                  </TableCell>
                  <TableCell>{reg.trabajador.nombre}</TableCell>
                  <TableCell>
                    {reg.tipo === "ENTRADA" ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        ENTRADA
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        SALIDA
                      </span>
                    )}
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
