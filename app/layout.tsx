import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Mudamos para Inter
import "./globals.css";

// Configura a fonte Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RackControl",
  description: "Gerenciamento de Racks e Chamados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* Aplica a classe da fonte no body */}
      <body className={`${inter.className} bg-slate-950 text-white`}>
        {children}
      </body>
    </html>
  );
}