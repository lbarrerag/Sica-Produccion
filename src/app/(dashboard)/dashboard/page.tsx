import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import { Building2, ClipboardList, Users } from "lucide-react"
import StatsCard from "@/components/dashboard/StatsCard"
import AccesosRecientes from "@/components/dashboard/AccesosRecientes"

export type FilaAcceso = {
  id: number
  fechaRegistro: string
  identificador: string
  nombre: string
  obra: string
  centroCosto: string | null
  contratista: string | null
  fechaIngreso: string | null
  fechaSalida: string | null
}

export default async function DashboardPage() {
  await requireAuth()

  const hoy = new Date()
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)

  // Tomamos los últimos 500 registros para agrupar y obtener 10 filas pivoteadas
  const [totalObras, totalRegistrosHoy, totalTrabajadores, rawRegistros] =
    await Promise.all([
      prisma.obra.count({ where: { estado: "VIGENTE" } }),
      prisma.registroAcceso.count({ where: { fechaHora: { gte: inicioDia } } }),
      prisma.trabajador.count({ where: { estado: "VIGENTE" } }),
      prisma.registroAcceso.findMany({
        take: 500,
        orderBy: { fechaHora: "desc" },
        include: {
          trabajador: { select: { nombre: true } },
          obra: { select: { nombre: true, centroCosto: true } },
          contratista: { select: { nombre: true } },
        },
      }),
    ])

  // Agrupar por (identificador, obraId, día) — mismo patrón que reportes
  const mapa = new Map<string, FilaAcceso>()

  for (const r of rawRegistros) {
    const dia = r.fechaHora.toISOString().slice(0, 10)
    const clave = `${r.identificador}||${r.obraId}||${dia}`

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        id: r.id,
        fechaRegistro: dia,
        identificador: r.identificador,
        nombre: r.trabajador.nombre,
        obra: r.obra.nombre,
        centroCosto: r.obra.centroCosto ?? null,
        contratista: r.contratista?.nombre ?? null,
        fechaIngreso: null,
        fechaSalida: null,
      })
    }

    const fila = mapa.get(clave)!
    if (r.tipo === "ENTRADA") {
      // Primera entrada del día (los registros vienen desc, así que sobreescribimos para quedarnos con la más temprana)
      fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      // Última salida del día (primera en orden desc = la más reciente)
      if (!fila.fechaSalida) fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  // Ordenar por fecha desc y tomar los 10 primeros grupos
  const ultimosAccesos = Array.from(mapa.values())
    .sort((a, b) => {
      const ultA = a.fechaSalida ?? a.fechaIngreso ?? ""
      const ultB = b.fechaSalida ?? b.fechaIngreso ?? ""
      return ultB.localeCompare(ultA)
    })
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Panel Principal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del sistema de control de acceso
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          titulo="Obras Activas"
          valor={totalObras}
          icono={<Building2 className="h-6 w-6 text-blue-600" />}
        />
        <StatsCard
          titulo="Registros Hoy"
          valor={totalRegistrosHoy}
          icono={<ClipboardList className="h-6 w-6 text-green-600" />}
        />
        <StatsCard
          titulo="Trabajadores"
          valor={totalTrabajadores}
          icono={<Users className="h-6 w-6 text-purple-600" />}
        />
      </div>

      {/* Últimos accesos */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Últimos Accesos
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Los 10 registros de acceso más recientes
          </p>
        </div>
        <AccesosRecientes registros={ultimosAccesos} />
      </div>
    </div>
  )
}
