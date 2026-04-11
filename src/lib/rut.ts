/**
 * Formatea un RUT chileno a formato con puntos y guión: 12.345.678-9
 */
export function formatRUT(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase()
  if (clean.length < 2) return clean

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted}-${dv}`
}

/**
 * Limpia el RUT dejando solo dígitos y K sin puntos ni guión
 */
export function cleanRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase()
}

/**
 * Valida el dígito verificador de un RUT chileno
 */
export function validateRUT(rut: string): boolean {
  const clean = cleanRUT(rut)
  if (clean.length < 2) return false

  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  let expectedDV: string
  if (remainder === 11) expectedDV = "0"
  else if (remainder === 10) expectedDV = "K"
  else expectedDV = String(remainder)

  return dv === expectedDV
}

/**
 * Normaliza el RUT a formato sin puntos, con guión: 12345678-9
 */
export function normalizeRUT(rut: string): string {
  const clean = cleanRUT(rut)
  if (clean.length < 2) return clean
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`
}
