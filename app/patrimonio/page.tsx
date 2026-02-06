"use client";

import { useState, useEffect, useRef } from "react";
import { 
  AlertCircle, CheckCircle2, Clock, MapPin, 
  Server, User, X, Briefcase, Volume2 
} from "lucide-react";

export default function VisaoPatrimonio() {
  // --- STATE ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<any | null>(null);
  const [inputTecnico, setInputTecnico] = useState("");
  const [processando, setProcessando] = useState(false);
  const [modoTroca, setModoTroca] = useState(false);

  // --- NOTIFICAÇÕES & ÁUDIO ---
  const [showToast, setShowToast] = useState(false); 
  const prevAguardandoCount = useRef(0);
  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Som de Beep (Base64 mantido)
  const SOM_BEEP = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

  // --- HELPERS ---
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

  // Cores Melhoradas (Texto preto no amarelo)
  const getCorCSS = (corNome: string) => {
    const c = corNome?.toUpperCase() || "CINZA";
    switch (c) {
      case "AZUL": return "bg-blue-600 border-blue-800 shadow-blue-900/50";
      case "VERDE": return "bg-emerald-600 border-emerald-800 shadow-emerald-900/50";
      case "VERMELHO": return "bg-red-600 border-red-800 shadow-red-900/50";
      case "AMARELO": return "bg-yellow-500 border-yellow-700 shadow-yellow-900/50 text-black"; 
      default: return "bg-slate-700 border-slate-900 shadow-black/50";
    }
  };

  // --- EFFECTS ---
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
        .catch(e => alert("Som bloqueado pelo navegador. Interaja com a página primeiro."));
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

  const carregarDados = async () => {
    try {
      const res = await fetch("/api/racks", { cache: 'no-store' });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const listaInvertida = data; // API já retorna desc
        setTickets(listaInvertida);

        // Lógica de alerta sonoro
        const aguardandoAgora = listaInvertida.filter((t: any) => {
           const s = buscarValor(t, ['STATUS']);
           return s && s.toUpperCase().trim() === "AGUARDANDO";
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

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 3000); // 3s polling
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const executarAcao = async (tipo: 'aceitar' | 'finalizar' | 'trocar') => {
    if (!modalData) return;
    setProcessando(true);
    try {
      const body: any = { action: tipo };
      
      if (tipo === 'aceitar') {
        if (!inputTecnico.trim()) { setProcessando(false); return alert("Digite seu nome."); }
        body.tecnico = inputTecnico;
      }
      
      if (tipo === 'trocar') {
        if (!inputTecnico.trim()) { setProcessando(false); return alert("Digite o nome do novo técnico."); }
        body.action = 'trocar_tecnico'; 
        body.novoTecnico = inputTecnico;
      }

      await fetch(`/api/racks/${modalData.id}`, { // Usando ID direto do modalData
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      setModalData(null);
      setInputTecnico("");
      setModoTroca(false);
      setTimeout(() => carregarDados(), 500); // Refresh rápido
    } catch (error) {
      alert("Erro na operação.");
    } finally {
      setProcessando(false);
    }
  };

  const filtrarTickets = (statusAlvo: string) => {
    return tickets.filter(t => {
      const s = buscarValor(t, ['STATUS']);
      return s && s.toUpperCase().trim() === statusAlvo;
    });
  };

  const ticketsAguardando = filtrarTickets("AGUARDANDO");
  const ticketsAbertos = filtrarTickets("ABERTO");
  const ticketsFinalizados = filtrarTickets("FINALIZADO");

  // --- CARD COMPONENT (VISUAL NOVO) ---
  const RenderCard = ({ ticket }: { ticket: any }) => {
    const nomeRack = buscarValor(ticket, ['RACK']);
    const setor = buscarValor(ticket, ['SETORES', 'SETORES ATENDIDOS']);
    const nivel = buscarValor(ticket, ['NIVEL', 'ANDAR']); 
    const cor = buscarValor(ticket, ['COR']);
    const tipo = buscarValor(ticket, ['TIPO']);
    const locais = buscarValor(ticket, ['LOCAIS', 'LOCAIS DE REFERENCIA']);
    const chamadoAssyst = buscarValor(ticket, ['CHAMADO', 'CHAMADOS ASSYST']);
    const horario = buscarValor(ticket, ['HORARIO', 'HORÁRIO DE ABERTURA']);
    const fecham = buscarValor(ticket, ['HORAFECHAMENTO', 'HORÁRIO DE FECHAMENTO']);
    const solicitante = buscarValor(ticket, ['SOLICITANTE', 'TÉCNICO CATI']);
    const atendente = buscarValor(ticket, ['ATENDENTE', 'ATENDENTE PATRIMÔNIO']);
    const status = buscarValor(ticket, ['STATUS']);
    const manutencao = buscarValor(ticket, ['MANUTENCAO']) === "SIM";

    const corCSS = getCorCSS(cor || "Cinza");
    const isAmarelo = cor === "AMARELO";
    const txtColor = isAmarelo ? "text-black" : "text-white";
    const txtMuted = isAmarelo ? "text-black/70" : "text-white/70";
    const bgBadge = isAmarelo ? "bg-black/10" : "bg-black/30";

    const abrirModal = () => {
      setModalData({
        id: ticket.id,
        nomeRack, setor, cor, locais, tipo,
        horario, chamado: chamadoAssyst, 
        solicitante, atendente, status, fecham, nivel
      });
      setInputTecnico("");
      setModoTroca(false);
    };

    return (
      <div 
        onClick={abrirModal} 
        className={`cursor-pointer transform hover:scale-[1.02] transition-all duration-200 relative overflow-hidden rounded-xl border-l-[10px] shadow-lg ${corCSS} p-4 mb-3 min-h-[130px] flex flex-col justify-between`}
      >
        <div className="flex justify-between items-start">
          <h2 className={`text-3xl font-black ${txtColor} tracking-tighter`}>{nomeRack}</h2>
          <div className="flex flex-col items-end gap-1">
             {nivel && nivel !== "-" && (
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${bgBadge} ${txtColor} uppercase`}>
                 Nível: {nivel}
               </span>
             )}
             {manutencao && (
               <span className="text-[10px] font-bold bg-white text-red-600 px-2 py-0.5 rounded border border-red-600 animate-pulse">
                 PREDIAL
               </span>
             )}
          </div>
        </div>

        <div className="mt-2">
           <span className={`text-xs font-bold uppercase ${bgBadge} px-2 py-1 rounded ${txtColor}`}>
             {setor || "..."}
           </span>
        </div>

        <div className="flex justify-between items-center mt-auto border-t border-black/10 pt-2">
          <div className="flex items-center gap-1">
            <Clock size={12} className={txtColor} />
            <span className={`text-xs font-mono font-bold ${txtColor}`}>
                {status === "FINALIZADO" ? fecham : horario}
            </span>
          </div>
          
          {atendente ? (
             <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
               <User size={10} className={txtColor} />
               <span className={`text-[10px] font-bold uppercase ${txtColor} truncate max-w-[80px]`}>
                 {atendente.split(' ')[0]}
               </span>
             </div>
          ) : (
             <span className={`text-[10px] font-bold uppercase ${txtMuted}`}>
               Solicitante: {solicitante?.split(' ')[0] || "CATI"}
             </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold animate-pulse">CARREGANDO SISTEMA...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* TOAST DE ALERTA */}
      {showToast && (
        <div className="fixed top-24 right-6 z-50 bg-blue-600 border-l-4 border-white text-white p-4 rounded-lg shadow-2xl animate-bounce flex items-center gap-4 cursor-pointer hover:bg-blue-500 transition-colors" onClick={() => setShowToast(false)}>
           <div className="bg-white/20 p-2 rounded-full"><AlertCircle size={24} /></div>
           <div><p className="font-bold text-lg uppercase">Novo Chamado!</p></div>
        </div>
      )}

      {/* HEADER */}
      <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Server className="text-blue-500" />
            RACK<span className="text-blue-500">CONTROL</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="text-right flex items-center gap-3 border-l border-slate-800 pl-4">
             <button 
               onClick={testarSomManual}
               className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3 py-2 rounded text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
             >
               <Volume2 size={14} /> Testar Som
             </button>
             <div className="text-right">
                <div className="text-2xl font-black text-slate-100">{ticketsAguardando.length + ticketsAbertos.length}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Ativos</div>
             </div>
           </div>
        </div>
      </header>

      {/* GRID KANBAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        
        {/* COLUNA AGUARDANDO */}
        <section className="bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-4 bg-red-900/20 border-b border-red-900/30 flex justify-between items-center backdrop-blur-sm">
            <h2 className="text-red-400 font-black uppercase flex items-center gap-2">
              <AlertCircle size={20} /> Aguardando
            </h2>
            <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">
              {ticketsAguardando.length}
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            {ticketsAguardando.length === 0 && <p className="text-slate-600 text-sm text-center italic mt-10">Fila vazia</p>}
            {ticketsAguardando.map((t, i) => <RenderCard key={i} ticket={t} />)}
          </div>
        </section>

        {/* COLUNA EM ATENDIMENTO */}
        <section className="bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-4 bg-blue-900/20 border-b border-blue-900/30 flex justify-between items-center backdrop-blur-sm">
            <h2 className="text-blue-400 font-black uppercase flex items-center gap-2">
              <Briefcase size={20} /> Em Atendimento
            </h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
              {ticketsAbertos.length}
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            {ticketsAbertos.length === 0 && <p className="text-slate-600 text-sm text-center italic mt-10">Nenhum em andamento</p>}
            {ticketsAbertos.map((t, i) => <RenderCard key={i} ticket={t} />)}
          </div>
        </section>

        {/* COLUNA FINALIZADOS (Mantida conforme pedido) */}
        <section className="bg-slate-900/30 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
           <div className="p-4 bg-gray-800/20 border-b border-gray-800 flex justify-between items-center">
             <h2 className="text-gray-400 font-black uppercase flex items-center gap-2">
               <CheckCircle2 size={20} /> Finalizados
             </h2>
             <span className="bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs font-bold">
               {ticketsFinalizados.length}
             </span>
           </div>
           <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
             {/* Slice(0,4) mantido para mostrar apenas os ultimos */}
             {ticketsFinalizados.slice(0, 4).map((t, i) => <RenderCard key={i} ticket={t} />)}
           </div>
        </section>

      </div>

      {/* MODAL RICO & FUNCIONAL */}
      {modalData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header do Modal com Cor Dinâmica */}
            <div className={`p-6 ${getCorCSS(modalData.cor).split(' ')[0]} relative`}>
              <button onClick={() => setModalData(null)} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                <X size={20} className={modalData.cor === "AMARELO" ? "text-black" : "text-white"} />
              </button>
              
              <div className="flex justify-between items-end">
                <div>
                   <h2 className={`text-4xl font-black tracking-tighter ${modalData.cor === "AMARELO" ? "text-black" : "text-white"}`}>
                     {modalData.nomeRack}
                   </h2>
                   <p className={`font-bold opacity-90 ${modalData.cor === "AMARELO" ? "text-black" : "text-white"}`}>
                     {modalData.setor}
                   </p>
                </div>
                <div className="text-right">
                   <p className={`text-xs font-bold uppercase opacity-80 ${modalData.cor === "AMARELO" ? "text-black" : "text-white"}`}>Nível</p>
                   <p className={`text-2xl font-black ${modalData.cor === "AMARELO" ? "text-black" : "text-white"}`}>
                     {modalData.nivel || "-"}
                   </p>
                </div>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              
              {/* Info Técnica */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Chamado</p>
                    <p className="text-white font-semibold text-sm">#{modalData.chamado || "--"}</p>
                 </div>
                 <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Solicitante</p>
                    <p className="text-white font-semibold text-sm truncate">{modalData.solicitante || "CATI"}</p>
                 </div>
              </div>

              {/* Locais */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <h3 className="text-blue-400 text-xs font-bold uppercase flex items-center gap-2 mb-2">
                  <MapPin size={14} /> Locais Atendidos
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {modalData.locais || "Sem locais cadastrados."}
                </p>
              </div>

              {/* Ações (Status Logic) */}
              <div className="pt-4 border-t border-slate-800">
                {modalData.status?.toUpperCase().trim() === "AGUARDANDO" && (
                  <div className="space-y-3">
                    <p className="text-center text-slate-400 text-sm">Para iniciar, digite seu nome:</p>
                    <input 
                      autoFocus
                      value={inputTecnico}
                      onChange={e => setInputTecnico(e.target.value)}
                      placeholder="Nome do Técnico"
                      className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                      onClick={() => executarAcao('aceitar')}
                      disabled={processando}
                      className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-black uppercase text-white transition-colors flex items-center justify-center gap-2"
                    >
                      {processando ? "Iniciando..." : "INICIAR ATENDIMENTO"}
                    </button>
                  </div>
                )}

                {modalData.status?.toUpperCase().trim() === "ABERTO" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-blue-900/20 p-3 rounded border border-blue-900/50">
                      <span className="text-blue-400 text-xs font-bold uppercase">Atendente Atual</span>
                      <span className="text-white font-bold">{modalData.atendente}</span>
                    </div>

                    {!modoTroca ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setModoTroca(true)}
                          className="bg-slate-800 hover:bg-slate-700 p-3 rounded font-bold text-slate-300 text-sm transition-colors"
                        >
                          Trocar
                        </button>
                        <button 
                          onClick={() => executarAcao('finalizar')}
                          disabled={processando}
                          className="bg-green-600 hover:bg-green-500 p-3 rounded font-bold text-white text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} /> Finalizar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-slate-800 p-3 rounded-xl border border-slate-700 animate-in fade-in">
                        <p className="text-yellow-500 text-xs font-bold uppercase">Troca de Responsável</p>
                        <input 
                          autoFocus
                          value={inputTecnico}
                          onChange={e => setInputTecnico(e.target.value)}
                          placeholder="Nome do Novo Técnico"
                          className="w-full bg-slate-950 border border-slate-700 p-2 rounded text-white text-sm"
                        />
                        <div className="flex gap-2">
                           <button onClick={()=>setModoTroca(false)} className="flex-1 bg-slate-700 p-2 rounded text-xs font-bold">Cancelar</button>
                           <button onClick={()=>executarAcao('trocar')} className="flex-1 bg-yellow-600 p-2 rounded text-xs font-bold text-black">Confirmar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {modalData.status?.toUpperCase().trim() === "FINALIZADO" && (
                   <div className="text-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                     <div className="flex justify-center mb-2"><CheckCircle2 size={32} className="text-green-500" /></div>
                     <p className="text-green-500 font-bold uppercase text-lg">Atendimento Concluído</p>
                     <p className="text-slate-400 text-sm">Fechado às {modalData.fecham}</p>
                   </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}