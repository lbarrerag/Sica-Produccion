import React from "react"

interface StatsCardProps {
  titulo: string
  valor: number | string
  icono: React.ReactNode
}

export default function StatsCard({ titulo, valor, icono }: StatsCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
        {icono}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{titulo}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{valor}</p>
      </div>
    </div>
  )
}
