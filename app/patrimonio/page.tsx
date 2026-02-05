"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react"; // Autenticação
import { useRouter } from "next/navigation";           // Redirecionamento

export default function VisaoPatrimonio() {
  // --- CONTROLE DE SESSÃO ---
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalData, setModalData] = useState<any | null>(null);
  const [inputTecnico, setInputTecnico] = useState("");
  const [processando, setProcessando] = useState(false);

  // Estado para controlar a tela de troca de técnico no modal
  const [modoTroca, setModoTroca] = useState(false);

  // --- CONTROLE DE NOTIFICAÇÕES ---
  const [showToast, setShowToast] = useState(false); 
  const prevAguardandoCount = useRef(0);
  const isFirstLoad = useRef(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const SOM_BEEP = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

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
      "AMARELO": "bg-yellow-600 border-yellow-400 shadow-yellow-500/50",
      "AZUL": "bg-blue-600 border-blue-400 shadow-blue-500/50",
      "VERDE": "bg-green-600 border-green-400 shadow-green-500/50",
      "VERMELHO": "bg-red-600 border-red-400 shadow-red-500/50",
      "CINZA": "bg-gray-700 border-gray-500"
    };
    return mapa[corNome?.toUpperCase()] || mapa["CINZA"];
  };

  // --- CONFIGURAÇÃO DO ÁUDIO ---
  useEffect(() => {
    audioRef.current = new Audio(SOM_BEEP);
    audioRef.current.volume = 1.0;
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const testarSomManual = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => console.log("Som tocou!"))
        .catch(e => alert("Som bloqueado pelo navegador. Clique na página."));
    }
  };

  const dispararAlerta = (qtdNovos: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (document.visibilityState === "visible") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 Novo Chamado!", { body: `${qtdNovos} chamados aguardando.` });
    }
  };

  // --- CARREGAMENTO DE DADOS ---
  const carregarDados = async () => {
    try {
      const res = await fetch("/api/racks", { cache: 'no-store' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const listaInvertida = data.reverse();
        setTickets(listaInvertida);

        const aguardandoAgora = listaInvertida.filter((t: any) => {
           const s = buscarValor(t, ['STATUS']);
           const r = buscarValor(t, ['RACK']);
           return r && s && s.toUpperCase().trim() === "AGUARDANDO";
        }).length;

        if (!isFirstLoad.current && aguardandoAgora > prevAguardandoCount.current) {
           dispararAlerta(aguardandoAgora);
        }
        prevAguardandoCount.current = aguardandoAgora;
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
    } finally {
      setLoading(false);
    }
  };

  // Só carrega dados se estiver autenticado
  useEffect(() => {
    if (status === "authenticated") {
      carregarDados();
      const interval = setInterval(carregarDados, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // --- AÇÕES DO SISTEMA (UNIFICADA) ---
  const executarAcao = async (tipo: 'aceitar' | 'finalizar' | 'trocar') => {
    setProcessando(true);
    try {
      const body: any = { action: tipo };
      
      // Validações
      if (tipo === 'aceitar') {
        const tecnicoFinal = inputTecnico.trim() || session?.user?.name;
        if (!tecnicoFinal) return alert("Digite seu nome.");
        body.tecnico = tecnicoFinal;
      }
      
      if (tipo === 'trocar') {
        if (!inputTecnico.trim()) return alert("Digite o nome do novo técnico.");
        body.action = 'trocar_tecnico'; 
        body.novoTecnico = inputTecnico;
      }

      await fetch(`/api/racks/${modalData.ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      setModalData(null);
      setInputTecnico("");
      setModoTroca(false);
      setTimeout(() => carregarDados(), 1000);
    } catch (error) {
      alert("Erro na operação.");
    } finally {
      setProcessando(false);
    }
  };

  // --- FILTROS ---
  const filtrarTickets = (statusAlvo: string) => {
    return tickets.filter(t => {
      const s = buscarValor(t, ['STATUS']);
      const r = buscarValor(t, ['RACK']);
      return r && s && s.toUpperCase().trim() === statusAlvo;
    });
  };

  // Tela de carregamento do Login
  if (status === "loading") return <div className="min-h-screen bg-black flex items-center justify-center text-white font-bold animate-pulse">Verificando acesso...</div>;
  if (status === "unauthenticated") return null;

  const ticketsAguardando = filtrarTickets("AGUARDANDO");
  const ticketsAbertos = filtrarTickets("ABERTO");
  const ticketsFinalizados = filtrarTickets("FINALIZADO");

  // Componente do Card
  const RenderCard = ({ ticket }: { ticket: any }) => {
    const nomeRack = buscarValor(ticket, ['RACK']);
    const setor = buscarValor(ticket, ['SETORES ATENDIDOS', 'SETORES']);
    const cor = buscarValor(ticket, ['COR']);
    const horario = buscarValor(ticket, ['HORÁRIO DE ABERTURA', 'HORAABERTURA']);
    const fecham = buscarValor(ticket, ['HORÁRIO DE FECHAMENTO', 'HORAFECHAMENTO']);
    const solicitante = buscarValor(ticket, ['TÉCNICO CATI', 'TECNICOCATI', 'SOLICITANTE']);
    const atendente = buscarValor(ticket, ['ATENDENTE PATRIMÔNIO', 'ATENDENTEPATRIMONIO', 'ATENDENTE']);
    const status = buscarValor(ticket, ['STATUS']);
    const corCSS = getCorCSS(cor || "Cinza");

    const abrirModal = () => {
      setModalData({
        ticket, nomeRack, setor, cor, 
        locais: buscarValor(ticket, ['LOCAIS DE REFERENCIA', 'LOCAIS']), 
        horario, chamado: buscarValor(ticket, ['CHAMADOS ASSYST', 'CHAMADO']), 
        solicitante, atendente, status, fecham
      });
      setInputTecnico("");
      setModoTroca(false);
    };

    return (
      <div onClick={abrirModal} className={`cursor-pointer transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden rounded-2xl border-l-[12px] shadow-lg ${corCSS} p-4 mb-4 min-h-[140px] flex flex-col justify-between`}>
        <div className="flex justify-between items-start">
          <h2 className="text-3xl font-black text-white drop-shadow-md tracking-tighter">{nomeRack}</h2>
          {atendente ? (
             <div className="flex flex-col items-end">
               <span className="text-[9px] text-white/80 uppercase font-bold">Atendendo</span>
               <span className="text-[10px] bg-blue-900/90 border border-blue-400 px-2 py-1 rounded text-white font-bold truncate max-w-[90px]">{atendente.split(' ')[0]}</span>
             </div>
          ) : (
             <div className="flex flex-col items-end">
               <span className="text-[9px] text-white/60 uppercase font-bold">Solicitado por</span>
               <span className="text-[10px] bg-black/40 px-2 py-1 rounded text-white/80 font-bold truncate max-w-[90px]">{solicitante ? solicitante.split(' ')[0] : 'CATI'}</span>
             </div>
          )}
        </div>
        <div className="space-y-1 mt-2">
            <p className="text-xs font-bold text-white/90 uppercase bg-black/20 p-1 rounded inline-block">{setor || "..."}</p>
            <div className="flex justify-between text-xs items-center mt-2">
              <span className="text-white/80 font-bold uppercase text-[10px]">{status === "FINALIZADO" ? "Fechou:" : "Abriu:"}</span>
              <span className="text-white font-mono font-bold text-xs bg-black/30 px-2 py-1 rounded">{status === "FINALIZADO" ? fecham : horario}</span>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 font-sans text-white overflow-x-hidden relative">
      
      {/* TOAST VISUAL */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 bg-blue-600 border-l-4 border-white text-white p-4 rounded-lg shadow-2xl animate-bounce flex items-center gap-4 cursor-pointer hover:bg-blue-500 transition-colors" onClick={() => setShowToast(false)}>
          <div className="bg-white/20 p-2 rounded-full"><span className="text-2xl">🔔</span></div>
          <div><p className="font-bold text-lg uppercase">Novo Chamado!</p></div>
        </div>
      )}

      {/* CABEÇALHO */}
      <header className="mb-6 flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            VISÃO <span className="text-blue-500">PATRIMÔNIO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Painel do Usuário (COM LOGOUT) */}
          <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
             <div className="text-right hidden md:block">
               <p className="text-[10px] text-gray-400 uppercase font-bold">Logado como</p>
               <p className="text-xs font-bold text-white">{session?.user?.name}</p>
             </div>
             <button onClick={() => router.push('/dashboard')} title="Dashboard" className="bg-gray-800 hover:bg-gray-700 p-2 rounded transition-colors">
               📊
             </button>
             <button onClick={() => signOut()} title="Sair" className="bg-red-900/30 hover:bg-red-900/80 text-red-200 p-2 rounded transition-colors">
               🚪
             </button>
          </div>

          {/* Botão de Som e Contador */}
          <div className="text-right flex items-center gap-3 border-l border-gray-800 pl-4">
            <button 
              onClick={testarSomManual}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-1 rounded text-xs font-bold transition-all active:scale-95"
            >
              🔊 Testar
            </button>
            <span className="bg-gray-800 px-3 py-1 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
              {ticketsAguardando.length + ticketsAbertos.length} ATIVOS
            </span>
          </div>
        </div>
      </header>

      {/* ÁREA KANBAN */}
      {loading ? (
        <div className="text-center mt-20"><p className="animate-pulse font-bold text-gray-500">Carregando...</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* AGUARDANDO */}
          <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 flex flex-col">
            <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> Aguardando ({ticketsAguardando.length})
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {ticketsAguardando.length === 0 && <p className="text-gray-600 text-sm text-center italic mt-10">Fila vazia</p>}
              {ticketsAguardando.map((t, i) => <RenderCard key={i} ticket={t} />)}
            </div>
          </div>

          {/* EM ATENDIMENTO */}
          <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 flex flex-col">
            <h3 className="text-lg font-bold text-blue-500 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Em Atendimento ({ticketsAbertos.length})
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {ticketsAbertos.length === 0 && <p className="text-gray-600 text-sm text-center italic mt-10">Nenhum em andamento</p>}
              {ticketsAbertos.map((t, i) => <RenderCard key={i} ticket={t} />)}
            </div>
          </div>

          {/* FINALIZADOS */}
          <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 flex flex-col opacity-80">
            <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-gray-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-gray-500"></span> Finalizados ({ticketsFinalizados.length})
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {ticketsFinalizados.slice(0, 4).map((t, i) => <RenderCard key={i} ticket={t} />)}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHES */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setModalData(null)}>
          <div className="bg-gray-900 border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>

            {/* Cabeçalho do Modal */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`h-16 w-3 rounded-full ${getCorCSS(modalData.cor).split(' ')[0]}`}></div>
              <div>
                <h2 className="text-5xl font-black text-white tracking-tighter">{modalData.nomeRack}</h2>
                <p className="text-xl text-gray-400">{modalData.setor}</p>
              </div>
            </div>

            {/* Dados do Ticket */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
               <div>
                 <p className="text-gray-500 text-xs font-bold uppercase">Solicitante (CATI)</p>
                 <p className="text-white font-bold">{modalData.solicitante || "---"}</p>
               </div>
               <div>
                 <p className="text-gray-500 text-xs font-bold uppercase">Chamado</p>
                 <p className="text-white font-bold">#{modalData.chamado || "--"}</p>
               </div>
               <div className="col-span-2">
                 <p className="text-gray-500 text-xs font-bold uppercase">Locais</p>
                 <p className="text-gray-300 text-sm truncate">{modalData.locais}</p>
               </div>
            </div>

            {/* ÁREA DE AÇÃO */}
            <div className="pt-4 border-t border-gray-800">
              
              {/* CASO 1: AGUARDANDO (Aceitar) */}
              {modalData.status?.toUpperCase().trim() === "AGUARDANDO" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-yellow-500 mb-2 uppercase">Atribuir Técnico Patrimônio</label>
                    <input 
                      type="text" 
                      placeholder={`Nome (Padrão: ${session?.user?.name})`}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500"
                      value={inputTecnico}
                      onChange={(e) => setInputTecnico(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={() => executarAcao('aceitar')}
                    disabled={processando}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    {processando ? "Iniciando..." : "INICIAR ATENDIMENTO"}
                  </button>
                </div>
              )}

              {/* CASO 2: ABERTO (Finalizar OU Trocar) */}
              {modalData.status?.toUpperCase().trim() === "ABERTO" && (
                <div className="space-y-4">
                  {!modoTroca ? (
                    <>
                      <div className="bg-blue-900/20 border border-blue-900 p-3 rounded-lg text-center">
                        <p className="text-blue-400 text-sm">Em atendimento por: <strong className="text-white text-lg block mt-1">{modalData.atendente || "Patrimônio"}</strong></p>
                      </div>
                      
                      <button 
                        onClick={() => executarAcao('finalizar')}
                        disabled={processando}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all active:scale-95"
                      >
                        {processando ? "Finalizando..." : "FINALIZAR ATENDIMENTO"}
                      </button>

                      <button onClick={() => setModoTroca(true)} className="w-full text-center text-xs text-gray-400 hover:text-white underline">
                        Transferir responsabilidade para outro técnico
                      </button>
                    </>
                  ) : (
                    // MODO TROCA ATIVO
                    <div className="bg-gray-800 border border-gray-600 p-4 rounded-xl animate-in zoom-in">
                      <p className="text-yellow-500 text-xs font-bold uppercase mb-2">Troca de Responsável</p>
                      <input 
                        type="text" 
                        placeholder="Nome do Novo Técnico"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-3 focus:border-yellow-500 outline-none"
                        value={inputTecnico}
                        onChange={(e) => setInputTecnico(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                         <button onClick={() => setModoTroca(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 rounded-lg">Cancelar</button>
                         <button onClick={() => executarAcao('trocar')} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold py-2 rounded-lg">Confirmar Troca</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CASO 3: FINALIZADO */}
              {modalData.status?.toUpperCase().trim() === "FINALIZADO" && (
                <div className="text-center p-4 bg-gray-800 rounded-xl">
                  <p className="text-green-500 font-bold uppercase text-lg">Atendimento Concluído</p>
                  <p className="text-gray-400 text-sm">Fechado às {modalData.fecham}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}