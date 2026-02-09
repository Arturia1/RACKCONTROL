"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

export default function VisaoPatrimonio() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalData, setModalData] = useState<any | null>(null);
  const [inputTecnico, setInputTecnico] = useState("");
  const [obs, setObs] = useState(""); 
  const [processando, setProcessando] = useState(false);
  const [modoTroca, setModoTroca] = useState(false);
  const [somHabilitado, setSomHabilitado] = useState(false); // Adicionado para controle de áudio

  // --- CONTROLE DE PERMISSÃO (RBAC) ---
  const userRole = (session?.user as any)?.role;
  const canManage = userRole === "ADMIN_PATRIMONIO";

  // --- CONTROLE DE NOTIFICAÇÕES ---
  const [showToast, setShowToast] = useState(false); 
  const prevAguardandoCount = useRef(0);
  const isFirstLoad = useRef(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const SOM_BEEP = "data:audio/mp3;base64,//uQxAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq...";

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

  useEffect(() => {
    // Aponta para o arquivo na pasta public
    audioRef.current = new Audio("/alerta.mp3"); 
    audioRef.current.volume = 0.8;

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const testarSomManual = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setSomHabilitado(true); // Habilita o som para futuras notificações
          alert("🔊 Som habilitado e funcionando!");
        })
        .catch(() => alert("Clique na página primeiro para habilitar o áudio."));
    }
  };

  const dispararAlerta = (qtdNovos: number) => {
    // Só toca se o usuário já tiver habilitado o som via clique
    if (somHabilitado && audioRef.current) {
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
        setTickets(data);
        const aguardandoAgora = data.filter((t: any) => {
          const s = buscarValor(t, ['STATUS']);
          return s && s.toUpperCase().trim() === "AGUARDANDO";
        }).length;

        // Dispara o alerta apenas se o número de tickets aumentou
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
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, [somHabilitado]); // Re-executa caso o estado de som mude

  const executarAcao = async (tipo: 'aceitar' | 'finalizar' | 'trocar' | 'cancelar', justificativa?: string) => {
    if (!canManage) return alert("Acesso negado: Somente administradores do Patrimônio.");
    
    setProcessando(true);
    try {
      const body: any = { action: tipo };
      
      if (tipo === 'aceitar') {
        if (!inputTecnico.trim()) return alert("Defina o técnico responsável.");
        body.tecnico = inputTecnico;
        body.observacoes = obs; 
      }
      
      if (tipo === 'trocar') {
        if (!inputTecnico.trim()) return alert("Digite o nome do novo técnico.");
        body.action = 'trocar_tecnico'; 
        body.novoTecnico = inputTecnico;
      }

      if (tipo === 'cancelar') {
        body.justificativa = justificativa;
      }

      const res = await fetch(`/api/racks/${modalData.ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setModalData(null);
        setInputTecnico("");
        setObs("");
        setModoTroca(false);
        carregarDados();
      }
    } catch (error) {
      alert("Erro na operação.");
    } finally {
      setProcessando(false);
    }
  };

  const RenderCard = ({ ticket }: { ticket: any }) => {
    const status = buscarValor(ticket, ['STATUS']);
    const nomeRack = buscarValor(ticket, ['RACK']);
    const setor = buscarValor(ticket, ['SETORES']);
    const nivel = buscarValor(ticket, ['NIVEL', 'ANDAR']);
    const cor = buscarValor(ticket, ['COR']);
    const atendente = buscarValor(ticket, ['ATENDENTE']);
    const corCSS = getCorCSS(cor || "Cinza");

    return (
      <div 
        onClick={() => {
          setModalData({
            ticket,
            nomeRack,
            status,
            atendente,
            setor: buscarValor(ticket, ['SETORES']),
            nivel,
            cor,
            locais: buscarValor(ticket, ['LOCAIS']), 
            horario: buscarValor(ticket, ['HORARIO_ABERTURA', 'HORARIO']), 
            chamado: buscarValor(ticket, ['CHAMADO']), 
            solicitante: buscarValor(ticket, ['SOLICITANTE']),
            fecham: buscarValor(ticket, ['HORAFECHAMENTO']),
            obsRegistrada: buscarValor(ticket, ['OBSERVACOES']),
            justificativa: buscarValor(ticket, ['JUSTIFICATIVA'])
          });
          setInputTecnico(session?.user?.name || ""); 
          setObs("");
          setModoTroca(false);
        }} 
        className={`cursor-pointer transform hover:scale-[1.02] transition-all relative overflow-hidden rounded-2xl border-l-[12px] shadow-lg ${corCSS} p-4 mb-4 min-h-[140px] flex flex-col justify-between`}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{nomeRack}</h2>
          <span className="text-[9px] bg-black/40 px-2 py-1 rounded text-white font-bold uppercase border border-white/10">{status}</span>
        </div>

        <div className="flex justify-between items-end mt-2">
           <div className="flex gap-2">
              <p className="text-xs font-bold text-white/90 uppercase bg-black/20 px-2 py-1 rounded inline-block">{setor || "..."}</p>
              {nivel && nivel !== "-" && (
                 <p className="text-xs font-bold text-white/90 uppercase bg-white/20 px-2 py-1 rounded inline-block border border-white/10">{nivel}</p>
              )}
           </div>
           {atendente && (
             <span className="text-[10px] bg-blue-900/90 border border-blue-400 px-2 py-1 rounded text-white font-bold">{atendente.split(' ')[0]}</span>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 font-sans text-white overflow-x-hidden relative">
      {showToast && (
        <div className="fixed top-24 right-6 z-50 bg-blue-600 border-l-4 border-white text-white p-4 rounded-lg shadow-2xl animate-bounce flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-full">🔔</div>
          <p className="font-bold uppercase tracking-tight">Novo Chamado!</p>
        </div>
      )}

      <header className="mb-6 flex justify-between items-center border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black tracking-tight">VISÃO <span className="text-blue-500">PATRIMÔNIO</span></h1>
        <div className="flex items-center gap-4">
          {/* Botão de Som ajustado para habilitar o estado */}
          <button 
            onClick={testarSomManual} 
            className={`${somHabilitado ? 'bg-green-900/20 text-green-500 border-green-900' : 'bg-gray-800 text-gray-300 border-gray-700'} hover:opacity-80 px-3 py-1 rounded text-xs font-bold transition-all border`}
          >
            {somHabilitado ? "🔊 Som Ativo" : "🔇 Ativar Som"}
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-900/50">SAIR</button>
        </div>
      </header>

      {loading ? <div className="text-center mt-20 animate-pulse font-bold text-gray-500">Carregando Painel...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {["AGUARDANDO", "ABERTO", "FINALIZADO"].map((statusAlvo) => (
            <div key={statusAlvo} className={`bg-gray-900/50 rounded-2xl p-4 border border-gray-800 flex flex-col ${statusAlvo === "FINALIZADO" ? "opacity-60" : ""}`}>
              <h3 className={`text-lg font-bold mb-4 uppercase tracking-wide border-b border-gray-800 pb-2 flex items-center gap-2 ${statusAlvo === "AGUARDANDO" ? "text-yellow-500" : statusAlvo === "ABERTO" ? "text-blue-500" : "text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${statusAlvo === "AGUARDANDO" ? "bg-yellow-500 animate-pulse" : statusAlvo === "ABERTO" ? "bg-blue-500 animate-pulse" : "bg-gray-500"}`}></span>
                {statusAlvo} ({tickets.filter(t => buscarValor(t, ['STATUS'])?.toUpperCase().trim() === statusAlvo).length})
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {tickets.filter(t => buscarValor(t, ['STATUS'])?.toUpperCase().trim() === statusAlvo).map((t, i) => <RenderCard key={i} ticket={t} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setModalData(null)}>
          <div className="bg-gray-900 border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl p-6 relative animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalData(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>
            <h2 className="text-5xl font-black text-white tracking-tighter mb-1">{modalData.nomeRack}</h2>
            <p className="text-xl text-gray-400 mb-6 font-bold">{modalData.setor}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
               <div><p className="text-gray-500 text-[10px] font-bold uppercase">Solicitante</p><p className="text-white font-bold">{modalData.solicitante}</p></div>
               <div><p className="text-gray-500 text-[10px] font-bold uppercase">Chamado</p><p className="text-white font-bold">#{modalData.chamado}</p></div>
               <div><p className="text-gray-500 text-[10px] font-bold uppercase text-blue-400">Nível</p><p className="text-white font-bold">{modalData.nivel && modalData.nivel !== "-" ? modalData.nivel : "N/I"}</p></div>         
               <div className="col-span-2 md:col-span-3 border-t border-gray-700 pt-2"><p className="text-gray-500 text-[10px] font-bold uppercase text-blue-400">Setor</p><p className="text-white font-bold">{modalData.cor && modalData.cor !== "-" ? modalData.cor : "N/I"}</p></div>
               <div className="col-span-2 md:col-span-3 border-t border-gray-700 pt-2"><p className="text-gray-500 text-[10px] font-bold uppercase">Localização</p><p className="text-gray-300 text-sm italic">"{modalData.locais}"</p></div>
            </div>

            <div className="pt-4">
              {canManage ? (
                <div className="space-y-4">
                  {modalData.status === "AGUARDANDO" && (
                    <div className="space-y-4 bg-yellow-900/10 border border-yellow-700/30 p-4 rounded-xl">
                      <div><label className="block text-xs font-bold text-yellow-500 mb-2 uppercase">Atribuir Técnico</label><input type="text" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none" value={inputTecnico} onChange={(e) => setInputTecnico(e.target.value)} /></div>
                      <div><label className="block text-xs font-bold text-yellow-500 mb-2 uppercase">Obs. Iniciais (Coluna M)</label><textarea placeholder="Plano de ação..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-yellow-500 outline-none h-24" value={obs} onChange={(e) => setObs(e.target.value)} /></div>
                      <button onClick={() => executarAcao('aceitar')} disabled={processando} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black uppercase py-4 rounded-xl shadow-lg active:scale-95">Iniciar Atendimento</button>
                    </div>
                  )}
                  {modalData.status === "ABERTO" && (
                    <>
                      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700"><p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Obs. de Abertura:</p><p className="text-gray-300 text-sm italic">{modalData.obsRegistrada || "Sem observações."}</p></div>
                      {!modoTroca ? (
                        <><button onClick={() => executarAcao('finalizar')} disabled={processando} className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase py-4 rounded-xl shadow-lg active:scale-95">Finalizar Chamado</button><button onClick={() => setModoTroca(true)} className="w-full text-xs text-gray-500 underline text-center hover:text-white transition-colors">Transferir Técnico</button></>
                      ) : (
                        <div className="bg-gray-800 border border-yellow-700/50 p-4 rounded-xl animate-in zoom-in"><p className="text-yellow-500 text-[10px] font-bold uppercase mb-2">Novo Responsável</p><input type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white mb-3 outline-none focus:border-yellow-500" value={inputTecnico} onChange={(e) => setInputTecnico(e.target.value)} autoFocus /><div className="flex gap-2"><button onClick={() => setModoTroca(false)} className="flex-1 bg-gray-700 text-white text-sm font-bold py-2 rounded-lg">Cancelar</button><button onClick={() => executarAcao('trocar')} className="flex-1 bg-yellow-600 text-white text-sm font-bold py-2 rounded-lg">Confirmar</button></div></div>
                      )}
                    </>
                  )}
                  {(modalData.status === "AGUARDANDO" || modalData.status === "ABERTO") && !modoTroca && (
                    <button onClick={() => { const motivo = prompt("Justificativa:"); if (motivo) executarAcao('cancelar', motivo); }} className="w-full border border-red-900 text-red-500 hover:bg-red-900/20 py-2 rounded-lg text-[10px] font-black uppercase mt-4 transition-all">Cancelar Ticket</button>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-gray-800/50 rounded-xl text-center border border-dashed border-gray-700">
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Modo de Visualização</p>
                  {modalData.obsRegistrada && <p className="text-gray-400 text-sm italic mt-3">"{modalData.obsRegistrada}"</p>}
                  {modalData.justificativa && modalData.status === "CANCELADO" && (<p className="text-red-400 text-sm italic mt-3 font-bold">Cancelado: {modalData.justificativa}</p>)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}