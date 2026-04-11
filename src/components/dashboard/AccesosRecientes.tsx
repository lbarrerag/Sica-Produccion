"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatRUT } from "@/lib/rut"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Registro {
  id: number
  tipo: "ENTRADA" | "SALIDA"
  fechaHora: Date
  identificador: string
  trabajador: { nombre: string }
  obra: { nombre: string }
}

interface AccesosRecientesProps {
  registros: Registro[]
}

export default function AccesosRecientes({ registros }: AccesosRecientesProps) {
  if (registros.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500">
        No hay registros de acceso para mostrar.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hora</TableHead>
          <TableHead>RUT</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Obra</TableHead>
          <TableHead>Tipo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registros.map((registro) => (
          <TableRow key={registro.id}>
            <TableCell className="font-mono text-sm text-gray-600">
              {format(new Date(registro.fechaHora), "HH:mm", { locale: es })}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {formatRUT(registro.identificador)}
            </TableCell>
            <TableCell>{registro.trabajador.nombre}</TableCell>
            <TableCell className="max-w-[200px] truncate">
              {registro.obra.nombre}
            </TableCell>
            <TableCell>
              {registro.tipo === "ENTRADA" ? (
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
  )
}
