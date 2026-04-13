"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Usuario {
  id: string
  userName: string
  email: string | null
  role: string
  estado: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR_CENTRAL: "Supervisor Central",
  SUPERVISOR: "Supervisor",
  REGISTRO_MARCA: "Registro Marca",
}

export default function UsuariosObra({ obraId }: { obraId: number }) {
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([])
  const [asignados, setAsignados] = useState<Set<string>>(new Set())
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        const [resAll, resObra] = await Promise.all([
          fetch("/api/admin/usuarios"),
          fetch(`/api/obras/${obraId}/usuarios`),
        ])
        const [todos, obraUsuarios]: [Usuario[], Usuario[]] = await Promise.all([
          resAll.json(),
          resObra.json(),
        ])
        // Solo mostrar usuarios que pueden tener obras asignadas
        setTodosUsuarios(
          todos.filter((u) =>
            ["SUPERVISOR", "REGISTRO_MARCA"].includes(u.role) && u.estado === "VIGENTE"
          )
        )
        setAsignados(new Set(obraUsuarios.map((u) => u.id)))
      } catch {
        toast.error("Error al cargar usuarios")
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [obraId])

  function toggleUsuario(id: string) {
    setAsignados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function guardar() {
    setGuardando(true)
    try {
      const res = await fetch(`/api/obras/${obraId}/usuarios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(asignados) }),
      })
      if (!res.ok) throw new Error()
      toast.success("Usuarios actualizados correctamente")
    } catch {
      toast.error("Error al guardar los cambios")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <p className="text-sm text-gray-500 px-6 py-4">Cargando usuarios...</p>
    )
  }

  return (
    <div className="px-6 pb-6">
      {todosUsuarios.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No hay usuarios con perfil Supervisor o Registro Marca disponibles.
        </p>
      ) : (
        <>
          <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 p-2 space-y-1">
            {todosUsuarios.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={asignados.has(u.id)}
                  onChange={() => toggleUsuario(u.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-900">{u.userName}</span>
                  {u.email && (
                    <span className="ml-2 text-xs text-gray-500">{u.email}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={guardar} disabled={guardando} size="sm">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
