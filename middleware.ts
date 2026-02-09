import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const role = (req.auth?.user as any)?.role;

  // 1. Se não estiver logado e não for a página de login, redireciona
  if (!isLoggedIn && nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Regras de RBAC (Role Based Access Control)
  if (isLoggedIn) {
    if (nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", nextUrl)); // Já logado vai para home
    }

    // Proteção da tela de Património
    if (nextUrl.pathname.startsWith("/patrimonio")) {
      if (role !== "ADMIN_PATRIMONIO" && role !== "VIEW_PATRIMONIO") {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
    }

    // Proteção da tela de Abertura (Home)
    if (nextUrl.pathname === "/") {
      if (role !== "ADMIN_RACKCONTROL" && role !== "USER_RACKCONTROL") {
        return NextResponse.redirect(new URL("/patrimonio", nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};