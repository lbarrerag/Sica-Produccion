"use client"

interface RoleGuardProps {
  roles: string[]
  userRole: string
  children: React.ReactNode
}

export default function RoleGuard({
  roles,
  userRole,
  children,
}: RoleGuardProps) {
  if (!roles.includes(userRole)) {
    return null
  }

  return <>{children}</>
}
