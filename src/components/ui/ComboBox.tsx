"use client"

import { useState, useRef, useEffect } from "react"

interface Opcion {
  id: number
  nombre: string
}

interface ComboBoxProps {
  opciones: Opcion[]
  valor: string          // id seleccionado como string, "" = todos
  onChange: (id: string) => void
  placeholder: string    // ej. "Todas las obras"
  className?: string
}

export function ComboBox({ opciones, valor, onChange, placeholder, className }: ComboBoxProps) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const contenedorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Label del valor seleccionado
  const etiqueta = valor
    ? (opciones.find((o) => String(o.id) === valor)?.nombre ?? placeholder)
    : placeholder

  // Filtrar opciones por búsqueda
  const filtradas = busqueda.trim()
    ? opciones.filter((o) =>
        o.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : opciones

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
        setBusqueda("")
      }
    }
    document.addEventListener("mousedown", onClickFuera)
    return () => document.removeEventListener("mousedown", onClickFuera)
  }, [])

  function abrir() {
    setAbierto(true)
    setBusqueda("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function seleccionar(id: string) {
    onChange(id)
    setAbierto(false)
    setBusqueda("")
  }

  return (
    <div ref={contenedorRef} className={`relative ${className ?? ""}`}>
      {/* Botón que muestra la selección actual */}
      <button
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
      >
        <span className={valor ? "text-gray-700" : "text-gray-400"} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {etiqueta}
        </span>
        <svg className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {abierto && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="block h-8 w-full rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0e7f6d]/40"
            />
          </div>
          {/* Lista */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {/* Opción vacía (todos) */}
            <li>
              <button
                type="button"
                onClick={() => seleccionar("")}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!valor ? "font-medium text-[#0e7f6d]" : "text-gray-500"}`}
              >
                {placeholder}
              </button>
            </li>
            {filtradas.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
            ) : (
              filtradas.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => seleccionar(String(o.id))}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${String(o.id) === valor ? "font-medium text-[#0e7f6d]" : "text-gray-700"}`}
                  >
                    {o.nombre}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
