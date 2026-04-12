"use client"

import { useState } from "react"

export interface ObrasData {
  nombre: string
  ingresos: number
}

interface Props {
  hoy: ObrasData[]
  ayer: ObrasData[]
  semana: ObrasData[]
}

type Periodo = "hoy" | "ayer" | "semana"

const TABS: { key: Periodo; label: string }[] = [
  { key: "hoy",    label: "Hoy"    },
  { key: "ayer",   label: "Ayer"   },
  { key: "semana", label: "Semana" },
]

export default function TopObras({ hoy, ayer, semana }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>("hoy")

  const datos = periodo === "hoy" ? hoy : periodo === "ayer" ? ayer : semana
  const max = datos[0]?.ingresos ?? 1
  const esSemana = periodo === "semana"

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      {/* Header con tabs */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Top obras</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {esSemana ? "Total semanal y promedio diario" : "Por cantidad de ingresos"}
            </p>
          </div>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriodo(tab.key)}
                className={[
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  periodo === tab.key
                    ? "bg-[#0e7f6d] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="p-6 space-y-4">
        {datos.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Sin registros</p>
        ) : (
          datos.map((obra, i) => {
            const promedioDiario = Math.round(obra.ingresos / 7)
            return (
              <div key={i}>
                <div className="flex items-start justify-between gap-3 text-sm mb-1">
                  {/* Nombre completo, sin truncar */}
                  <span className="font-medium text-gray-900 leading-tight">
                    {obra.nombre}
                  </span>
                  {/* Contador */}
                  <div className="flex-shrink-0 text-right">
                    <span className="font-semibold text-[#0e7f6d]">
                      {obra.ingresos}
                    </span>
                    {esSemana && (
                      <div className="text-xs text-gray-400 leading-tight">
                        ~{promedioDiario}/día
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#0e7f6d] transition-all duration-300"
                    style={{ width: `${Math.round((obra.ingresos / max) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
