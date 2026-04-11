import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        userName: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { userName: credentials.userName as string },
        })

        if (!user) return null
        if (user.estado !== "VIGENTE") return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null

        return {
          id: user.id,
          name: user.userName,
          email: user.email ?? undefined,
          role: user.role,
          passwordVigente: user.passwordVigente,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.passwordVigente = (user as { passwordVigente: boolean }).passwordVigente
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as { role: string }).role = token.role as string
        ;(session.user as { passwordVigente: boolean }).passwordVigente =
          token.passwordVigente as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
