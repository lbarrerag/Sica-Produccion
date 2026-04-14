"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { formatRUT } from "@/lib/rut"
import { ComboBox } from "@/components/ui/ComboBox"

interface Obra { id: number; nombre: string }
interface Contratista { id: number; nombre: string }

interface FilaReporte {
  id: number
  fechaRegistro: string        // YYYY-MM-DD
  identificador: string
  nombre: string
  especialidad: string | null
  obra: string
  centroCosto: string | null
  contratista: string | null
  fechaIngreso: string | null  // ISO
  fechaSalida: string | null   // ISO
}

const POR_PAGINA = 20

function fmtDt(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export default function ReportesPage() {
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [obraId, setObraId] = useState("")
  const [contratistaId, setContratistaId] = useState("")
  const [trabajador, setTrabajador] = useState("")
  const [obras, setObras] = useState<Obra[]>([])
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [registros, setRegistros] = useState<FilaReporte[]>([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        const [resObras, resContratistas] = await Promise.all([
          fetch("/api/obras"),
          fetch("/api/contratistas"),
        ])
        if (resObras.ok) setObras(await resObras.json())
        if (resContratistas.ok) setContratistas(await resContratistas.json())
      } catch { /* silencioso */ }
    }
    cargar()
  }, [])

  function buildParams() {
    const params = new URLSearchParams()
    if (fechaDesde) params.set("fechaDesde", fechaDesde)
    if (fechaHasta) params.set("fechaHasta", fechaHasta)
    if (obraId) params.set("obraId", obraId)
    if (contratistaId) params.set("contratistaId", contratistaId)
    if (trabajador.trim()) params.set("trabajador", trabajador.trim())
    return params
  }

  async function buscar() {
    setCargando(true)
    setBuscado(true)
    setPaginaActual(1)
    try {
      const res = await fetch(`/api/reportes?${buildParams()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al obtener reportes")
      }
      setRegistros(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al obtener reportes")
      setRegistros([])
    } finally {
      setCargando(false)
    }
  }

  function exportarExcel() {
    window.location.href = `/api/reportes/export?${buildParams()}`
  }

  async function eliminarMasivo() {
    const params = buildParams()
    const n = registros.length
    if (
      !confirm(
        `¿Está seguro de eliminar ${n.toLocaleString("es-CL")} registros de acceso?\n\nEsta acción no se puede deshacer.`
      )
    )
      return

    setEliminando(true)
    try {
      const res = await fetch(`/api/reportes?${params}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Error al eliminar")
      toast.success(`${data.eliminados.toLocaleString("es-CL")} registros eliminados`)
      setRegistros([])
      setBuscado(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setEliminando(false)
    }
  }

  const totalPaginas = Math.ceil(registros.length / POR_PAGINA)
  const pagina = registros.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">Consulta de registros de acceso</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Fecha desde */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Fecha desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40" />
          </div>
          {/* Fecha hasta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Fecha hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40" />
          </div>
          {/* Trabajador */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Trabajador (nombre o RUT)</label>
            <input
              type="text"
              value={trabajador}
              onChange={(e) => setTrabajador(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Ej: Juan Pérez o 12.345.678-9"
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
            />
          </div>
          {/* Obra (ComboBox con búsqueda) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Obra</label>
            <ComboBox
              opciones={obras}
              valor={obraId}
              onChange={setObraId}
              placeholder="Todas las obras"
            />
          </div>
          {/* Contratista (ComboBox con búsqueda) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Contratista</label>
            <ComboBox
              opciones={contratistas}
              valor={contratistaId}
              onChange={setContratistaId}
              placeholder="Todos los contratistas"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="button" onClick={buscar} disabled={cargando}
            className="inline-flex h-9 items-center rounded-md bg-[#0e7f6d] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#085c4e] disabled:opacity-50">
            {cargando ? "Buscando…" : "Buscar"}
          </button>
          {buscado && registros.length > 0 && (
            <button type="button" onClick={exportarExcel}
              className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              Exportar Excel
            </button>
          )}
          {buscado && registros.length > 0 && (
            <button type="button" onClick={eliminarMasivo} disabled={eliminando}
              className="inline-flex h-9 items-center rounded-md border border-red-200 bg-white px-5 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-50">
              {eliminando ? "Eliminando…" : `Eliminar ${registros.length.toLocaleString("es-CL")} registros`}
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-sm font-medium text-gray-700">
              {cargando ? "Cargando…" : `${registros.length.toLocaleString("es-CL")} ${registros.length === 1 ? "resultado" : "resultados"}`}
            </p>
          </div>

          {!cargando && registros.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              No se encontraron registros con los filtros seleccionados.
            </div>
          ) : !cargando ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 text-left">Id</th>
                      <th className="px-4 py-3 text-left">Fecha Registro</th>
                      <th className="px-4 py-3 text-left">Identificador</th>
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Especialidad</th>
                      <th className="px-4 py-3 text-left">Obra</th>
                      <th className="px-4 py-3 text-left">Centro Costo</th>
                      <th className="px-4 py-3 text-left">Contratista</th>
                      <th className="px-4 py-3 text-left">Fecha/Hora Ingreso</th>
                      <th className="px-4 py-3 text-left">Fecha/Hora Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagina.map((reg) => (
                      <tr key={`${reg.id}-${reg.fechaRegistro}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{reg.id}</td>
                        <td className="px-4 py-3 text-gray-600">{reg.fechaRegistro}</td>
                        <td className="px-4 py-3 font-mono">{formatRUT(reg.identificador)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 min-w-[160px]">{reg.nombre}</td>
                        <td className="px-4 py-3 text-gray-500">{reg.especialidad ?? "—"}</td>
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

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Mostrando{" "}
                    <span className="font-medium text-gray-700">
                      {(paginaActual - 1) * POR_PAGINA + 1}–{Math.min(paginaActual * POR_PAGINA, registros.length)}
                    </span>{" "}
                    de <span className="font-medium text-gray-700">{registros.length.toLocaleString("es-CL")}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
                    <span className="px-2 text-sm text-gray-600">{paginaActual} / {totalPaginas}</span>
                    <button onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
