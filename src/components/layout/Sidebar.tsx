"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import Image from "next/image"
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
  Upload,
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
  importar: {
    label: "Importar Historial",
    href: "/admin/importar",
    icon: <Upload size={18} />,
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
    ALL_NAV_ITEMS.importar,
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
      className="fixed left-0 top-0 h-full w-[240px] bg-[#085c4e] flex flex-col z-30"
      aria-label="Navegación principal"
    >
      {/* Encabezado / Marca */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#0b6b5d]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 shrink-0 overflow-hidden">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="object-contain w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <span className="block font-bold text-white text-sm leading-tight">
            SICA
          </span>
          <span className="block text-[10px] text-[#a7d4c9] leading-tight truncate">
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
                      ? "bg-[#0b6b5d] text-white"
                      : "text-[#cce8e4] hover:bg-[#0b6b5d]/70 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={active ? "text-white" : "text-[#7dbfb4]"}
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
      <div className="border-t border-[#0b6b5d] px-3 py-3 space-y-1">
        {/* Info usuario */}
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-[11px] text-[#a7d4c9] truncate">
            {ROLE_LABELS[role] ?? role}
          </p>
        </div>

        {/* Botón cerrar sesión */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[#cce8e4] transition-colors hover:bg-red-900/40 hover:text-red-300 group"
        >
          <LogOut
            size={18}
            className="text-[#7dbfb4] group-hover:text-red-300 transition-colors"
            aria-hidden="true"
          />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
