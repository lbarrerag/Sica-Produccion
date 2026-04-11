export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — verde oscuro (estilo TicketIT) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#085c4e] flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradiente decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e7f6d] via-[#085c4e] to-[#0d3028]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#0e7f6d]/30 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />

        {/* Contenido relativo al fondo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">SICA</h1>
          <p className="text-[#a7d4c9] text-lg mb-10">
            Sistema de Control de Acceso
          </p>
          <ul className="space-y-4">
            {[
              "Registro de entrada y salida de trabajadores",
              "Gestión de contratistas y obras",
              "Control de especialidades y accesos",
              "Reportes y trazabilidad completa",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[#cce8e4] text-sm">
                <span className="w-5 h-5 rounded-full bg-[#a7ca29]/80 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-[#7dbfb4] text-xs">© {new Date().getFullYear()} SICA</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        {children}
      </div>
    </div>
  )
}
