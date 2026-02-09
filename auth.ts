import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import userData from "./lib/users.json"; // Importa o seu arquivo de usuários

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // Busca no arquivo JSON usando 'username' em vez de 'email'
        const user = userData.users.find(
          (u) => 
            u.username === credentials?.username && 
            u.password === credentials?.password
        );

        if (user) {
          // Retorna o objeto do usuário para a sessão
          return { 
            id: user.id, 
            name: user.name, 
            username: user.username, 
            role: user.role 
          };
        }
        
        // Se as credenciais não baterem, retorna null e gera o erro que você viu
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});