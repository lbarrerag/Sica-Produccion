-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'REGISTRO_MARCA', 'API');
-- CreateEnum
CREATE TYPE "UserEstado" AS ENUM ('VIGENTE', 'INACTIVO', 'ELIMINADO');
-- CreateEnum
CREATE TYPE "ObraEstado" AS ENUM ('VIGENTE', 'ELIMINADO');
-- CreateEnum
CREATE TYPE "ContratistaEstado" AS ENUM ('VIGENTE', 'ELIMINADO');
-- CreateEnum
CREATE TYPE "EspecialidadEstado" AS ENUM ('VIGENTE', 'ELIMINADO');
-- CreateEnum
CREATE TYPE "TrabajadorEstado" AS ENUM ('VIGENTE', 'ELIMINADO');
-- CreateEnum
CREATE TYPE "TipoAcceso" AS ENUM ('ENTRADA', 'SALIDA');
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "email" TEXT,
    "app_email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'REGISTRO_MARCA',
    "id_negocio" INTEGER NOT NULL DEFAULT 0,
    "cod_theme" TEXT,
    "password_vigente" BOOLEAN NOT NULL DEFAULT true,
    "estado" "UserEstado" NOT NULL DEFAULT 'VIGENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "obras" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "centro_costo" TEXT,
    "estado" "ObraEstado" NOT NULL DEFAULT 'VIGENTE',
    "fecha_insert" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "user_obras" (
    "id" SERIAL NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "id_obra" INTEGER NOT NULL,
    CONSTRAINT "user_obras_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "contratistas" (
    "id" SERIAL NOT NULL,
    "identificador" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "ContratistaEstado" NOT NULL DEFAULT 'VIGENTE',
    "direccion" TEXT,
    "email" TEXT,
    "nombre_contador" TEXT,
    "telefono" TEXT,
    "ciudad" TEXT,
    "especialidad" TEXT,
    "fecha_insert" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contratistas_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "especialidades" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EspecialidadEstado" NOT NULL DEFAULT 'VIGENTE',
    "fecha_insert" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "trabajadores" (
    "id" SERIAL NOT NULL,
    "identificador" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "id_contratista" INTEGER,
    "identificador_contratista" TEXT,
    "nombre_contratista" TEXT,
    "estado" "TrabajadorEstado" NOT NULL DEFAULT 'VIGENTE',
    "direccion" TEXT,
    "ciudad" TEXT,
    "especialidad" TEXT,
    "telefono" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "preguntas" TEXT,
    "fecha_insert" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "registro_acceso" (
    "id" SERIAL NOT NULL,
    "id_trabajador" INTEGER NOT NULL,
    "id_obra" INTEGER NOT NULL,
    "identificador" TEXT NOT NULL,
    "id_contratista" INTEGER,
    "identificador_contratista" TEXT,
    "tipo" "TipoAcceso" NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registro_acceso_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");
-- CreateIndex
CREATE UNIQUE INDEX "user_obras_id_usuario_id_obra_key" ON "user_obras"("id_usuario", "id_obra");
-- CreateIndex
CREATE UNIQUE INDEX "contratistas_identificador_key" ON "contratistas"("identificador");
-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_identificador_key" ON "trabajadores"("identificador");
-- AddForeignKey
ALTER TABLE "user_obras" ADD CONSTRAINT "user_obras_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "user_obras" ADD CONSTRAINT "user_obras_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_id_contratista_fkey" FOREIGN KEY ("id_contratista") REFERENCES "contratistas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "registro_acceso" ADD CONSTRAINT "registro_acceso_id_trabajador_fkey" FOREIGN KEY ("id_trabajador") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "registro_acceso" ADD CONSTRAINT "registro_acceso_id_obra_fkey" FOREIGN KEY ("id_obra") REFERENCES "obras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "registro_acceso" ADD CONSTRAINT "registro_acceso_id_contratista_fkey" FOREIGN KEY ("id_contratista") REFERENCES "contratistas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
