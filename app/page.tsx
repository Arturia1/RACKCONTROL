"use client";

import { useState, useEffect } from "react";

export default function Home() {
  // Estados do Formulário
  const [rack, setRack] = useState("");
  const [chamado, setChamado] = useState("");
  const [tecnico, setTecnico] = useState(""); // Técnico CATI (Solicitante)
  const [isManutencao, setIsManutencao] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados da Lista
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // --- FUNÇÕES AUXILIARES (IGUAIS AO PATRIMÔNIO) ---
  const normalizar = (str: string) => 
    str ? str.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "") : "";

  const buscarValor = (item: any, chavesPossiveis: string[]) => {
    if (!item) return "";
    const chavesItem = Object.keys(item);
    for (const chave of chavesPossiveis) {
      const chaveNorm = normalizar(chave);
      const chaveReal = chavesItem.find(k => normalizar(k) === chaveNorm);
      if (chaveReal && item[chaveReal]) return item[chaveReal];
    }
    return "";
  };

  // --- CARREGAR TICKETS ---
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/racks", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filtra para mostrar apenas AGUARDANDO ou ABERTO na tela inicial
        // (Oculta os Finalizados para não poluir)
        const ativos = data.filter((t: any) => {
          const status = buscarValor(t, ['STATUS']);
          const s = status ? status.toUpperCase().trim() : "";
          return s === "AGUARDANDO" || s === "ABERTO";
        }).reverse(); // Mais recentes primeiro
        setTickets(ativos);
      }
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  // --- ENVIAR NOVO TICKET ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rack || !chamado || !tecnico) {
      alert("Preencha Rack, Chamado e Seu Nome.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rackNome: rack,
          chamado: chamado,
          tecnico: tecnico, // Envia como Solicitante
          manutencao: isManutencao ? "Sim" : "Não",
        }),
      });

      if (res.ok) {
        alert("✅ Chamado aberto com sucesso!");
        setRack("");
        setChamado("");
        // Não limpamos o técnico para facilitar aberturas seguidas
        setIsManutencao(false);
        fetchTickets(); // Atualiza a lista na hora
      } else {
        alert("Erro ao abrir chamado.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-6">
      
      {/* CABEÇALHO */}
      <header className="max-w-4xl mx-auto mb-10 text-center border-b border-gray-800 pb-6">
        <h1 className="text-4xl font-black tracking-tighter mb-2">
          ABERTURA DE <span className="text-blue-500">CHAMADOS</span>
        </h1>
        <p className="text-gray-400">Sistema de Controle de Racks - CATI</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* --- FORMULÁRIO DE ABERTURA --- */}
        <section className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            📝 Novo Ticket
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rack (Ex: 50C1)</label>
              <input
                type="text"
                value={rack}
                onChange={(e) => setRack(e.target.value.toUpperCase())}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors font-bold text-lg"
                placeholder="Nome do Rack"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Chamado Assyst</label>
                <input
                  type="text"
                  value={chamado}
                  onChange={(e) => setChamado(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="R000000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Técnico (Você)</label>
                <input
                  type="text"
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Seu Nome"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer" onClick={() => setIsManutencao(!isManutencao)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isManutencao ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                {isManutencao && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm text-gray-300 font-medium">Acionar Manutenção Predial?</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Enviando..." : "ABRIR CHAMADO"}
            </button>
          </form>
        </section>

        {/* --- LISTA DE TICKETS ATIVOS --- */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Chamados Recentes</h2>
            <div className="text-xs font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">
              {tickets.length} Ativos
            </div>
          </div>

          {loadingData ? (
            <p className="text-center text-gray-500 animate-pulse">Carregando lista...</p>
          ) : tickets.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">Nenhum chamado pendente.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {tickets.map((t, i) => {
                const status = buscarValor(t, ['STATUS']);
                const rackNome = buscarValor(t, ['RACK']);
                const tecnicoPatr = buscarValor(t, ['ATENDENTE', 'ATENDENTE PATRIMÔNIO']);
                const hora = buscarValor(t, ['HORA ABERTURA', 'HORARIO', 'HORÁRIO DE ABERTURA']);
                
                // Define cor baseada no status
                const isAguardando = status === "AGUARDANDO";
                const borderClass = isAguardando ? "border-yellow-500" : "border-blue-500";
                const bgBadge = isAguardando ? "bg-yellow-600" : "bg-blue-600";
                const statusText = isAguardando ? "Aguardando Patrimônio" : "Em Atendimento";

                return (
                  <div key={i} className={`bg-gray-900 p-4 rounded-xl border-l-4 ${borderClass} shadow-md flex justify-between items-center`}>
                    <div>
                      <h3 className="text-2xl font-black text-white">{rackNome}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Aberto às {hora}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-white ${bgBadge}`}>
                        {statusText}
                      </span>
                      {tecnicoPatr && !isAguardando && (
                        <p className="text-xs text-gray-400 mt-1">
                          Por: {tecnicoPatr.split(' ')[0]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}