"use client"

import { formatRUT } from "@/lib/rut"
import type { FilaAcceso } from "@/app/(dashboard)/dashboard/page"

function fmtDt(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

interface AccesosRecientesProps {
  registros: FilaAcceso[]
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 text-left">Fecha Registro</th>
            <th className="px-4 py-3 text-left">Identificador</th>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Obra</th>
            <th className="px-4 py-3 text-left">Centro Costo</th>
            <th className="px-4 py-3 text-left">Contratista</th>
            <th className="px-4 py-3 text-left">Fecha/Hora Ingreso</th>
            <th className="px-4 py-3 text-left">Fecha/Hora Salida</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {registros.map((reg) => (
            <tr key={`${reg.id}-${reg.fechaRegistro}`} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{reg.fechaRegistro}</td>
              <td className="px-4 py-3 font-mono">{formatRUT(reg.identificador)}</td>
              <td className="px-4 py-3 font-medium text-gray-900 min-w-[160px]">{reg.nombre}</td>
              <td className="px-4 py-3 text-gray-500 min-w-[200px]">{reg.obra}</td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{reg.centroCosto ?? "—"}</td>
              <td className="px-4 py-3 text-gray-500 min-w-[160px]">{reg.contratista ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmtDt(reg.fechaIngreso)}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmtDt(reg.fechaSalida)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
