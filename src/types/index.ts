import type { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role: UserRole
    passwordVigente: boolean
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: UserRole
      passwordVigente: boolean
    }
  }
  interface JWT {
    role: UserRole
    passwordVigente: boolean
  }
}
