"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { DatoDia } from "@/app/(dashboard)/dashboard/page"

interface GraficoBarrasProps {
  datos: DatoDia[]
}

export default function GraficoBarras({ datos }: GraficoBarrasProps) {
  if (!datos || datos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Sin datos para mostrar
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={datos}
        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
        />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(14,127,109,0.07)" }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontSize: "13px",
            padding: "8px 12px",
          }}
          labelStyle={{ fontWeight: 600, color: "#111827", marginBottom: 2 }}
          formatter={(value) => [value, "Registros"]}
        />
        <Bar
          dataKey="total"
          fill="#0e7f6d"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
