import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
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

export default async function TrabajadorDetailPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const trabajadorId = parseInt(id, 10)

  if (isNaN(trabajadorId)) notFound()

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    include: {
      contratista: { select: { id: true, nombre: true } },
      registros: {
        take: 20,
        orderBy: { fechaHora: "desc" },
        include: {
          obra: { select: { nombre: true } },
        },
      },
    },
  })

  if (!trabajador) notFound()

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trabajadores">← Volver</Link>
          </Button>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            {trabajador.nombre}
          </h1>
          <p className="mt-1 font-mono text-sm text-gray-500">
            {formatRUT(trabajador.identificador)}
          </p>
        </div>
        <Button asChild>
          <Link href={`/trabajadores/${trabajador.id}/edit`}>Editar</Link>
        </Button>
      </div>

      {/* Detalle del trabajador */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Información del Trabajador
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">RUT</dt>
            <dd className="mt-1 font-mono text-sm text-gray-900">
              {formatRUT(trabajador.identificador)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Nombre completo
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{trabajador.nombre}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Contratista</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {trabajador.contratista?.nombre ?? trabajador.nombreContratista ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Especialidad</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {trabajador.especialidad ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {trabajador.telefono ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {trabajador.ciudad ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Dirección</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {trabajador.direccion ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                {trabajador.estado}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">
              Fecha de Registro
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatFechaSolo(trabajador.fechaInsert)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Historial de registros */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Historial de Accesos
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Últimos 20 registros de acceso
          </p>
        </div>

        {trabajador.registros.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No hay registros de acceso para este trabajador.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trabajador.registros.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {formatFecha(reg.fechaHora)}
                  </TableCell>
                  <TableCell>{reg.obra.nombre}</TableCell>
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
