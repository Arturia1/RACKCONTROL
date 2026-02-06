import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Busca os tickets no Postgres e formata para o Front
export async function GET() {
  try {
    const ticketsDB = await prisma.ticket.findMany({
      orderBy: { id: 'desc' } // Mais recentes no topo
    });

    // Mapeamento: Banco (camelCase) -> Front (UPPERCASE)
    const ticketsFormatados = ticketsDB.map(t => ({
      id: t.id,
      RACK: t.rackNome,
      SETORES: t.setor,
      NIVEL: t.nivel,
      TIPO: t.tipo,
      LOCAIS: t.locais,
      CHAMADO: t.chamadoAssyst,
      SOLICITANTE: t.solicitante,
      MANUTENCAO: t.manutencao ? "SIM" : "NÃO", // Converte Boolean -> String pro Front ler
      HORARIO: t.horarioAbertura,
      COR: t.cor,
      HORAFECHAMENTO: t.horaFechamento || "",
      STATUS: t.status,
      ATENDENTE: t.atendente || ""
    }));

    return NextResponse.json(ticketsFormatados);
  } catch (error) {
    console.error("Erro GET:", error);
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  }
}

// POST: Cria um novo Ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Normaliza o input para busca (ex: "50 c1" vira "50C1")
    const rackInput = body.rackNome?.toString().toUpperCase().replace(/\s/g, "");

    // 1. Busca dados do Rack no Inventário (Tabela Rack)
    const rackInventario = await prisma.rack.findFirst({
      where: {
        nome: rackInput
      }
    });

    // CORREÇÃO AQUI: Tratamento do Booleano
    // Se vier "Sim" (string) ou true (boolean), vira true. O resto vira false.
    const isManutencao = body.manutencao === "Sim" || body.manutencao === true || body.manutencao === "true";

    // 2. Prepara os dados
    const dadosTicket = {
      rackNome: body.rackNome.toUpperCase(),
      setor: rackInventario ? rackInventario.setor : "N/I",
      nivel: rackInventario ? rackInventario.nivel : "-",
      tipo: rackInventario ? rackInventario.tipo : "",
      locais: rackInventario ? rackInventario.locais : "-",
      chamadoAssyst: body.chamado,
      solicitante: body.tecnico || "Técnico",
      manutencao: isManutencao, // Agora envia 'true' ou 'false' puro
      horarioAbertura: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      cor: rackInventario ? rackInventario.cor : "CINZA",
      status: "AGUARDANDO"
    };

    // 3. Salva no Banco
    await prisma.ticket.create({
      data: dadosTicket
    });

    return NextResponse.json({ message: "Criado com sucesso!" });

  } catch (error: any) {
    console.error("Erro POST:", error);
    // Retorna o erro detalhado para facilitar o debug
    return NextResponse.json({ error: "Erro ao criar ticket: " + error.message }, { status: 500 });
  }
}