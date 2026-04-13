"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useParams } from "next/navigation"
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
  role: z.enum(["ADMINISTRADOR", "SUPERVISOR_CENTRAL", "SUPERVISOR", "REGISTRO_MARCA", "API"]),
  estado: z.enum(["VIGENTE", "INACTIVO"]),
})

type FormValues = z.infer<typeof schema>

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [obras, setObras] = useState<Obra[]>([])
  const [obraIdsSeleccionadas, setObraIdsSeleccionadas] = useState<number[]>([])
  const [rolActual, setRolActual] = useState<string>("REGISTRO_MARCA")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const rolWatch = watch("role")

  // Cargar usuario y obras en paralelo
  useEffect(() => {
    async function cargar() {
      try {
        const [resUsuario, resObras] = await Promise.all([
          fetch(`/api/admin/usuarios/${id}`),
          fetch("/api/obras"),
        ])

        if (!resUsuario.ok) throw new Error("No se encontró el usuario")

        const [usuario, listaObras] = await Promise.all([
          resUsuario.json(),
          resObras.ok ? resObras.json() : [],
        ])

        setObras(listaObras)
        setObraIdsSeleccionadas(
          (usuario.userObras ?? []).map((uo: { obraId: number }) => uo.obraId)
        )
        setRolActual(usuario.role)

        reset({
          userName: usuario.userName ?? "",
          email: usuario.email ?? usuario.appEmail ?? "",
          role: usuario.role as FormValues["role"],
          estado: usuario.estado as FormValues["estado"],
        })
      } catch (err) {
        setErrorCarga(
          err instanceof Error ? err.message : "Error al cargar el usuario"
        )
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, reset])

  function toggleObra(obraId: number) {
    setObraIdsSeleccionadas((prev) =>
      prev.includes(obraId)
        ? prev.filter((x) => x !== obraId)
        : [...prev, obraId]
    )
  }

  async function onSubmit(data: FormValues) {
    try {
      const rolesConObras = ["SUPERVISOR", "REGISTRO_MARCA", "API"]
      const payload = {
        userName: data.userName.trim(),
        email: data.email?.trim() || null,
        role: data.role,
        estado: data.estado,
        obraIds: rolesConObras.includes(data.role) ? obraIdsSeleccionadas : [],
      }

      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al actualizar el usuario")
      }

      toast.success("Usuario actualizado correctamente")
      router.push("/admin/usuarios")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar el usuario"
      )
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-500">
        Cargando datos...
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <p className="text-sm text-red-600">{errorCarga}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/usuarios">Volver a Usuarios</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Editar Usuario</h1>
        <p className="mt-1 text-sm text-gray-500">
          Modifique los datos del usuario
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
              <option value="API">API</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label htmlFor="estado">
              Estado <span className="text-red-500">*</span>
            </Label>
            <select
              id="estado"
              {...register("estado")}
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VIGENTE">Vigente</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
            {errors.estado && (
              <p className="text-xs text-red-600">{errors.estado.message}</p>
            )}
          </div>

          {/* Obras asignadas (para Supervisor, Registro Marca y API) */}
          {(rolWatch === "SUPERVISOR" || rolWatch === "REGISTRO_MARCA" || rolWatch === "API") && (
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
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
