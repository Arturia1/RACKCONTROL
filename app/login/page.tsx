"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react"; // Importante para checar a role

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Email ou senha inválidos");
      setLoading(false);
    } else {
      // ✅ SUCESSO! Agora decidimos para onde ele vai
      const session = await getSession();
      const role = session?.user?.role; // ADMIN, TECNICO, CONSULTA, SOLICITANTE

      if (role === "ADMIN" || role === "TECNICO") {
        router.push("/patrimonio"); // Vai para a gestão
      } else if (role === "CONSULTA") {
        router.push("/dashboard"); // Vai para os gráficos
      } else {
        router.push("/"); // SOLICITANTE vai para o Rack Control (Home)
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-2 text-center">
          RACK<span className="text-blue-500">CONTROL</span>
        </h1>
        <p className="text-gray-400 text-center mb-8">Acesso Restrito</p>
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center font-bold border border-red-500/50">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase">Email Corporativo</label>
            <input 
              type="email" 
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none transition-colors"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu.nome@empresa.com"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase">Senha</label>
            <input 
              type="password" 
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white mt-1 focus:border-blue-500 outline-none transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "ENTRANDO..." : "ACESSAR SISTEMA"}
          </button>
        </form>
      </div>
    </div>
  );
}