import { requireRole } from "@/lib/auth-utils"
import { ImportarHistorial } from "@/components/ui/ImportarHistorial"

export default async function ImportarHistorialPage() {
  await requireRole("ADMINISTRADOR")

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Importar Historial de Accesos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Carga registros históricos de acceso desde el reporte Excel de Control de Acceso.
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">Formato esperado del archivo</h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Fila 1: Título (<span className="font-mono text-xs bg-gray-100 px-1 rounded">Informe Control Acceso</span>)</li>
            <li>Fila 2: Cabeceras (Fecha, Identificador, Nombre, Obra, CentroCosto, Contratista, Registro Ingreso, Registro Salida…)</li>
            <li>Fila 3 en adelante: Datos</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            Cada fila genera hasta <strong>2 registros</strong> en el sistema (ENTRADA y SALIDA).
            Si un trabajador, obra o contratista no existe, se crea automáticamente.
          </p>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ Para archivos grandes (~21.000 filas) el proceso puede tardar <strong>1–3 minutos</strong>. No cierres la ventana.
          </div>
        </div>

        <ImportarHistorial />
      </div>
    </div>
  )
}
