-- CreateIndex: acelera búsqueda de último registro por obra (usado en listado de obras)
CREATE INDEX "registro_acceso_id_obra_fecha_hora_idx" ON "registro_acceso"("id_obra", "fecha_hora" DESC);

-- CreateIndex: acelera búsqueda del último registro por trabajador (usado en buscar/reportes)
CREATE INDEX "registro_acceso_id_trabajador_fecha_hora_idx" ON "registro_acceso"("id_trabajador", "fecha_hora" DESC);

-- CreateIndex: acelera búsqueda por RUT (identificador)
CREATE INDEX "registro_acceso_identificador_idx" ON "registro_acceso"("identificador");
