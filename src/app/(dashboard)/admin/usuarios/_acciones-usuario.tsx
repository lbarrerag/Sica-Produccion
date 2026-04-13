"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Props {
  userId: string
  userName: string
  role: string
}

export default function AccionesUsuario({ userId, userName, role }: Props) {
  const [reseteando, setReseteando] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState<string | null>(null)

  async function resetearPassword() {
    setReseteando(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/reset`, { method: "POST" })
      if (!res.ok) throw new Error()
      const { tempPassword } = await res.json()
      setNuevaPassword(tempPassword)
    } catch {
      toast.error("Error al resetear la contraseña")
    } finally {
      setReseteando(false)
    }
  }

  if (nuevaPassword) {
    return (
      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5">
          <span className="text-xs text-yellow-700">Nueva contraseña:</span>
          <code className="font-mono text-sm font-bold text-yellow-900">{nuevaPassword}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(nuevaPassword)
              toast.success("Contraseña copiada")
            }}
            className="text-xs text-yellow-700 underline hover:text-yellow-900"
          >
            Copiar
          </button>
        </div>
        <button
          onClick={() => setNuevaPassword(null)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {role !== "API" && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetearPassword}
          disabled={reseteando}
        >
          {reseteando ? "..." : "Resetear contraseña"}
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/usuarios/${userId}/edit`}>Editar</Link>
      </Button>
    </div>
  )
}
