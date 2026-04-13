/** Offset de Chile en horas (positivo): UTC-4 en invierno, UTC-3 en verano */
export function chileOffsetHoras(d: Date = new Date()): number {
  const mes = d.getUTCMonth() + 1
  const dia = d.getUTCDate()
  const invierno =
    (mes > 4 && mes < 10) ||
    (mes === 4 && dia >= 6) ||
    (mes === 10 && dia < 6)
  return invierno ? 4 : 3
}

/** Medianoche de hoy en hora Chile, expresada en UTC */
export function chileInicioHoy(): Date {
  const ahora = new Date()
  const offset = chileOffsetHoras(ahora)
  const chileAhora = new Date(ahora.getTime() - offset * 3_600_000)
  return new Date(
    Date.UTC(
      chileAhora.getUTCFullYear(),
      chileAhora.getUTCMonth(),
      chileAhora.getUTCDate()
    ) + offset * 3_600_000
  )
}

/** Fecha "YYYY-MM-DD" de un timestamp en hora Chile */
export function fechaEnChile(d: Date): string {
  const offset = chileOffsetHoras(d)
  const local = new Date(d.getTime() - offset * 3_600_000)
  return local.toISOString().slice(0, 10)
}

/** Inicio de un día "YYYY-MM-DD" (hora Chile) expresado en UTC */
export function chileInicioDelDia(fechaStr: string): Date {
  const base = new Date(`${fechaStr}T00:00:00Z`)
  const offset = chileOffsetHoras(base)
  return new Date(base.getTime() + offset * 3_600_000)
}

/** Fin de un día "YYYY-MM-DD" (hora Chile) expresado en UTC */
export function chileFinDelDia(fechaStr: string): Date {
  return new Date(chileInicioDelDia(fechaStr).getTime() + 24 * 3_600_000 - 1)
}
