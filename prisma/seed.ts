import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("Admin1234!", 10)

  const admin = await prisma.user.upsert({
    where: { userName: "admin" },
    update: {},
    create: {
      userName: "admin",
      email: "admin@sica.cl",
      passwordHash,
      role: "ADMINISTRADOR",
      estado: "VIGENTE",
      passwordVigente: true,
    },
  })

  console.log("Usuario administrador creado:", admin.userName)
  console.log("Contraseña inicial: Admin1234!")
  console.log("IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.")
}

main()
  .catch((e) => {
    console.error("Error al ejecutar seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
