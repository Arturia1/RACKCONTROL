import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { buscarUsuarioPorEmail, registrarLog } from "@/lib/security";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          const user = await buscarUsuarioPorEmail(credentials.email);

          // --- ÁREA DE DEBUG (Adicione isso) ---
          console.log("--- DEBUG LOGIN ---");
          console.log("Email digitado:", credentials.email);
          console.log("Usuário encontrado no Banco:", user ? user.name : "NÃO ENCONTRADO");
          console.log("Senha digitada:", credentials.password);
          console.log("Hash na planilha:", user?.passwordHash);
          
          if (user) {
            const senhaConfere = bcrypt.compareSync(credentials.password, user.passwordHash);
            console.log("A senha bate com o hash?", senhaConfere ? "SIM" : "NÃO");
            
            if (senhaConfere) {
              // Log de sucesso
              registrarLog(user.name, "LOGIN", "Acesso realizado");
              return { id: user.id, name: user.name, email: user.email, role: user.role };
            }
          }
          
          console.log("Login falhou.");
          return null;
        }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role; // Passa a role para o front
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Nossa página customizada
  }
});

export { handler as GET, handler as POST };