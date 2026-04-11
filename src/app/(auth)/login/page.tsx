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
    <div className="w-full max-w-md">
      {/* Logo / Título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E40AF] mb-4">
          <svg
            className="w-9 h-9 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold text-[#0F172A]"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          SICA
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Sistema de Control de Acceso
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] p-8">
        <h2
          className="text-xl font-semibold text-[#0F172A] mb-6"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Error global */}
          {loginError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {loginError}
            </div>
          )}

          {/* Usuario */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-[#0F172A] mb-1.5"
            >
              Usuario
            </label>
            <input
              id="userName"
              type="text"
              autoComplete="username"
              autoFocus
              {...register("userName")}
              className="w-full rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 disabled:opacity-50"
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#0F172A] mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full rounded-[6px] border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 disabled:opacity-50"
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
            className="w-full rounded-[6px] bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Ingresando…
              </span>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#64748B] mt-6">
        © {new Date().getFullYear()} SICA — Sistema de Control de Acceso
      </p>
    </div>
  )
}
