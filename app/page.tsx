"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react"; // Importar signOut

export default function Home() {
  const { data: session } = useSession();

  // Estados do Formulário
  const [rack, setRack] = useState("");
  const [chamado, setChamado] = useState("");
  const [tecnico, setTecnico] = useState(""); 
  const [isManutencao, setIsManutencao] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados da Lista
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Preencher nome do técnico se logado
  useEffect(() => {
    if (session?.user?.name) {
      setTecnico(session.user.name);
    }
  }, [session]);

  // --- FUNÇÕES AUXILIARES ---
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

  const getCorCSS = (corNome: string) => {
    const mapa: any = {
      "AMARELO": "bg-yellow-600 border-yellow-800 shadow-yellow-500/30",
      "AZUL": "bg-blue-600 border-blue-800 shadow-blue-500/30",
      "VERDE": "bg-green-600 border-green-800 shadow-green-500/30",
      "VERMELHO": "bg-red-600 border-red-800 shadow-red-500/30",
      "CINZA": "bg-gray-700 border-gray-900"
    };
    return mapa[corNome?.toUpperCase()] || mapa["CINZA"];
  };

  // --- CARREGAR TICKETS ---
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/racks", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        const ativos = data.filter((t: any) => {
          const status = buscarValor(t, ['STATUS']);
          const s = status ? status.toUpperCase().trim() : "";
          return s === "AGUARDANDO" || s === "ABERTO";
        }).reverse(); 
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
    const interval = setInterval(fetchTickets, 5000); 
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
          tecnico: tecnico, 
          manutencao: isManutencao ? "Sim" : "Não",
        }),
      });

      if (res.ok) {
        alert("✅ Chamado aberto com sucesso!");
        setRack("");
        setChamado("");
        setIsManutencao(false);
        if (!session?.user?.name) setTecnico("");
        fetchTickets(); 
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
      
      {/* CABEÇALHO COM LOGOUT */}
      <header className="max-w-4xl mx-auto mb-10 border-b border-gray-800 pb-6 relative">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter mb-2">
            ABERTURA DE <span className="text-blue-500">CHAMADOS</span>
          </h1>
          <p className="text-gray-400">Sistema de Controle de Racks - CATI</p>
        </div>

        {/* Botão de Sair (Posicionado no canto) */}
        {session && (
          <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Olá, {session.user?.name}</span>
            <button 
              onClick={() => signOut()}
              className="text-xs bg-red-900/30 hover:bg-red-900 text-red-200 px-3 py-1 rounded transition-colors border border-red-900/50"
            >
              SAIR
            </button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* --- FORMULÁRIO --- */}
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
                  readOnly={!!session?.user?.name} 
                  className={`w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none transition-colors ${session?.user?.name ? 'opacity-70 cursor-not-allowed' : ''}`}
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

        {/* --- LISTA DE MINI TICKETS --- */}
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {tickets.map((t, i) => {
                const status = buscarValor(t, ['STATUS']);
                const rackNome = buscarValor(t, ['RACK']);
                const cor = buscarValor(t, ['COR']); 
                const setor = buscarValor(t, ['SETORES', 'SETORES ATENDIDOS']);
                const tecnicoPatr = buscarValor(t, ['ATENDENTE', 'ATENDENTE PATRIMÔNIO']);
                const hora = buscarValor(t, ['HORA ABERTURA', 'HORARIO', 'HORÁRIO DE ABERTURA']);
                
                const corCSS = getCorCSS(cor); 
                const isAguardando = status?.toUpperCase().trim() === "AGUARDANDO";
                const statusText = isAguardando ? "Aguardando" : "Em Atendimento";

                return (
                  <div key={i} className={`relative overflow-hidden rounded-xl border-l-[8px] shadow-lg ${corCSS} p-4 flex justify-between items-start transition-transform hover:scale-[1.02]`}>
                    
                    <div>
                      <h3 className="text-3xl font-black text-white drop-shadow-md tracking-tighter">{rackNome}</h3>
                      <p className="text-xs font-bold text-white/90 uppercase bg-black/20 p-1 rounded inline-block mt-1">
                        {setor || "Carregando..."}
                      </p>
                      <p className="text-xs text-white/80 mt-2 font-mono">
                        Aberto às {hora}
                      </p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded text-white bg-black/40 border border-white/20`}>
                        {statusText}
                      </span>
                      
                      {tecnicoPatr && !isAguardando && (
                        <div className="mt-1">
                          <span className="text-[9px] text-white/80 block">Atendente:</span>
                          <span className="text-[10px] font-bold text-white bg-blue-900/80 px-2 py-0.5 rounded border border-blue-400/50">
                             {tecnicoPatr.split(' ')[0]}
                          </span>
                        </div>
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