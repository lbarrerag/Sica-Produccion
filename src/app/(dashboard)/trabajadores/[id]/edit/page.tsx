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

interface Contratista {
  id: number
  identificador: string
  nombre: string
}

const schema = z.object({
  identificador: z
    .string()
    .min(1, "El RUT es obligatorio")
    .max(20, "RUT inválido"),
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  contratistaId: z.string().optional(),
  identificadorContratista: z.string().optional(),
  nombreContratista: z.string().optional(),
  especialidad: z.string().max(200, "Máximo 200 caracteres").optional(),
  telefono: z.string().max(30, "Máximo 30 caracteres").optional(),
  direccion: z.string().max(300, "Máximo 300 caracteres").optional(),
  ciudad: z.string().max(100, "Máximo 100 caracteres").optional(),
})

type FormValues = z.infer<typeof schema>

export default function EditarTrabajadorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [contratistas, setContratistas] = useState<Contratista[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const contratistaIdWatch = watch("contratistaId")

  // Cargar contratistas y datos del trabajador en paralelo
  useEffect(() => {
    async function cargar() {
      try {
        const [resTrabajador, resContratistas] = await Promise.all([
          fetch(`/api/trabajadores/${id}`),
          fetch("/api/contratistas"),
        ])

        if (!resTrabajador.ok)
          throw new Error("No se encontró el trabajador")

        const [trabajador, listaContratistas] = await Promise.all([
          resTrabajador.json(),
          resContratistas.ok ? resContratistas.json() : [],
        ])

        setContratistas(listaContratistas)

        reset({
          identificador: trabajador.identificador ?? "",
          nombre: trabajador.nombre ?? "",
          contratistaId: trabajador.contratistaId
            ? String(trabajador.contratistaId)
            : "",
          identificadorContratista:
            trabajador.identificadorContratista ?? "",
          nombreContratista: trabajador.nombreContratista ?? "",
          especialidad: trabajador.especialidad ?? "",
          telefono: trabajador.telefono ?? "",
          direccion: trabajador.direccion ?? "",
          ciudad: trabajador.ciudad ?? "",
        })
      } catch (err) {
        setErrorCarga(
          err instanceof Error
            ? err.message
            : "Error al cargar el trabajador"
        )
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [id, reset])

  // Auto-rellenar datos del contratista al cambiar selección
  useEffect(() => {
    if (!contratistaIdWatch) {
      setValue("identificadorContratista", "")
      setValue("nombreContratista", "")
      return
    }
    const found = contratistas.find(
      (c) => String(c.id) === contratistaIdWatch
    )
    if (found) {
      setValue("identificadorContratista", found.identificador)
      setValue("nombreContratista", found.nombre)
    }
  }, [contratistaIdWatch, contratistas, setValue])

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        identificador: data.identificador.trim(),
        nombre: data.nombre.trim(),
        contratistaId: data.contratistaId
          ? parseInt(data.contratistaId, 10)
          : null,
        identificadorContratista:
          data.identificadorContratista?.trim() || null,
        nombreContratista: data.nombreContratista?.trim() || null,
        especialidad: data.especialidad?.trim() || null,
        telefono: data.telefono?.trim() || null,
        direccion: data.direccion?.trim() || null,
        ciudad: data.ciudad?.trim() || null,
      }

      const res = await fetch(`/api/trabajadores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? "Error al actualizar el trabajador")
      }

      toast.success("Trabajador actualizado correctamente")
      router.push(`/trabajadores/${id}`)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al actualizar el trabajador"
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
          <Link href="/trabajadores">Volver a Trabajadores</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Editar Trabajador
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Modifique los datos del trabajador
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 max-w-2xl"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* RUT */}
            <div className="space-y-1.5">
              <Label htmlFor="identificador">
                RUT <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identificador"
                placeholder="Ej: 12.345.678-9"
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
                Nombre completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Nombre del trabajador"
                {...register("nombre")}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && (
                <p className="text-xs text-red-600">{errors.nombre.message}</p>
              )}
            </div>

            {/* Contratista */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="contratistaId">Contratista</Label>
              <select
                id="contratistaId"
                {...register("contratistaId")}
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sin contratista —</option>
                {contratistas.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Identificador contratista (auto-rellenado) */}
            <div className="space-y-1.5">
              <Label htmlFor="identificadorContratista">
                RUT del contratista
              </Label>
              <Input
                id="identificadorContratista"
                readOnly
                placeholder="Se completa automáticamente"
                {...register("identificadorContratista")}
                className="bg-gray-50 text-gray-500"
              />
            </div>

            {/* Nombre contratista (auto-rellenado) */}
            <div className="space-y-1.5">
              <Label htmlFor="nombreContratista">
                Nombre del contratista
              </Label>
              <Input
                id="nombreContratista"
                readOnly
                placeholder="Se completa automáticamente"
                {...register("nombreContratista")}
                className="bg-gray-50 text-gray-500"
              />
            </div>

            {/* Especialidad */}
            <div className="space-y-1.5">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                placeholder="Ej: Electricista, Gasfiter..."
                {...register("especialidad")}
                aria-invalid={!!errors.especialidad}
              />
              {errors.especialidad && (
                <p className="text-xs text-red-600">
                  {errors.especialidad.message}
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

            {/* Dirección */}
            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Dirección del trabajador"
                {...register("direccion")}
                aria-invalid={!!errors.direccion}
              />
              {errors.direccion && (
                <p className="text-xs text-red-600">
                  {errors.direccion.message}
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
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/trabajadores/${id}`}>Cancelar</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
