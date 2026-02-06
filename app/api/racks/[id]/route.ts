import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    let dadosAtualizacao: any = {};
    let acaoLog = "";
    let detalhesLog = "";
    let usuarioLog = body.tecnico || body.novoTecnico || "Sistema";

    // Define a lógica da ação
    if (body.action === 'aceitar') {
      dadosAtualizacao = { status: "ABERTO", atendente: body.tecnico };
      acaoLog = "ACEITAR";
      detalhesLog = `Assumido por ${body.tecnico}`;
    } 
    else if (body.action === 'finalizar') {
      dadosAtualizacao = { 
        status: "FINALIZADO", 
        horaFechamento: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) 
      };
      acaoLog = "FINALIZAR";
      detalhesLog = "Atendimento concluído";
    }
    else if (body.action === 'trocar_tecnico') {
      dadosAtualizacao = { atendente: body.novoTecnico };
      acaoLog = "TROCA";
      detalhesLog = `Transferido para ${body.novoTecnico}`;
    }

    // Atualiza o Ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: dadosAtualizacao
    });

    // Cria o Log de auditoria
    await prisma.log.create({
      data: {
        ticketId: ticketId,
        usuario: usuarioLog,
        acao: acaoLog,
        detalhes: detalhesLog
      }
    });

    return NextResponse.json({ message: "Atualizado!" });

  } catch (error: any) {
    console.error("Erro PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}