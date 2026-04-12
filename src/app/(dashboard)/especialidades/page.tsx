import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { ImportarExcel } from "@/components/ui/ImportarExcel"
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton"
import { Paginacion } from "@/components/ui/Paginacion"

const POR_PAGINA = 20

interface Props {
  searchParams: Promise<{ pagina?: string; q?: string }>
}

export default async function EspecialidadesPage({ searchParams }: Props) {
  await requireRole("ADMINISTRADOR")

  const { pagina, q } = await searchParams
  const paginaActual = Math.max(1, parseInt(pagina ?? "1", 10) || 1)
  const busqueda = q?.trim() ?? ""

  const where = {
    estado: "VIGENTE" as const,
    ...(busqueda
      ? { nombre: { contains: busqueda, mode: "insensitive" as const } }
      : {}),
  }

  const [total, especialidades] = await Promise.all([
    prisma.especialidad.count({ where }),
    prisma.especialidad.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (paginaActual - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Especialidades</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de especialidades disponibles en el sistema
          </p>
        </div>
        <ImportarExcel endpoint="/api/import/especialidades" label="Importar Excel" />
      </div>

      {/* Búsqueda */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar especialidad…"
          className="h-9 flex-1 max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0e7f6d]/40"
        />
        <button type="submit" className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Buscar</button>
        {busqueda && (
          <a href="/especialidades" className="inline-flex h-9 items-center rounded-md px-3 text-sm text-gray-500 hover:bg-gray-100">Limpiar</a>
        )}
      </form>

      {/* Formulario nueva especialidad */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Nueva Especialidad
        </h2>
        <form
          action={async (formData: FormData) => {
            "use server"
            const nombre = (formData.get("nombre") as string)?.trim()
            if (!nombre) return
            const { prisma: db } = await import("@/lib/db")
            await db.especialidad.create({
              data: { nombre },
            })
            revalidatePath("/especialidades")
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Electricista, Gasfiter, Soldador..."
              required
              maxLength={200}
              className="block h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Lista de especialidades */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Especialidades registradas
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {total}{" "}
            {total === 1 ? "especialidad vigente" : "especialidades vigentes"}
          </p>
        </div>

        {especialidades.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {busqueda ? `Sin resultados para "${busqueda}".` : "No hay especialidades registradas."}
          </div>
        ) : (
          <>
          <ul className="divide-y divide-gray-100">
            {especialidades.map((esp) => (
              <li
                key={esp.id}
                className="flex items-center justify-between px-6 py-3"
              >
                {/* Formulario inline de edición */}
                <form
                  action={async (formData: FormData) => {
                    "use server"
                    const nombre = (
                      formData.get("nombre") as string
                    )?.trim()
                    if (!nombre) return
                    const { prisma: db } = await import("@/lib/db")
                    await db.especialidad.update({
                      where: { id: esp.id },
                      data: { nombre },
                    })
                    revalidatePath("/especialidades")
                  }}
                  className="flex flex-1 items-center gap-3"
                >
                  <input
                    name="nombre"
                    defaultValue={esp.nombre}
                    maxLength={200}
                    required
                    className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-900 transition-colors hover:border-gray-200 focus:border-gray-300 focus:bg-gray-50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-7 items-center rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Guardar
                  </button>
                </form>

                {/* Botón eliminar (soft delete) */}
                <div className="ml-2">
                  <ConfirmDeleteButton
                    action={async () => {
                      "use server"
                      const { prisma: db } = await import("@/lib/db")
                      await db.especialidad.update({
                        where: { id: esp.id },
                        data: { estado: "ELIMINADO" },
                      })
                      const { revalidatePath: reval } = await import("next/cache")
                      reval("/especialidades")
                    }}
                    mensaje={`¿Está seguro de eliminar la especialidad "${esp.nombre}"?`}
                    className="inline-flex h-7 items-center rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </div>
              </li>
            ))}
          </ul>
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            total={total}
            por_pagina={POR_PAGINA}
            basePath="/especialidades"
            extraParams={busqueda ? `q=${encodeURIComponent(busqueda)}` : ""}
          />
          </>
        )}
      </div>
    </div>
  )
}
