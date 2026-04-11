"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { formatFecha } from "@/lib/utils"
import { formatRUT } from "@/lib/rut"

interface Obra {
  id: number
  nombre: string
}

interface Contratista {
  id: number
  nombre: string
}

interface RegistroReporte {
  id: number
  fechaHora: string
  identificador: string
  trabajador: { nombre: string }
  obra: { nombre: string }
  contratista: { nombre: string } | null
  tipo: "ENTRADA" | "SALIDA"
}

export default function ReportesPage() {
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [obraId, setObraId] = useState("")
  const [contratistaId, setContratistaId] = useState("")
  const [obras, setObras] = useState<Obra[]>([])
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [registros, setRegistros] = useState<RegistroReporte[]>([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  // Cargar filtros
  useEffect(() => {
    async function cargar() {
      try {
        const [resObras, resContratistas] = await Promise.all([
          fetch("/api/obras"),
          fetch("/api/contratistas"),
        ])
        if (resObras.ok) setObras(await resObras.json())
        if (resContratistas.ok) setContratistas(await resContratistas.json())
      } catch {
        // silencioso
      }
    }
    cargar()
  }, [])

  function buildParams() {
    const params = new URLSearchParams()
    if (fechaDesde) params.set("fechaDesde", fechaDesde)
    if (fechaHasta) params.set("fechaHasta", fechaHasta)
    if (obraId) params.set("obraId", obraId)
    if (contratistaId) params.set("contratistaId", contratistaId)
    return params
  }

  async function buscar() {
    setCargando(true)
    setBuscado(true)
    try {
      const res = await fetch(`/api/reportes?${buildParams()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al obtener reportes")
      }
      const data = await res.json()
      setRegistros(data)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al obtener reportes"
      )
      setRegistros([])
    } finally {
      setCargando(false)
    }
  }

  function exportarExcel() {
    window.location.href = `/api/reportes/export?${buildParams()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta de registros de acceso
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Fecha desde */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Fecha desde
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha hasta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Fecha hasta
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Obra */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Obra
            </label>
            <select
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las obras</option>
              {obras.map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Contratista */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Contratista
            </label>
            <select
              value={contratistaId}
              onChange={(e) => setContratistaId(e.target.value)}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los contratistas</option>
              {contratistas.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={buscar}
            disabled={cargando}
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {cargando ? "Buscando..." : "Buscar"}
          </button>

          {buscado && registros.length > 0 && (
            <button
              type="button"
              onClick={exportarExcel}
              className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-sm font-medium text-gray-700">
              {cargando
                ? "Cargando..."
                : `${registros.length} ${registros.length === 1 ? "resultado" : "resultados"}`}
            </p>
          </div>

          {!cargando && registros.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No se encontraron registros con los filtros seleccionados.
            </div>
          ) : !cargando ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 text-left">Fecha y Hora</th>
                    <th className="px-4 py-3 text-left">RUT</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Obra</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {formatFecha(reg.fechaHora)}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {formatRUT(reg.identificador)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {reg.trabajador.nombre}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {reg.contratista?.nombre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {reg.obra.nombre}
                      </td>
                      <td className="px-4 py-3">
                        {reg.tipo === "ENTRADA" ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            ENTRADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            SALIDA
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
