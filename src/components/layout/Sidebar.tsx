"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  Briefcase,
  Users,
  Star,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const ALL_NAV_ITEMS = {
  dashboard: {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  registro: {
    label: "Registro",
    href: "/registro",
    icon: <ClipboardCheck size={18} />,
  },
  obras: {
    label: "Obras",
    href: "/obras",
    icon: <Building2 size={18} />,
  },
  contratistas: {
    label: "Contratistas",
    href: "/contratistas",
    icon: <Briefcase size={18} />,
  },
  trabajadores: {
    label: "Trabajadores",
    href: "/trabajadores",
    icon: <Users size={18} />,
  },
  especialidades: {
    label: "Especialidades",
    href: "/especialidades",
    icon: <Star size={18} />,
  },
  reportes: {
    label: "Reportes",
    href: "/reportes",
    icon: <BarChart2 size={18} />,
  },
  admin: {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: <Settings size={18} />,
  },
} as const

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  ADMINISTRADOR: [
    ALL_NAV_ITEMS.dashboard,
    ALL_NAV_ITEMS.registro,
    ALL_NAV_ITEMS.obras,
    ALL_NAV_ITEMS.contratistas,
    ALL_NAV_ITEMS.trabajadores,
    ALL_NAV_ITEMS.especialidades,
    ALL_NAV_ITEMS.reportes,
    ALL_NAV_ITEMS.admin,
  ],
  SUPERVISOR: [
    ALL_NAV_ITEMS.dashboard,
    ALL_NAV_ITEMS.obras,
    ALL_NAV_ITEMS.trabajadores,
    ALL_NAV_ITEMS.reportes,
  ],
  REGISTRO_MARCA: [ALL_NAV_ITEMS.registro],
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  SUPERVISOR: "Supervisor",
  REGISTRO_MARCA: "Registro de Marca",
  API: "API",
}

interface SidebarProps {
  role: string
  userName: string
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const navItems = NAV_BY_ROLE[role] ?? []

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col z-30"
      aria-label="Navegación principal"
    >
      {/* Encabezado / Marca */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1E40AF] shrink-0">
          <svg
            className="w-4.5 h-4.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <span
            className="block font-bold text-[#0F172A] text-sm leading-tight"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            SICA
          </span>
          <span className="block text-[10px] text-[#64748B] leading-tight truncate">
            Control de Acceso
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-100 text-blue-800"
                      : "text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#1E40AF]",
                  ].join(" ")}
                >
                  <span
                    className={active ? "text-blue-700" : "text-[#64748B]"}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pie: usuario + cerrar sesión */}
      <div className="border-t border-[#E2E8F0] px-3 py-3 space-y-1">
        {/* Info usuario */}
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-[#0F172A] truncate">{userName}</p>
          <p className="text-[11px] text-[#64748B] truncate">
            {ROLE_LABELS[role] ?? role}
          </p>
        </div>

        {/* Botón cerrar sesión */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-red-50 hover:text-red-700 group"
        >
          <LogOut
            size={18}
            className="text-[#64748B] group-hover:text-red-600 transition-colors"
            aria-hidden="true"
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
