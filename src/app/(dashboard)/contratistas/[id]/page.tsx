import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatFechaSolo } from "@/lib/utils"
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

export default async function ContratistaDetailPage({ params }: Props) {
  await requireRole("ADMINISTRADOR", "SUPERVISOR_CENTRAL")
  const { id } = await params
  const contratistaId = parseInt(id, 10)

  if (isNaN(contratistaId)) notFound()

  const contratista = await prisma.contratista.findUnique({
    where: { id: contratistaId },
    include: {
      trabajadores: {
        where: { estado: "VIGENTE" },
        orderBy: { nombre: "asc" },
        select: {
          id: true,
          identificador: true,
          nombre: true,
          ciudad: true,
          estado: true,
          especialidad: true,
        },
      },
    },
  })

  if (!contratista) notFound()

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/contratistas">← Volver</Link>
          </Button>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            {contratista.nombre}
          </h1>
          <p className="mt-1 font-mono text-sm text-gray-500">
            {formatRUT(contratista.identificador)}
          </p>
        </div>
        <Button asChild>
          <Link href={`/contratistas/${contratista.id}/edit`}>Editar</Link>
        </Button>
      </div>

      {/* Información del contratista */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Información del Contratista
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">RUT</dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">
              {formatRUT(contratista.identificador)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Nombre / Razón Social
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{contratista.nombre}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.ciudad ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Dirección</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.direccion ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Correo Electrónico
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.telefono ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Nombre Contador
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.nombreContador ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Especialidad</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contratista.especialidad ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {contratista.estado}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Fecha de Registro
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatFechaSolo(contratista.fechaInsert)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Trabajadores */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Trabajadores Vigentes
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {contratista.trabajadores.length}{" "}
            {contratista.trabajadores.length === 1
              ? "trabajador"
              : "trabajadores"}{" "}
            asociados a este contratista
          </p>
        </div>

        {contratista.trabajadores.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay trabajadores vigentes para este contratista.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratista.trabajadores.map((trabajador) => (
                <TableRow key={trabajador.id}>
                  <TableCell className="font-mono text-sm">
                    {formatRUT(trabajador.identificador)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {trabajador.nombre}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {trabajador.especialidad ?? "—"}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {trabajador.ciudad ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {trabajador.estado}
                    </span>
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
