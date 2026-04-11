"use client"

interface Props {
  action: () => Promise<void>
  mensaje: string
  className?: string
}

export function ConfirmDeleteButton({ action, mensaje, className }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(mensaje)) e.preventDefault()
        }}
        className={
          className ??
          "inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        }
      >
        Eliminar
      </button>
    </form>
  )
}
