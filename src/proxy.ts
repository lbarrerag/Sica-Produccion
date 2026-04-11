import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const RUTAS_PUBLICAS = ["/login"]

export const proxy = auth((req: NextRequest & { auth?: { user?: { role?: string } } }) => {
  const { pathname } = req.nextUrl
  const esPublica = RUTAS_PUBLICAS.some((p) => pathname.startsWith(p))

  if (!req.auth && !esPublica) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const role = req.auth?.user?.role

  if (pathname.startsWith("/admin") && role !== "ADMINISTRADOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const rutasSupervisor = ["/obras", "/trabajadores", "/reportes", "/contratistas", "/especialidades"]
  if (rutasSupervisor.some((r) => pathname.startsWith(r)) && role === "REGISTRO_MARCA") {
    return NextResponse.redirect(new URL("/registro", req.url))
  }

  if (
    pathname.startsWith("/registro") &&
    role &&
    !["REGISTRO_MARCA", "ADMINISTRADOR"].includes(role)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
