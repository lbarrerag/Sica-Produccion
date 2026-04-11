"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  userName: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setLoginError(null)

    try {
      const result = await signIn("credentials", {
        userName: data.userName,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError("Usuario o contraseña incorrectos")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setLoginError("Ocurrió un error al iniciar sesión. Inténtelo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0F172A]">Bienvenido</h2>
        <p className="text-sm text-[#64748B] mt-1">
          Ingresa tus credenciales para continuar.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Error global */}
        {loginError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {loginError}
          </div>
        )}

        {/* Usuario */}
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-[#374151] mb-1.5">
            Usuario
          </label>
          <input
            id="userName"
            type="text"
            autoComplete="username"
            autoFocus
            {...register("userName")}
            className="w-full rounded-lg border border-[#D1FAE5] bg-[#F0FDF4] px-3 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition focus:border-[#0e7f6d] focus:ring-2 focus:ring-[#0e7f6d]/20 focus:bg-white disabled:opacity-50"
            placeholder="Ingrese su usuario"
            disabled={isLoading}
            aria-invalid={!!errors.userName}
            aria-describedby={errors.userName ? "userName-error" : undefined}
          />
          {errors.userName && (
            <p id="userName-error" className="mt-1.5 text-xs text-red-600">
              {errors.userName.message}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1.5">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-lg border border-[#D1FAE5] bg-[#F0FDF4] px-3 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition focus:border-[#0e7f6d] focus:ring-2 focus:ring-[#0e7f6d]/20 focus:bg-white disabled:opacity-50"
            placeholder="Ingrese su contraseña"
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#0e7f6d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#085c4e] focus:outline-none focus:ring-2 focus:ring-[#0e7f6d] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Ingresando…
            </span>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>
    </div>
  )
}
