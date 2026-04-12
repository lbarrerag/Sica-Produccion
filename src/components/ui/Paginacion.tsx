import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  paginaActual: number
  totalPaginas: number
  total: number
  por_pagina: number
  basePath: string          // ej: "/contratistas"
  extraParams?: string      // ej: "contratistaId=5"
}

export function Paginacion({
  paginaActual,
  totalPaginas,
  total,
  por_pagina,
  basePath,
  extraParams = "",
}: Props) {
  if (totalPaginas <= 1) return null

  const inicio = (paginaActual - 1) * por_pagina + 1
  const fin = Math.min(paginaActual * por_pagina, total)

  function href(pagina: number) {
    const params = new URLSearchParams()
    if (pagina > 1) params.set("pagina", String(pagina))
    if (extraParams) {
      for (const [k, v] of new URLSearchParams(extraParams)) {
        params.set(k, v)
      }
    }
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  // Páginas a mostrar: siempre primera, última y hasta 3 alrededor de la actual
  const paginas: (number | "…")[] = []
  const rango = new Set<number>()
  rango.add(1)
  rango.add(totalPaginas)
  for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
    if (i >= 1 && i <= totalPaginas) rango.add(i)
  }
  const sorted = Array.from(rango).sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) paginas.push("…")
    paginas.push(sorted[i])
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{inicio}–{fin}</span>{" "}
        de <span className="font-medium text-gray-700">{total}</span> registros
      </p>

      <nav className="flex items-center gap-1" aria-label="Paginación">
        {paginaActual > 1 ? (
          <Link
            href={href(paginaActual - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-100 text-gray-300 cursor-not-allowed">
            <ChevronLeft size={16} />
          </span>
        )}

        {paginas.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === paginaActual ? "page" : undefined}
              className={[
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
                p === paginaActual
                  ? "bg-[#0e7f6d] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {p}
            </Link>
          )
        )}

        {paginaActual < totalPaginas ? (
          <Link
            href={href(paginaActual + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-100 text-gray-300 cursor-not-allowed">
            <ChevronRight size={16} />
          </span>
        )}
      </nav>
    </div>
  )
}
