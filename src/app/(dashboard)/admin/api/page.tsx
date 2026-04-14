"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ApiUser {
  id: string
  userName: string
  email: string | null
  estado: string
  apiKey: string | null
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  function copiar() {
    navigator.clipboard.writeText(code)
    toast.success("Copiado al portapapeles")
  }
  return (
    <div className="relative group">
      <pre className={`language-${language} rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto`}>
        <code>{code}</code>
      </pre>
      <button
        onClick={copiar}
        className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
      >
        Copiar
      </button>
    </div>
  )
}

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "red" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}

function EndpointCard({
  method,
  path,
  description,
  params,
  bodyExample,
  responseExample,
  notes,
}: {
  method: "GET" | "POST"
  path: string
  description: string
  params?: { name: string; tipo: string; required: boolean; desc: string }[]
  bodyExample?: string
  responseExample: string
  notes?: string
}) {
  const methodColor = method === "GET" ? "green" : "blue"
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
        <Badge color={methodColor}>{method}</Badge>
        <code className="text-sm font-mono font-semibold text-gray-800">{path}</code>
      </div>
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {params && params.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {method === "GET" ? "Query params" : "Body (JSON)"}
            </p>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Campo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Req.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {params.map((p) => (
                    <tr key={p.name}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-800">{p.name}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{p.tipo}</td>
                      <td className="px-3 py-2">
                        {p.required
                          ? <Badge color="red">Sí</Badge>
                          : <span className="text-xs text-gray-400">No</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {bodyExample && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ejemplo de request</p>
            <CodeBlock code={bodyExample} language="json" />
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ejemplo de respuesta</p>
          <CodeBlock code={responseExample} language="json" />
        </div>

        {notes && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-xs text-yellow-800">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApiDocPage() {
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([])
  const [cargando, setCargando] = useState(true)
  const [regenerando, setRegenerando] = useState<string | null>(null)
  const [keysVisibles, setKeysVisibles] = useState<Set<string>>(new Set())

  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://sica.azurewebsites.net"

  useEffect(() => {
    cargarUsuariosApi()
  }, [])

  async function cargarUsuariosApi() {
    try {
      const res = await fetch("/api/admin/usuarios")
      const users: ApiUser[] = await res.json()
      setApiUsers((users as (ApiUser & { role: string })[]).filter((u) => u.estado !== "ELIMINADO" && u.role === "API"))
    } catch {
      // silencioso
    } finally {
      setCargando(false)
    }
  }

  async function regenerarKey(userId: string) {
    setRegenerando(userId)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      const { apiKey } = await res.json()
      setApiUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, apiKey } : u))
      )
      setKeysVisibles((prev) => new Set([...prev, userId]))
      toast.success("API Key regenerada correctamente")
    } catch {
      toast.error("Error al regenerar la API Key")
    } finally {
      setRegenerando(null)
    }
  }

  function toggleVerKey(userId: string) {
    setKeysVisibles((prev) => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const curlBuscar = `curl -X GET \\
  "${BASE_URL}/api/v1/registro/buscar?rut=12345678-9&obraId=1" \\
  -H "Authorization: Bearer TU_API_KEY"`

  const curlRegistro = `curl -X POST \\
  "${BASE_URL}/api/v1/registro" \\
  -H "Authorization: Bearer TU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"rut": "12345678-9", "obraId": 1, "tipo": "ENTRADA"}'`

  const curlObras = `curl -X GET \\
  "${BASE_URL}/api/v1/obras" \\
  -H "Authorization: Bearer TU_API_KEY"`

  const jsFetch = `const apiKey = "TU_API_KEY"
const baseUrl = "${BASE_URL}"

// 1. Buscar trabajador
const buscar = await fetch(\`\${baseUrl}/api/v1/registro/buscar?rut=12345678-9&obraId=1\`, {
  headers: { Authorization: \`Bearer \${apiKey}\` }
})
const trabajador = await buscar.json()
console.log(trabajador.accionSugerida) // "ENTRADA" | "SALIDA"

// 2. Registrar acceso
const registro = await fetch(\`\${baseUrl}/api/v1/registro\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    rut: "12345678-9",
    obraId: 1,
    tipo: trabajador.accionSugerida,
  }),
})
const resultado = await registro.json()
console.log(resultado) // { success: true, registro: { id, tipo, fechaHora, trabajador } }`

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API de SICA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Documentación para integrar sistemas externos con SICA via API REST
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/new">Crear usuario API</Link>
        </Button>
      </div>

      {/* Usuarios API */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Credenciales activas</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Usuarios con rol API y sus tokens de acceso
          </p>
        </div>
        <div className="px-6 py-4">
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : apiUsers.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No hay usuarios API creados.</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/admin/usuarios/new">Crear primer usuario API</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {apiUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{u.userName}</p>
                    {u.email && <p className="text-xs text-gray-500">{u.email}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {u.apiKey ? (
                      <>
                        <code className="rounded bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-800 max-w-xs truncate">
                          {keysVisibles.has(u.id) ? u.apiKey : "•".repeat(20)}
                        </code>
                        <button
                          onClick={() => toggleVerKey(u.id)}
                          className="text-xs text-blue-600 hover:underline shrink-0"
                        >
                          {keysVisibles.has(u.id) ? "Ocultar" : "Ver"}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(u.apiKey!)
                            toast.success("API Key copiada")
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
                        >
                          Copiar
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin key generada</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerarKey(u.id)}
                      disabled={regenerando === u.id}
                    >
                      {regenerando === u.id ? "..." : "Regenerar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Autenticación */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Autenticación</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Todas las solicitudes deben incluir el header <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">Authorization</code> con el Bearer token:
          </p>
          <CodeBlock code={`Authorization: Bearer TU_API_KEY`} />
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs text-blue-800">
              Los usuarios API pueden tener obras asignadas. Si tienen obras asignadas, solo podrán registrar accesos en esas obras. Crea el usuario con rol <strong>API</strong> desde la sección de usuarios y asígnale las obras correspondientes.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Endpoints</h2>

        <EndpointCard
          method="GET"
          path="/api/v1/obras"
          description="Lista las obras disponibles para la API key. Si el usuario tiene obras asignadas, solo retorna esas."
          responseExample={`[
  { "id": 1, "nombre": "Edificio Central", "centroCosto": "CC-001" },
  { "id": 2, "nombre": "Planta Norte", "centroCosto": null }
]`}
        />

        <EndpointCard
          method="GET"
          path="/api/v1/registro/buscar"
          description="Busca un trabajador por RUT y retorna su información junto al último registro de acceso. Útil para determinar si debe registrar ENTRADA o SALIDA."
          params={[
            { name: "rut", tipo: "string", required: true, desc: "RUT del trabajador, ej: 12345678-9" },
            { name: "obraId", tipo: "number", required: false, desc: "ID de obra para contextualizar el último registro" },
          ]}
          responseExample={`{
  "id": 42,
  "nombre": "Juan Pérez González",
  "identificador": "12345678-9",
  "nombreContratista": "Constructora XYZ",
  "especialidad": "Electricista",
  "ultimoRegistro": {
    "tipo": "ENTRADA",
    "fechaHora": "2026-04-13T08:30:00.000Z"
  },
  "accionSugerida": "SALIDA"
}`}
          notes='Si el trabajador no tiene registros previos, "ultimoRegistro" será null y "accionSugerida" será "ENTRADA".'
        />

        <EndpointCard
          method="POST"
          path="/api/v1/registro"
          description="Registra una entrada o salida de un trabajador en una obra. Usa la hora actual del servidor como fecha/hora del registro."
          params={[
            { name: "rut", tipo: "string", required: true, desc: "RUT del trabajador, ej: 12345678-9" },
            { name: "obraId", tipo: "number", required: true, desc: "ID de la obra donde se registra el acceso" },
            { name: "tipo", tipo: '"ENTRADA" | "SALIDA"', required: true, desc: "Tipo de acceso a registrar" },
          ]}
          bodyExample={`{
  "rut": "12345678-9",
  "obraId": 1,
  "tipo": "ENTRADA"
}`}
          responseExample={`{
  "success": true,
  "registro": {
    "id": 1503,
    "tipo": "ENTRADA",
    "fechaHora": "2026-04-13T09:15:42.123Z",
    "trabajador": {
      "nombre": "Juan Pérez González"
    }
  }
}`}
          notes="El trabajador debe estar en estado VIGENTE. Retorna error 404 si no existe."
        />

        <EndpointCard
          method="POST"
          path="/api/v1/registro/manual"
          description="Registra una entrada o salida con fecha y hora específica. Útil para importar registros históricos o sincronizar desde dispositivos externos."
          params={[
            { name: "rut", tipo: "string", required: true, desc: "RUT del trabajador, ej: 12345678-9" },
            { name: "obraId", tipo: "number", required: true, desc: "ID de la obra donde se registra el acceso" },
            { name: "tipo", tipo: '"ENTRADA" | "SALIDA"', required: true, desc: "Tipo de acceso a registrar" },
            { name: "fechaHora", tipo: "string (ISO 8601)", required: true, desc: "Fecha y hora exacta del registro. Ej: 2026-04-13T09:15:00" },
          ]}
          bodyExample={`{
  "rut": "12345678-9",
  "obraId": 1,
  "tipo": "ENTRADA",
  "fechaHora": "2026-04-13T09:15:00"
}`}
          responseExample={`{
  "success": true,
  "registro": {
    "id": 1504,
    "tipo": "ENTRADA",
    "fechaHora": "2026-04-13T09:15:00.000Z",
    "trabajador": {
      "nombre": "Juan Pérez González"
    }
  }
}`}
          notes="El campo fechaHora es obligatorio y debe ser una fecha ISO 8601 válida. Retorna error 400 si el formato es inválido."
        />

        {/* ── Trabajadores ── */}
        <h2 className="text-lg font-semibold text-gray-900 pt-4">Trabajadores</h2>

        <EndpointCard
          method="POST"
          path="/api/v1/trabajadores"
          description="Crea un trabajador nuevo. Si el RUT ya existe, reactiva al trabajador y actualiza sus datos."
          params={[
            { name: "rut", tipo: "string", required: true, desc: "RUT del trabajador, ej: 12345678-9" },
            { name: "nombre", tipo: "string", required: true, desc: "Nombre completo del trabajador" },
            { name: "contratistaRut", tipo: "string", required: false, desc: "RUT del contratista al que pertenece" },
            { name: "especialidad", tipo: "string", required: false, desc: "Especialidad u oficio del trabajador" },
            { name: "direccion", tipo: "string", required: false, desc: "Dirección del trabajador" },
            { name: "ciudad", tipo: "string", required: false, desc: "Ciudad del trabajador" },
            { name: "telefono", tipo: "string", required: false, desc: "Teléfono de contacto" },
            { name: "idExterno", tipo: "number", required: false, desc: "ID en sistema externo para trazabilidad" },
          ]}
          bodyExample={`{
  "rut": "12345678-9",
  "nombre": "Juan Pérez González",
  "contratistaRut": "76543210-1",
  "especialidad": "Electricista",
  "ciudad": "Santiago"
}`}
          responseExample={`{
  "success": true,
  "trabajador": {
    "id": 842,
    "identificador": "12345678-9",
    "nombre": "Juan Pérez González",
    "estado": "VIGENTE",
    "especialidad": "Electricista",
    "contratistaId": 5,
    "nombreContratista": "Constructora XYZ"
  }
}`}
          notes="Si el RUT ya existe en el sistema, se actualiza con los nuevos datos y se reactiva (estado VIGENTE)."
        />

        <EndpointCard
          method="PUT"
          path="/api/v1/trabajadores/:rut"
          description="Actualiza los datos de un trabajador existente. Solo se modifican los campos enviados."
          params={[
            { name: "nombre", tipo: "string", required: false, desc: "Nombre completo del trabajador" },
            { name: "estado", tipo: '"VIGENTE" | "NO_VIGENTE"', required: false, desc: "Estado del trabajador" },
            { name: "contratistaRut", tipo: "string", required: false, desc: "RUT del nuevo contratista asignado" },
            { name: "especialidad", tipo: "string", required: false, desc: "Especialidad u oficio" },
            { name: "direccion", tipo: "string", required: false, desc: "Dirección" },
            { name: "ciudad", tipo: "string", required: false, desc: "Ciudad" },
            { name: "telefono", tipo: "string", required: false, desc: "Teléfono" },
            { name: "idExterno", tipo: "number", required: false, desc: "ID en sistema externo" },
          ]}
          bodyExample={`{
  "estado": "NO_VIGENTE",
  "especialidad": "Gasfiter"
}`}
          responseExample={`{
  "success": true,
  "trabajador": {
    "id": 842,
    "identificador": "12345678-9",
    "nombre": "Juan Pérez González",
    "estado": "NO_VIGENTE",
    "especialidad": "Gasfiter",
    "contratistaId": 5,
    "nombreContratista": "Constructora XYZ",
    "ciudad": "Santiago"
  }
}`}
          notes="Retorna error 404 si el RUT no existe. El RUT va en la URL: PUT /api/v1/trabajadores/12345678-9"
        />

        {/* ── Contratistas ── */}
        <h2 className="text-lg font-semibold text-gray-900 pt-4">Contratistas</h2>

        <EndpointCard
          method="POST"
          path="/api/v1/contratistas"
          description="Crea un contratista nuevo. Si el RUT ya existe, actualiza sus datos y lo reactiva."
          params={[
            { name: "rut", tipo: "string", required: true, desc: "RUT del contratista, ej: 76543210-1" },
            { name: "nombre", tipo: "string", required: true, desc: "Razón social o nombre del contratista" },
            { name: "direccion", tipo: "string", required: false, desc: "Dirección de la empresa" },
            { name: "email", tipo: "string", required: false, desc: "Correo electrónico de contacto" },
            { name: "telefono", tipo: "string", required: false, desc: "Teléfono de contacto" },
            { name: "ciudad", tipo: "string", required: false, desc: "Ciudad" },
            { name: "especialidad", tipo: "string", required: false, desc: "Rubro o especialidad de la empresa" },
            { name: "nombreContador", tipo: "string", required: false, desc: "Nombre del contador de la empresa" },
          ]}
          bodyExample={`{
  "rut": "76543210-1",
  "nombre": "Constructora XYZ SpA",
  "ciudad": "Santiago",
  "email": "contacto@xyz.cl",
  "telefono": "+56222334455"
}`}
          responseExample={`{
  "success": true,
  "contratista": {
    "id": 12,
    "identificador": "76543210-1",
    "nombre": "Constructora XYZ SpA",
    "estado": "VIGENTE",
    "ciudad": "Santiago",
    "especialidad": null
  }
}`}
          notes="Si el RUT ya existe, se actualizan los datos y se reactiva (estado VIGENTE)."
        />
      </div>

      {/* Ejemplos de código */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Ejemplos de código</h2>
        </div>
        <div className="px-6 py-5 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">cURL — Listar obras</p>
            <CodeBlock code={curlObras} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">cURL — Buscar trabajador</p>
            <CodeBlock code={curlBuscar} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">cURL — Registrar acceso</p>
            <CodeBlock code={curlRegistro} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">JavaScript / fetch — Flujo completo</p>
            <CodeBlock code={jsFetch} language="javascript" />
          </div>
        </div>
      </div>

      {/* Códigos de error */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Códigos de respuesta</h2>
        </div>
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs font-medium text-gray-500">Código</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-500">Significado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ["200", "OK — Solicitud exitosa"],
                ["201", "Created — Registro creado correctamente"],
                ["400", "Bad Request — Faltan campos requeridos o valores inválidos"],
                ["401", "Unauthorized — API key ausente, inválida o inactiva"],
                ["403", "Forbidden — Sin acceso a la obra solicitada"],
                ["404", "Not Found — Trabajador no encontrado o no vigente"],
              ].map(([code, desc]) => (
                <tr key={code}>
                  <td className="py-2 pr-4">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">{code}</code>
                  </td>
                  <td className="py-2 text-xs text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
