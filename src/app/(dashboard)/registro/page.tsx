"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { formatRUT } from "@/lib/rut"
import { formatFecha } from "@/lib/utils"

interface Obra {
  id: number
  nombre: string
}

interface TrabajadorBuscado {
  id: number
  nombre: string
  identificador: string
  nombreContratista: string | null
  especialidad: string | null
  ultimoRegistro: {
    tipo: "ENTRADA" | "SALIDA"
    fechaHora: string
  } | null
  accionSugerida: "ENTRADA" | "SALIDA"
}

export default function RegistroPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [obraId, setObraId] = useState<string>("")
  const [rut, setRut] = useState("")
  const [cargando, setCargando] = useState(false)
  const [trabajador, setTrabajador] = useState<TrabajadorBuscado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [registrando, setRegistrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar obras al montar
  useEffect(() => {
    async function cargarObras() {
      try {
        const res = await fetch("/api/obras")
        if (res.ok) {
          const data = await res.json()
          setObras(data)
          if (data.length > 0) setObraId(String(data[0].id))
        }
      } catch {
        // silencioso
      }
    }
    cargarObras()
  }, [])

  // Auto-submit cuando RUT tiene 9+ caracteres (lector de código de barras)
  useEffect(() => {
    const clean = rut.replace(/[^0-9kK]/gi, "")
    if (clean.length >= 9) {
      buscarTrabajador()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rut])

  async function buscarTrabajador() {
    if (!rut.trim()) return
    if (!obraId) {
      toast.error("Seleccione una obra antes de buscar")
      return
    }
    setCargando(true)
    setError(null)
    setTrabajador(null)

    try {
      const params = new URLSearchParams({ rut: rut.trim(), obraId })
      const res = await fetch(`/api/registro/buscar?${params}`)

      if (res.status === 404) {
        setError("Trabajador no encontrado")
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al buscar trabajador")
      }

      const data = await res.json()
      setTrabajador(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al buscar trabajador"
      )
    } finally {
      setCargando(false)
    }
  }

  async function registrarAcceso() {
    if (!trabajador || !obraId) return
    setRegistrando(true)

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: trabajador.id,
          obraId: parseInt(obraId, 10),
          tipo: trabajador.accionSugerida,
          identificador: trabajador.identificador,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al registrar acceso")
      }

      toast.success(
        trabajador.accionSugerida === "ENTRADA"
          ? `Entrada registrada para ${trabajador.nombre}`
          : `Salida registrada para ${trabajador.nombre}`
      )

      // Limpiar estado
      setRut("")
      setTrabajador(null)
      setError(null)
      inputRef.current?.focus()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al registrar acceso"
      )
    } finally {
      setRegistrando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      buscarTrabajador()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      {/* Título */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Control de Acceso
        </h1>
        <p className="mt-1 text-gray-500">
          Registre entrada y salida de trabajadores
        </p>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Selector de Obra */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Obra actual
          </label>
          <select
            value={obraId}
            onChange={(e) => {
              setObraId(e.target.value)
              setTrabajador(null)
              setError(null)
            }}
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Seleccione una obra —</option>
            {obras.map((o) => (
              <option key={o.id} value={String(o.id)}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador de RUT */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            RUT del trabajador
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={rut}
              onChange={(e) => {
                setRut(e.target.value)
                setError(null)
                setTrabajador(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escanee o ingrese el RUT"
              autoFocus
              autoComplete="off"
              className="block flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-2xl font-mono text-gray-900 shadow-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={buscarTrabajador}
              disabled={cargando || !rut.trim()}
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Tarjeta del trabajador */}
        {trabajador && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">
                  {trabajador.nombre}
                </p>
                <p className="font-mono text-sm text-gray-600">
                  {formatRUT(trabajador.identificador)}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm text-gray-500">
                  {trabajador.nombreContratista && (
                    <span>
                      <span className="font-medium text-gray-700">
                        Empresa:
                      </span>{" "}
                      {trabajador.nombreContratista}
                    </span>
                  )}
                  {trabajador.especialidad && (
                    <span>
                      <span className="font-medium text-gray-700">
                        Especialidad:
                      </span>{" "}
                      {trabajador.especialidad}
                    </span>
                  )}
                </div>
                {trabajador.ultimoRegistro && (
                  <p className="text-xs text-gray-400">
                    Último registro:{" "}
                    <span className="font-medium">
                      {trabajador.ultimoRegistro.tipo}
                    </span>{" "}
                    —{" "}
                    {formatFecha(trabajador.ultimoRegistro.fechaHora)}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de registro */}
            <button
              type="button"
              onClick={registrarAcceso}
              disabled={registrando}
              className={[
                "flex w-full items-center justify-center rounded-xl text-xl font-bold text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:opacity-60",
                "min-h-[80px]",
                trabajador.accionSugerida === "ENTRADA"
                  ? "bg-green-600 hover:bg-green-700 focus-visible:ring-green-400"
                  : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-400",
              ].join(" ")}
            >
              {registrando
                ? "Registrando..."
                : trabajador.accionSugerida === "ENTRADA"
                ? "Registrar ENTRADA"
                : "Registrar SALIDA"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
