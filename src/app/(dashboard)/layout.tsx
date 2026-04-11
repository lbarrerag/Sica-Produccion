import { requireAuth } from "@/lib/auth-utils"
import Sidebar from "@/components/layout/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} userName={user.name ?? user.id} />
      <main className="flex-1 min-w-0 ml-[240px]">
        <div className="mx-auto max-w-[1280px] p-6">{children}</div>
      </main>
    </div>
  )
}
