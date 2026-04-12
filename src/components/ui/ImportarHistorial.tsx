"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"

export function ImportarHistorial() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progreso, setProgreso] = useState("")
  const [result, setResult] = useState<{
    importados?: number
    omitidos?: number
    errores?: string[]
    totalErrores?: number
    error?: string
  } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    setProgreso("Subiendo archivo…")

    const fd = new FormData()
    fd.append("file", file)

    try {
      setProgreso("Procesando registros… (puede tardar varios minutos para archivos grandes)")
      const res = await fetch("/api/import/registros", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
      setProgreso("")
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {!result ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Seleccionar archivo Excel (.xlsx)
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFile}
            disabled={loading}
            className="block w-full text-sm text-gray-500
              file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
              file:bg-[#0e7f6d] file:text-white file:font-medium file:cursor-pointer
              hover:file:bg-[#085c4e] disabled:opacity-50"
          />

          {loading && (
            <div className="flex items-center gap-3 rounded-lg bg-[#0e7f6d]/8 border border-[#0e7f6d]/20 px-4 py-3">
              <svg
                className="animate-spin h-5 w-5 text-[#0e7f6d] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-[#085c4e]">{progreso}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {result.error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-medium text-red-800">Error al importar</p>
              <p className="text-sm text-red-600 mt-1">{result.error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {result.importados?.toLocaleString("es-CL")}
                  </p>
                  <p className="text-sm text-green-600 mt-0.5">registros importados</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-500">
                    {result.omitidos?.toLocaleString("es-CL")}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">filas omitidas</p>
                </div>
              </div>

              {(result.totalErrores ?? 0) > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
                  <p className="text-sm font-medium text-amber-800">
                    {result.totalErrores} errores durante la importación
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errores?.map((m, i) => <li key={i}>{m}</li>)}
                    {(result.totalErrores ?? 0) > 20 && (
                      <li className="text-amber-500">
                        … y {(result.totalErrores ?? 0) - 20} más
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0e7f6d] px-4 py-2 text-sm font-medium text-white hover:bg-[#085c4e]"
            >
              <Upload size={15} />
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
