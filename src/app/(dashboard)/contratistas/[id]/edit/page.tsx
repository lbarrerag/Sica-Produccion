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

const schema = z.object({
  identificador: z
    .string()
    .min(1, "El RUT es obligatorio")
    .max(20, "RUT inválido"),
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  direccion: z.string().max(300, "Máximo 300 caracteres").optional(),
  email: z
    .string()
    .email("Ingrese un correo electrónico válido")
    .optional()
    .or(z.literal("")),
  nombreContador: z.string().max(200, "Máximo 200 caracteres").optional(),
  telefono: z.string().max(30, "Máximo 30 caracteres").optional(),
  ciudad: z.string().max(100, "Máximo 100 caracteres").optional(),
  especialidad: z.string().max(200, "Máximo 200 caracteres").optional(),
})

type FormValues = z.infer<typeof schema>

export default function EditarContratistaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Cargar datos actuales del contratista
  useEffect(() => {
    async function cargarContratista() {
      try {
        const res = await fetch(`/api/contratistas/${id}`)
        if (!res.ok) throw new Error("No se encontró el contratista")
        const data = await res.json()
        reset({
          identificador: data.identificador ?? "",
          nombre: data.nombre ?? "",
          direccion: data.direccion ?? "",
          email: data.email ?? "",
          nombreContador: data.nombreContador ?? "",
          telefono: data.telefono ?? "",
          ciudad: data.ciudad ?? "",
          especialidad: data.especialidad ?? "",
        })
      } catch (err) {
        setErrorCarga(
          err instanceof Error ? err.message : "Error al cargar el contratista"
        )
      } finally {
        setCargando(false)
      }
    }
    cargarContratista()
  }, [id, reset])

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        identificador: data.identificador.trim(),
        nombre: data.nombre.trim(),
        direccion: data.direccion?.trim() || null,
        email: data.email?.trim() || null,
        nombreContador: data.nombreContador?.trim() || null,
        telefono: data.telefono?.trim() || null,
        ciudad: data.ciudad?.trim() || null,
        especialidad: data.especialidad?.trim() || null,
      }

      const res = await fetch(`/api/contratistas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al actualizar el contratista")
      }

      toast.success("Contratista actualizado correctamente")
      router.push("/contratistas")
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al actualizar el contratista"
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
          <Link href="/contratistas">Volver a Contratistas</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Editar Contratista
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Modifique los datos del contratista
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* RUT */}
            <div className="space-y-1.5">
              <Label htmlFor="identificador">
                RUT <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identificador"
                placeholder="Ej: 76.543.210-5"
                {...register("identificador")}
                aria-invalid={!!errors.identificador}
              />
              {errors.identificador && (
                <p className="text-xs text-red-600">
                  {errors.identificador.message}
                </p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre">
                Nombre / Razón Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Nombre de la empresa"
                {...register("nombre")}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && (
                <p className="text-xs text-red-600">{errors.nombre.message}</p>
              )}
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Dirección de la empresa"
                {...register("direccion")}
                aria-invalid={!!errors.direccion}
              />
              {errors.direccion && (
                <p className="text-xs text-red-600">
                  {errors.direccion.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="empresa@ejemplo.cl"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Nombre Contador */}
            <div className="space-y-1.5">
              <Label htmlFor="nombreContador">Nombre Contador</Label>
              <Input
                id="nombreContador"
                placeholder="Nombre del contador"
                {...register("nombreContador")}
                aria-invalid={!!errors.nombreContador}
              />
              {errors.nombreContador && (
                <p className="text-xs text-red-600">
                  {errors.nombreContador.message}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="+56 9 1234 5678"
                {...register("telefono")}
                aria-invalid={!!errors.telefono}
              />
              {errors.telefono && (
                <p className="text-xs text-red-600">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                placeholder="Santiago"
                {...register("ciudad")}
                aria-invalid={!!errors.ciudad}
              />
              {errors.ciudad && (
                <p className="text-xs text-red-600">{errors.ciudad.message}</p>
              )}
            </div>

            {/* Especialidad */}
            <div className="space-y-1.5">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                placeholder="Ej: Electricidad, Gasfitería..."
                {...register("especialidad")}
                aria-invalid={!!errors.especialidad}
              />
              {errors.especialidad && (
                <p className="text-xs text-red-600">
                  {errors.especialidad.message}
                </p>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contratistas">Cancelar</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
