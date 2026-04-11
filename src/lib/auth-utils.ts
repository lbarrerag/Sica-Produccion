import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { UserRole } from "@prisma/client"

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: UserRole
  passwordVigente: boolean
}

export async function getServerUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getServerUser()
  if (!user) redirect("/login")
  return user
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) redirect("/dashboard")
  return user
}

export function hasRole(user: SessionUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role)
}
