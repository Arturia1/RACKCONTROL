"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", { username: user, password: pass, callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-black text-white text-center mb-2">RACK<span className="text-blue-500">CONTROL</span></h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Entre com suas credenciais CATI ou Patrimônio</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" placeholder="Usuário" 
            className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-blue-500"
            onChange={(e) => setUser(e.target.value)}
          />
          <input 
            type="password" placeholder="Senha" 
            className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg text-white outline-none focus:border-blue-500"
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            ENTRAR NO SISTEMA
          </button>
        </form>
      </div>
    </div>
  );
}