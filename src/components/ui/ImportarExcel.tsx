"use client"
import { useRef, useState } from "react"
import { Upload } from "lucide-react"

interface Props {
  endpoint: string
  label?: string
  onSuccess?: () => void
}

export function ImportarExcel({ endpoint, label = "Importar Excel", onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    importados?: number
    errores?: number
    mensajes?: string[]
    error?: string
  } | null>(null)
  const [open, setOpen] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd })
      const data = await res.json()
      setResult(data)
      if (data.importados > 0) onSuccess?.()
    } catch (err) {
      setResult({ error: String(err) })
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setResult(null)
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-[#0e7f6d] px-3 py-2 text-sm font-medium text-[#0e7f6d] hover:bg-[#0e7f6d] hover:text-white transition-colors"
      >
        <Upload size={16} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{label}</h3>

            {!result ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona un archivo .xlsx. La primera fila debe ser el título y la segunda las cabeceras.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleFile}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0e7f6d] file:text-white file:font-medium file:cursor-pointer hover:file:bg-[#085c4e] disabled:opacity-50"
                />
                {loading && (
                  <p className="mt-3 text-sm text-[#0e7f6d] animate-pulse">Importando…</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {result.error ? (
                  <p className="text-sm text-red-600">{result.error}</p>
                ) : (
                  <>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-700 font-semibold">
                        {result.importados} importados
                      </span>
                      {(result.errores ?? 0) > 0 && (
                        <span className="text-red-600 font-semibold">
                          {result.errores} errores
                        </span>
                      )}
                    </div>
                    {result.mensajes && result.mensajes.length > 0 && (
                      <ul className="text-xs text-red-600 max-h-32 overflow-y-auto space-y-1">
                        {result.mensajes.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    setOpen(false)
                    setResult(null)
                  }}
                  className="w-full mt-2 rounded-lg bg-[#0e7f6d] px-4 py-2 text-sm font-medium text-white hover:bg-[#085c4e]"
                >
                  Cerrar
                </button>
              </div>
            )}

            {!result && !loading && (
              <button
                onClick={() => setOpen(false)}
                className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
