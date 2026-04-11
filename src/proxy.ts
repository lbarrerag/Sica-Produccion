import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextAuthRequest } from "next-auth"

const RUTAS_PUBLICAS = ["/login", "/api/auth"]

export const proxy = auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const esPublica = RUTAS_PUBLICAS.some((p) => pathname.startsWith(p))
  const session = req.auth
  // NextAuth v5 beta returns {} (empty object) instead of null when there's no session.
  // Use session?.user to distinguish authenticated vs unauthenticated requests.
  const user = session?.user
  const role = (user as { role?: string } | undefined)?.role

  if (!user && !esPublica) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

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
