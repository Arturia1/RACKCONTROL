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
      const res = await fetch("/api/racks");
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
    const interval = setInterval(carregarDados, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. REGISTRAR NOVO RACK
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("Registrando...");
    try {
      const res = await fetch("/api/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({ ...form, rackNome: "", tecnico: "", chamado: "", tecnicoCati: "", manutencao: "Não" });
        setStatusMessage("✅ Gravado com Sucesso!");
        await carregarDados();
        setTimeout(() => setStatusMessage(""), 3000);
      }
    } catch (error) {
      setStatusMessage("❌ Erro ao salvar.");
    }
  };

  // 3. FINALIZAR RACK
  const finalizar = async (id: number) => {
    if (!confirm("Deseja finalizar este atendimento?")) return;
    try {
      const res = await fetch(`/api/racks/${id}`, { method: "PATCH" });
      if (res.ok) await carregarDados();
    } catch (error) {
      alert("Erro ao finalizar.");
    }
  };

  // 4. LÓGICA DE FILTRO (BUSCA)
  const racksFiltrados = racks.filter(r => 
    r['RACK SOLICITADO']?.toLowerCase().includes(filtro.toLowerCase()) ||
    r['CHAMADOS ASSYST']?.toLowerCase().includes(filtro.toLowerCase())
  );

  const theme = {
    bg: darkMode ? "bg-gray-950" : "bg-gray-100",
    cardBg: darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-black",
    textMain: darkMode ? "text-white" : "text-black",
    textSec: darkMode ? "text-gray-400" : "text-gray-600", 
    inputBg: darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-black text-black",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} p-4 md:p-8 font-sans`}>
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${theme.textMain}`}>
              RACK<span className="text-blue-600">CONTROL</span>
            </h1>
            <p className={`font-bold ${theme.textSec}`}>Monitoramento em Tempo Real</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input 
              type="text"
              placeholder="🔍 Buscar rack ou chamado..."
              className={`flex-1 md:w-64 p-2 rounded-xl border-2 font-bold outline-none focus:border-blue-600 ${theme.inputBg}`}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`px-6 py-2 rounded-full font-black shadow-lg transition-all active:scale-95 ${darkMode ? "bg-yellow-400 text-black" : "bg-gray-800 text-white"}`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <section className={`p-6 rounded-2xl shadow-xl h-fit border-2 ${theme.cardBg}`}>
            <h2 className={`text-xl font-black mb-6 flex items-center ${theme.textMain}`}>
              <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span> Nova Abertura
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Identificação do Rack</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-black uppercase ${theme.inputBg}`} placeholder="Ex: 50C1" value={form.rackNome} onChange={(e) => setForm({ ...form, rackNome: e.target.value })} required />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Técnico Patrimônio</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} required />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Técnico CATI</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.tecnicoCati} onChange={(e) => setForm({ ...form, tecnicoCati: e.target.value })} required />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Nº Chamado Assyst</label>
                <input className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.chamado} onChange={(e) => setForm({ ...form, chamado: e.target.value })} required />
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase ${theme.textSec}`}>Aberto pela Manutenção?</label>
                <select className={`w-full mt-1 p-3 border-2 rounded-xl font-bold ${theme.inputBg}`} value={form.manutencao} onChange={(e) => setForm({ ...form, manutencao: e.target.value })}>
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-95">REGISTRAR NA PLANILHA</button>
              {statusMessage && <p className={`text-center text-sm font-bold mt-2 text-blue-500`}>{statusMessage}</p>}
            </form>
          </section>

          {/* COLUNA DIREITA: ATENDIMENTOS ATIVOS */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className={`text-xl font-black mb-6 flex items-center ${theme.textMain}`}>
              <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></span> Atendimentos Ativos
              <span className="ml-3 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">{racksFiltrados.length}</span>
            </h2>

            {loading ? <p className={theme.textMain}>Sincronizando...</p> : racksFiltrados.length === 0 ? (
              <div className={`p-20 text-center border-2 border-dashed rounded-2xl ${theme.cardBg} ${theme.textSec} font-bold`}>
                Nenhum registro encontrado.
              </div>
            ) : (
              <div className="grid gap-4">
                {racksFiltrados.map((rack) => {
                  const isManutencao = rack['TÉCNICO PATR. QUE ABRIU O RACK']?.includes("(Manutenção)");
                  
                  return (
                    <div 
                      key={rack.id} 
                      className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-start md:items-center transition-all hover:shadow-xl ${theme.cardBg} ${isManutencao ? 'border-l-8 border-l-orange-500' : 'border-l-8 border-l-blue-600'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm font-black px-3 py-1 rounded-lg text-white ${isManutencao ? 'bg-orange-500' : 'bg-blue-600'}`}>
                            {rack['RACK SOLICITADO'] || 'RACK'}
                          </span>
                          <span className="text-xs font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                            #{rack['CHAMADOS ASSYST']}
                          </span>
                          {isManutencao && (
                            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded border border-orange-200 animate-pulse">
                              ⚙️ MANUTENÇÃO
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <span className="text-[10px] uppercase font-black text-gray-500 block">Téc. Patrimônio</span>
                            <p className={`font-black ${theme.textMain}`}>
                              {rack['TÉCNICO PATR. QUE ABRIU O RACK']}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-black text-gray-500 block">Téc. CATI</span>
                            <p className={`font-black ${theme.textMain}`}>
                              {rack['TÉCNICO CATI'] || '-'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className={`text-[10px] font-bold ${theme.textSec} uppercase`}>
                            Entrada: {rack['DATA DE ABERTURA DO RACK']}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => finalizar(rack.id)} 
                        className="mt-4 md:mt-0 bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-4 rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95"
                      >
                        Finalizar
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