import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Lógica extra se precisar bloquear rotas específicas por role
    // Por enquanto, apenas garantir o login já basta
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Só passa se tiver token (logado)
    },
    pages: {
      signIn: "/login", // Se não tiver logado, vai pra cá
    },
  }
);

// Protege tudo, exceto imagens, api pública e arquivos estáticos
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};