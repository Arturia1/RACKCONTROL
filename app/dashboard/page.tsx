"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, abertos: 0, aguardando: 0, finalizados: 0 });

  useEffect(() => {
    fetch("/api/racks")
      .then((res) => res.json())
      .then((tickets) => {
        if (Array.isArray(tickets)) {
          setData(tickets);
          // Processa KPIs
          const aguardando = tickets.filter((t:any) => t.STATUS === "AGUARDANDO").length;
          const abertos = tickets.filter((t:any) => t.STATUS === "ABERTO").length;
          const finalizados = tickets.filter((t:any) => t.STATUS === "FINALIZADO").length;
          setStats({ total: tickets.length, abertos, aguardando, finalizados });
        }
      });
  }, []);

  // Dados para gráficos
  const pieData = [
    { name: "Aguardando", value: stats.aguardando, color: "#eab308" }, // Amarelo
    { name: "Em Atendimento", value: stats.abertos, color: "#2563eb" }, // Azul
    { name: "Finalizados", value: stats.finalizados, color: "#16a34a" }, // Verde
  ];

  if (!session || session.user?.role === "SOLICITANTE") {
    return <div className="p-10 text-white">Acesso restrito a administradores e consultas.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-black mb-8">📊 DASHBOARD <span className="text-blue-500">GERENCIAL</span></h1>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-gray-400 text-sm font-bold uppercase">Total Chamados</h3>
          <p className="text-4xl font-black">{stats.total}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-yellow-500">
          <h3 className="text-yellow-500 text-sm font-bold uppercase">Fila de Espera</h3>
          <p className="text-4xl font-black">{stats.aguardando}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500">
          <h3 className="text-blue-500 text-sm font-bold uppercase">Em Andamento</h3>
          <p className="text-4xl font-black">{stats.abertos}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-green-500">
          <h3 className="text-green-500 text-sm font-bold uppercase">Concluídos</h3>
          <p className="text-4xl font-black">{stats.finalizados}</p>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
           <h3 className="mb-4 font-bold">Volume por Status</h3>
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                 {pieData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Pie>
               <Tooltip contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151'}} />
             </PieChart>
           </ResponsiveContainer>
        </div>
        
        {/* Aqui você pode adicionar mais gráficos, ex: Chamados por Setor */}
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-center text-gray-500">
           <p>Gráfico de Performance por Setor (Em breve)</p>
        </div>
      </div>
    </div>
  );
}