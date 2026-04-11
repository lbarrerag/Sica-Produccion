import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Role-based route protection
  const role = (req.auth?.user as { role?: string } | undefined)?.role

  if (pathname.startsWith("/admin") && role !== "ADMINISTRADOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  const adminOrSupervisor = ["ADMINISTRADOR", "SUPERVISOR"]
  const supervisorRoutes = ["/obras", "/trabajadores", "/reportes", "/contratistas", "/especialidades"]
  if (
    supervisorRoutes.some((r) => pathname.startsWith(r)) &&
    role === "REGISTRO_MARCA"
  ) {
    return NextResponse.redirect(new URL("/registro", req.url))
  }

  if (pathname.startsWith("/registro") && role && !["REGISTRO_MARCA", "ADMINISTRADOR"].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
