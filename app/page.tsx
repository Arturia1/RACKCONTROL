"use client";

import { useState, useEffect } from "react";

export default function DashboardRacks() {
  const [racks, setRacks] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [form, setForm] = useState({
    rackNome: "",
    tecnico: "",
    tecnicoCati: "",
    chamado: "",
    manutencao: "Não",
    dataAbertura: new Date().toISOString().split("T")[0],
  });

  // 1. CARREGAR DADOS
  const carregarDados = async () => {
    try {
      const res = await fetch("/api/racks", { cache: 'no-store' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const abertos = data.filter((r: any) => 
          r.STATUS && String(r.STATUS).trim().toUpperCase() === "ABERTO"
        );
        setRacks(abertos);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. ENVIAR DADOS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("Criando ticket...");
    try {
      const res = await fetch("/api/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ ...form, rackNome: "", tecnico: "", chamado: "", tecnicoCati: "", manutencao: "Não" });
        setStatusMessage("✅ Ticket Criado!");
        await carregarDados();
        setTimeout(() => setStatusMessage(""), 3000);
      } else {
        setStatusMessage("❌ Erro no servidor.");
      }
    } catch (error) {
      setStatusMessage("❌ Falha de conexão.");
    }
  };

  // 3. FINALIZAR
  const finalizar = async (id: number) => {
    if (!confirm("Confirmar finalização do atendimento?")) return;
    try {
      const res = await fetch(`/api/racks/${id}`, { method: "PATCH" });
      if (res.ok) await carregarDados();
    } catch (error) {
      alert("Erro ao finalizar.");
    }
  };

  // 4. LÓGICA VISUAL
  const racksFiltrados = racks.filter(r => {
    const nomeRack = r['RACK'] || r['RACK SOLICITADO'] || "";
    const numChamado = r['CHAMADOS ASSYST'] || r['CHAMADO'] || "";
    const termo = filtro.toLowerCase();
    return nomeRack.toLowerCase().includes(termo) || numChamado.toLowerCase().includes(termo);
  });

  const theme = {
    bg: darkMode ? "bg-gray-950" : "bg-gray-100",
    cardBg: darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    textMain: darkMode ? "text-white" : "text-gray-900",
    textSec: darkMode ? "text-gray-400" : "text-gray-500", 
    textCard: darkMode ? "text-gray-200" : "text-gray-800",
    inputBg: darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900",
    mutedBg: darkMode ? "bg-gray-800" : "bg-gray-100",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} p-4 md:p-6 font-sans`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>
              RACK<span className="text-blue-600">CONTROL</span>
            </h1>
            <p className={`font-bold text-sm ${theme.textSec}`}>Painel de Monitoramento</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text"
              placeholder="Buscar Ticket..."
              className={`flex-1 md:w-64 p-2.5 rounded-xl border-2 font-bold outline-none focus:border-blue-600 ${theme.inputBg}`}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-lg">
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <section className={`lg:col-span-4 p-6 rounded-2xl shadow-xl h-fit border-2 ${theme.cardBg}`}>
            <h2 className={`text-xl font-black mb-6 flex items-center ${theme.textMain}`}>
              <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span> Novo Ticket
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Rack</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-black uppercase ${theme.inputBg}`} placeholder="Ex: 50C1" value={form.rackNome} onChange={(e) => setForm({ ...form, rackNome: e.target.value })} required />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Técnico Patrimônio</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Chamado</label>
                   <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.chamado} onChange={(e) => setForm({ ...form, chamado: e.target.value })} required />
                </div>
                <div>
                   <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Manutenção?</label>
                   <select className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.manutencao} onChange={(e) => setForm({ ...form, manutencao: e.target.value })}>
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Técnico CATI</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.tecnicoCati} onChange={(e) => setForm({ ...form, tecnicoCati: e.target.value })} required />
              </div>
              
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-wide">
                ABRIR TICKET
              </button>
              {statusMessage && <p className="text-center text-sm font-bold mt-2 text-blue-500 animate-pulse">{statusMessage}</p>}
            </form>
          </section>

          {/* LADO DIREITO: TICKETS ATIVOS */}
          <section className="lg:col-span-8">
            <h2 className={`text-xl font-black mb-6 flex items-center ${theme.textMain}`}>
              <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></span> Atendimentos Ativos
              <span className="ml-3 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-bold">{racksFiltrados.length}</span>
            </h2>

            {loading ? <p className={theme.textMain}>Sincronizando tickets...</p> : racksFiltrados.length === 0 ? (
              <div className={`p-12 text-center border-2 border-dashed rounded-2xl ${theme.cardBg} ${theme.textSec}`}>
                <p className="text-lg font-bold">Nenhum ticket aberto.</p>
                <p className="text-sm opacity-70">Novos registros aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {racksFiltrados.map((rack) => {
                  const nomeTecnico = rack['TÉCNICO PATR. QUE ABRIU O RACK'] || rack['TÉCNICO PATR. QUE ABRIU O RACK.'] || rack['TECNICO'] || "---";
                  const nomeRack = rack['RACK'] || rack['RACK SOLICITADO'] || "---";
                  const numChamado = rack['CHAMADOS ASSYST'] || rack['CHAMADO'] || "---";
                  
                  // Mapeia a nova coluna DATA ABERTURA vinda do Backend
                  const dataAbertura = rack['DATA ABERTURA'] || rack['DATA DE ABERTURA DO RACK'] || rack['DATA'] || "";
                  
                  const isManutencao = String(nomeTecnico).includes("(Manutenção)");
                  
                  return (
                    <div 
                      key={rack.id} 
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border-l-8 shadow-sm hover:shadow-xl transition-all ${theme.cardBg} ${isManutencao ? 'border-orange-500' : 'border-blue-600'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-sm font-black text-white px-3 py-1 rounded-lg ${isManutencao ? 'bg-orange-500' : 'bg-blue-600'}`}>
                            {nomeRack}
                          </span>
                          <span className={`text-xs font-bold px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            #{numChamado}
                          </span>
                        </div>

                        <div className="space-y-3 mb-6">
                          <div>
                             <p className={`text-[10px] uppercase font-black ${theme.textSec}`}>Solicitante (Patrimônio)</p>
                             <p className={`text-sm font-black leading-tight ${theme.textCard}`}>{nomeTecnico}</p>
                          </div>
                          <div className="flex justify-between gap-2">
                            <div>
                               <p className={`text-[10px] uppercase font-black ${theme.textSec}`}>Técnico CATI</p>
                               <p className={`text-sm font-bold ${theme.textCard}`}>{rack['TÉCNICO CATI'] || '-'}</p>
                            </div>
                            <div className="text-right">
                               <p className={`text-[10px] uppercase font-black ${theme.textSec}`}>Entrada</p>
                               <p className={`text-xs font-bold ${theme.textCard}`}>{dataAbertura}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => finalizar(rack.id)} 
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-emerald-600' : 'bg-gray-50 text-gray-600 hover:bg-emerald-600 hover:text-white'}`}
                      >
                        Finalizar Atendimento
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}