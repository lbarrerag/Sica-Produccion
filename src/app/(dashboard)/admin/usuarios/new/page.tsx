"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

interface Obra {
  id: number
  nombre: string
}

const schema = z.object({
  userName: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMINISTRADOR", "SUPERVISOR_CENTRAL", "SUPERVISOR", "REGISTRO_MARCA"]),
  obraIds: z.array(z.number()).optional(),
})

type FormValues = z.infer<typeof schema>

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
  const [obraIdsSeleccionadas, setObraIdsSeleccionadas] = useState<number[]>([])
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userName: "",
      email: "",
      role: "REGISTRO_MARCA",
      obraIds: [],
    },
  })

  const rolSeleccionado = watch("role")

  // Cargar obras
  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/obras")
        if (res.ok) setObras(await res.json())
      } catch {
        // silencioso
      }
    }
    cargar()
  }, [])

  function toggleObra(id: number) {
    setObraIdsSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: FormValues) {
    try {
      const rolesConObras = ["SUPERVISOR", "REGISTRO_MARCA"]
      const payload = {
        userName: data.userName.trim(),
        email: data.email?.trim() || null,
        role: data.role,
        obraIds: rolesConObras.includes(data.role) ? obraIdsSeleccionadas : [],
      }

      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al crear el usuario")
      }

      const result = await res.json()
      setTempPassword(result.tempPassword ?? null)
      toast.success("Usuario creado correctamente")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear el usuario"
      )
    }
  }

  // Pantalla de confirmación con contraseña temporal
  if (tempPassword) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Usuario creado correctamente
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Comparta estas credenciales con el usuario de forma segura
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                Contraseña temporal generada
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                Esta contraseña solo se muestra una vez. Copíela ahora.
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-md border border-yellow-300 bg-white px-4 py-2 font-mono text-lg font-bold text-gray-900">
                  {tempPassword}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword)
                    toast.success("Contraseña copiada al portapapeles")
                  }}
                  className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button asChild>
                <Link href="/admin/usuarios">Volver a Usuarios</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTempPassword(null)
                }}
              >
                Crear otro usuario
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nuevo Usuario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete los datos para registrar un nuevo usuario del sistema
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
          {/* Nombre de usuario */}
          <div className="space-y-1.5">
            <Label htmlFor="userName">
              Nombre de usuario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="userName"
              placeholder="ej: jperez"
              {...register("userName")}
              aria-invalid={!!errors.userName}
            />
            {errors.userName && (
              <p className="text-xs text-red-600">{errors.userName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.cl"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <Label htmlFor="role">
              Rol <span className="text-red-500">*</span>
            </Label>
            <select
              id="role"
              {...register("role")}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="REGISTRO_MARCA">Registro Marca</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="SUPERVISOR_CENTRAL">Supervisor Central</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Obras asignadas (para Supervisor y Registro Marca) */}
          {(rolSeleccionado === "SUPERVISOR" || rolSeleccionado === "REGISTRO_MARCA") && (
            <div className="space-y-2">
              <Label>Obras asignadas</Label>
              <p className="text-xs text-gray-500">
                Seleccione las obras a las que tendrá acceso este usuario
              </p>
              <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-2 space-y-1">
                {obras.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-gray-400">
                    No hay obras disponibles
                  </p>
                ) : (
                  obras.map((o) => (
                    <label
                      key={o.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={obraIdsSeleccionadas.includes(o.id)}
                        onChange={() => toggleObra(o.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{o.nombre}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/usuarios">Cancelar</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
