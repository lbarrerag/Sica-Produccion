import { signOut } from "@/lib/auth"

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor",
  REGISTRO_MARCA: "Registro de Marca",
  API: "API",
}

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  ADMINISTRADOR: { bg: "bg-blue-100", text: "text-blue-800" },
  SUPERVISOR: { bg: "bg-purple-100", text: "text-purple-800" },
  REGISTRO_MARCA: { bg: "bg-green-100", text: "text-green-800" },
  API: { bg: "bg-slate-100", text: "text-slate-700" },
}

interface HeaderProps {
  userName: string
  role: string
}

export default function Header({ userName, role }: HeaderProps) {
  const roleLabel = ROLE_LABELS[role] ?? role
  const roleColor = ROLE_COLORS[role] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
  }

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-white border-b border-[#E2E8F0] px-6">
      {/* Lado izquierdo: podría contener breadcrumb o título de página */}
      <div />

      {/* Lado derecho: info de usuario y logout */}
      <div className="flex items-center gap-4">
        {/* Nombre y rol */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#0F172A] leading-tight">
              {userName}
            </p>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              roleColor.bg,
              roleColor.text,
            ].join(" ")}
          >
            {roleLabel}
          </span>
        </div>

        {/* Divisor */}
        <div className="h-5 w-px bg-[#E2E8F0]" aria-hidden="true" />

        {/* Botón cerrar sesión (server action) */}
        <form action={handleSignOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  )
}
