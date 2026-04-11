"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
  centroCosto: z.string().max(100, "Máximo 100 caracteres").optional(),
})

type FormValues = z.infer<typeof schema>

export default function NuevaObraPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", centroCosto: "" },
  })

  async function onSubmit(data: FormValues) {
    try {
      const res = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre.trim(),
          centroCosto: data.centroCosto?.trim() || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al crear la obra")
      }

      toast.success("Obra creada correctamente")
      router.push("/obras")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear la obra")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nueva Obra</h1>
        <p className="mt-1 text-sm text-gray-500">
          Complete los datos para registrar una nueva obra
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Nombre de la obra"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && (
              <p className="text-xs text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          {/* Centro Costo */}
          <div className="space-y-1.5">
            <Label htmlFor="centroCosto">Centro de Costo</Label>
            <Input
              id="centroCosto"
              placeholder="Ej: CC-001 (opcional)"
              {...register("centroCosto")}
              aria-invalid={!!errors.centroCosto}
            />
            {errors.centroCosto && (
              <p className="text-xs text-red-600">{errors.centroCosto.message}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear Obra"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/obras">Cancelar</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
