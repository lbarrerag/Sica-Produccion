import { requireRole } from "@/lib/auth-utils"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole("ADMINISTRADOR")
  return <>{children}</>
}
