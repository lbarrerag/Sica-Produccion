import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/db"
import {
  Building2,
  LogIn,
  LogOut,
  Users,
  AlertTriangle,
  TrendingDown,
} from "lucide-react"
import StatsCard from "@/components/dashboard/StatsCard"
import AccesosRecientes from "@/components/dashboard/AccesosRecientes"
import GraficoBarras from "@/components/dashboard/GraficoBarras"
import TopObras from "@/components/dashboard/TopObras"

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

export type DatoDia = {
  fecha: string
  total: number
}

export default async function DashboardPage() {
  await requireAuth()

  // ── Zona horaria Chile (UTC-3 aprox.) ──────────────────────────────────────
  const ahora = new Date()

  // Inicio del día en hora Chile: medianoche Chile = UTC+3h
  const inicioDia = new Date(
    Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate()
    ) -
      3 * 60 * 60 * 1000
  )

  const hace7dias  = new Date(ahora.getTime() - 7  * 24 * 60 * 60 * 1000)
  const hace14dias = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000)
  const hace10horas = new Date(ahora.getTime() - 10 * 60 * 60 * 1000)
  // Inicio de ayer en hora Chile
  const inicioAyer = new Date(inicioDia.getTime() - 24 * 60 * 60 * 1000)

  // ── Queries paralelas ──────────────────────────────────────────────────────
  const [
    obrasActivas,
    registrosHoyAll,
    rawUltimos500,
    registrosSemanaAnterior,
    activosEstaSemanaRaw,
    entradasHoyConTrabajador,
    topObrasHoyRaw,
    topObrasAyerRaw,
    topObrasSemanaRaw,
    datos14DiasRaw,
  ] = await Promise.all([
    // 1. Obras activas
    prisma.obra.count({ where: { estado: "VIGENTE" } }),

    // 2. Todos los registros de hoy (para dentro/ahora, ingresos y salidas)
    prisma.registroAcceso.findMany({
      where: { fechaHora: { gte: inicioDia } },
      orderBy: { fechaHora: "asc" },
      select: { trabajadorId: true, tipo: true },
    }),

    // 3. Últimos 500 registros para tabla accesos recientes
    prisma.registroAcceso.findMany({
      take: 500,
      orderBy: { fechaHora: "desc" },
      include: {
        trabajador: { select: { nombre: true } },
        obra: { select: { nombre: true, centroCosto: true } },
        contratista: { select: { nombre: true } },
      },
    }),

    // 4. Trabajadores activos semana anterior (hace 8-14 días)
    prisma.registroAcceso.findMany({
      where: { fechaHora: { gte: hace14dias, lt: hace7dias } },
      select: {
        trabajadorId: true,
        trabajador: { select: { nombre: true } },
      },
      distinct: ["trabajadorId"],
    }),

    // 5. Trabajadores activos esta semana
    prisma.registroAcceso.findMany({
      where: { fechaHora: { gte: hace7dias } },
      select: { trabajadorId: true },
      distinct: ["trabajadorId"],
    }),

    // 6. Entradas de hoy con nombre trabajador (para alertas permanencia)
    prisma.registroAcceso.findMany({
      where: {
        fechaHora: { gte: inicioDia },
        tipo: "ENTRADA",
      },
      orderBy: { fechaHora: "asc" },
      select: {
        trabajadorId: true,
        fechaHora: true,
        trabajador: { select: { nombre: true } },
      },
    }),

    // 7. Top obras hoy por ingresos
    prisma.registroAcceso.groupBy({
      by: ["obraId"],
      where: { fechaHora: { gte: inicioDia }, tipo: "ENTRADA" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),

    // 7b. Top obras ayer
    prisma.registroAcceso.groupBy({
      by: ["obraId"],
      where: { fechaHora: { gte: inicioAyer, lt: inicioDia }, tipo: "ENTRADA" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),

    // 7c. Top obras semana (últimos 7 días)
    prisma.registroAcceso.groupBy({
      by: ["obraId"],
      where: { fechaHora: { gte: hace7dias }, tipo: "ENTRADA" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),

    // 8. Conteo de registros por día — últimos 14 días
    prisma.registroAcceso.findMany({
      where: { fechaHora: { gte: hace14dias } },
      select: { fechaHora: true },
    }),
  ])

  // ── Trabajadores dentro ahora ──────────────────────────────────────────────
  const ultimoPorTrabajador = new Map<number, string>()
  for (const r of registrosHoyAll) {
    ultimoPorTrabajador.set(r.trabajadorId, r.tipo)
  }
  const trabajadoresAdentro = [...ultimoPorTrabajador.values()].filter(
    (t) => t === "ENTRADA"
  ).length

  // ── Ingresos y salidas hoy ─────────────────────────────────────────────────
  const ingresosHoy = registrosHoyAll.filter((r) => r.tipo === "ENTRADA").length
  const salidasHoy = registrosHoyAll.filter((r) => r.tipo === "SALIDA").length

  // ── Trabajadores que dejaron de trabajar ───────────────────────────────────
  const setActivosEstaSemana = new Set(
    activosEstaSemanaRaw.map((r) => r.trabajadorId)
  )
  const dejaronDeTrabajar = registrosSemanaAnterior.filter(
    (r) => !setActivosEstaSemana.has(r.trabajadorId)
  )

  // ── Alertas de permanencia (>10h sin salida) ───────────────────────────────
  // Agrupar entradas de hoy por trabajador — guardar la primera entrada
  const primeraEntradaPorTrabajador = new Map<
    number,
    { fechaHora: Date; nombre: string }
  >()
  for (const e of entradasHoyConTrabajador) {
    if (!primeraEntradaPorTrabajador.has(e.trabajadorId)) {
      primeraEntradaPorTrabajador.set(e.trabajadorId, {
        fechaHora: e.fechaHora,
        nombre: e.trabajador.nombre,
      })
    }
  }

  // Trabajadores cuya última marca hoy es ENTRADA (siguen adentro)
  const alertasPermananecia: Array<{
    nombre: string
    horaEntrada: Date
    horasAdentro: number
  }> = []

  for (const [trabajadorId, entrada] of primeraEntradaPorTrabajador) {
    const ultimaMarca = ultimoPorTrabajador.get(trabajadorId)
    if (ultimaMarca === "ENTRADA" && entrada.fechaHora <= hace10horas) {
      const horasAdentro = Math.floor(
        (ahora.getTime() - entrada.fechaHora.getTime()) / (1000 * 60 * 60)
      )
      alertasPermananecia.push({
        nombre: entrada.nombre,
        horaEntrada: entrada.fechaHora,
        horasAdentro,
      })
    }
  }
  alertasPermananecia.sort((a, b) => b.horasAdentro - a.horasAdentro)

  // ── Top obras — resolver nombres para los 3 períodos ─────────────────────
  async function resolverNombresObras(
    raw: Array<{ obraId: number; _count: { id: number } }>
  ) {
    if (raw.length === 0) return []
    const ids = raw.map((r) => r.obraId)
    const obras = await prisma.obra.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    })
    const obraMap = new Map(obras.map((o) => [o.id, o.nombre]))
    return raw.map((r) => ({
      nombre: obraMap.get(r.obraId) ?? `Obra ${r.obraId}`,
      ingresos: r._count.id,
    }))
  }

  const [topObrasHoy, topObrasAyer, topObrasSemana] = await Promise.all([
    resolverNombresObras(topObrasHoyRaw),
    resolverNombresObras(topObrasAyerRaw),
    resolverNombresObras(topObrasSemanaRaw),
  ])

  // ── Gráfico 14 días ────────────────────────────────────────────────────────
  // Agrupar por día en hora Chile (UTC-3)
  const conteosPorDia = new Map<string, number>()

  // Inicializar los últimos 14 días en hora Chile
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000)
    // Fecha en hora Chile
    const fechaChile = new Date(d.getTime() - 3 * 60 * 60 * 1000)
    const key = fechaChile.toISOString().slice(0, 10)
    conteosPorDia.set(key, 0)
  }

  for (const r of datos14DiasRaw) {
    const fechaChile = new Date(r.fechaHora.getTime() - 3 * 60 * 60 * 1000)
    const key = fechaChile.toISOString().slice(0, 10)
    if (conteosPorDia.has(key)) {
      conteosPorDia.set(key, (conteosPorDia.get(key) ?? 0) + 1)
    }
  }

  const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const datosGrafico: DatoDia[] = Array.from(conteosPorDia.entries()).map(
    ([fechaStr, total]) => {
      const [year, month, day] = fechaStr.split("-").map(Number)
      const d = new Date(year, month - 1, day)
      const diaSemana = DIAS_CORTOS[d.getDay()]
      const fecha = `${diaSemana} ${String(day).padStart(2, "0")}`
      return { fecha, total }
    }
  )

  // ── Tabla accesos recientes (misma lógica pivotada) ────────────────────────
  const mapa = new Map<string, FilaAcceso>()

  for (const r of rawUltimos500) {
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
      fila.fechaIngreso = r.fechaHora.toISOString()
    } else {
      if (!fila.fechaSalida) fila.fechaSalida = r.fechaHora.toISOString()
    }
  }

  const ultimosAccesos = Array.from(mapa.values())
    .sort((a, b) => {
      const ultA = a.fechaSalida ?? a.fechaIngreso ?? ""
      const ultB = b.fechaSalida ?? b.fechaIngreso ?? ""
      return ultB.localeCompare(ultA)
    })
    .slice(0, 10)

  // ── Helpers de formato ─────────────────────────────────────────────────────
  function fmtHora(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    const local = new Date(d.getTime() - 3 * 60 * 60 * 1000)
    return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Panel Principal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del sistema de control de acceso
        </p>
      </div>

      {/* ── Tarjetas top ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          titulo="Obras Activas"
          valor={obrasActivas}
          icono={<Building2 className="h-6 w-6 text-[#0e7f6d]" />}
        />
        <StatsCard
          titulo="Dentro Ahora"
          valor={trabajadoresAdentro}
          icono={<Users className="h-6 w-6 text-[#0e7f6d]" />}
        />
        <StatsCard
          titulo="Ingresos Hoy"
          valor={ingresosHoy}
          icono={<LogIn className="h-6 w-6 text-[#0e7f6d]" />}
        />
        <StatsCard
          titulo="Salidas Hoy"
          valor={salidasHoy}
          icono={<LogOut className="h-6 w-6 text-[#085c4e]" />}
        />
      </div>

      {/* ── Gráfico + Top obras ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico barras 14 días */}
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl">
            <h2 className="text-base font-semibold text-gray-900">
              Actividad — últimos 14 días
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Total de registros de acceso por día
            </p>
          </div>
          <div className="p-4">
            <GraficoBarras datos={datosGrafico} />
          </div>
        </div>

        {/* Top obras con selector Hoy / Ayer / Semana */}
        <TopObras hoy={topObrasHoy} ayer={topObrasAyer} semana={topObrasSemana} />
      </div>

      {/* ── Alertas + Dejaron de trabajar ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alertas permanencia >10h */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Alertas de permanencia
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Con ingreso hace más de 10 horas sin salida registrada
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {alertasPermananecia.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">
                Sin alertas activas
              </p>
            ) : (
              alertasPermananecia.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ingresó a las {fmtHora(a.horaEntrada)}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {a.horasAdentro}h adentro
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dejaron de trabajar esta semana */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Sin actividad esta semana
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Trabajaron la semana pasada pero no los últimos 7 días
              </p>
            </div>
          </div>
          <div className="px-6 py-4">
            {dejaronDeTrabajar.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                Ninguno
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {dejaronDeTrabajar.length}
                  </span>{" "}
                  trabajador{dejaronDeTrabajar.length !== 1 ? "es" : ""} sin
                  registros esta semana
                </p>
                <ul className="space-y-1">
                  {dejaronDeTrabajar.slice(0, 5).map((r, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      • {r.trabajador.nombre}
                    </li>
                  ))}
                  {dejaronDeTrabajar.length > 5 && (
                    <li className="text-sm text-gray-400 italic">
                      y {dejaronDeTrabajar.length - 5} más…
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabla accesos recientes ── */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 rounded-t-xl">
          <h2 className="text-base font-semibold text-gray-900">
            Últimos accesos
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
