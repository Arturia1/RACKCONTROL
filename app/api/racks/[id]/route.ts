import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";
import { auth } from "@/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(); 
    const { id } = await params;
    const body = await request.json();
    const rowIndex = parseInt(id);

    if (isNaN(rowIndex) || rowIndex < 37) {
      return NextResponse.json({ error: "ID de linha inválido" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();
    const dataHoraLog = new Date().toLocaleString("pt-BR");
    const usuarioLogado = session?.user?.name || "Desconhecido";
    
    let acaoLog = "";
    let detalhesLog = "";

    // --- AÇÃO: ACEITAR / INICIAR ATENDIMENTO ---
    if (body.action === 'aceitar') {
      const observacao = body.observacoes || "";
      const tecnicoAtendente = body.tecnico || usuarioLogado;

      // Atualiza M (Obs), N (Atendente) e P (Status - Índice 15)
      // Note que a coluna O (Justificativa) fica vazia por enquanto
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!M${rowIndex}:P${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { 
          values: [[observacao, tecnicoAtendente, "", "ABERTO"]] 
        },
      });

      acaoLog = "INICIAR";
      detalhesLog = `Atendimento iniciado por ${usuarioLogado}. Técnico atribuído: ${tecnicoAtendente}`;
    }

    // --- AÇÃO: FINALIZAR ATENDIMENTO ---
    else if (body.action === 'finalizar') {
      const horaFechamento = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // L (11): Hora Fim, O (14): Justificativa, P (15): Status
      // A coluna M (Observações) NÃO é tocada para permanecer imutável
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!L${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[horaFechamento]] },
      });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!O${rowIndex}:P${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["Não aplicável", "FINALIZADO"]] },
      });
      
      acaoLog = "FINALIZAR";
      detalhesLog = "Atendimento concluído com sucesso.";
    }

    // --- AÇÃO: CANCELAR TICKET ---
    else if (body.action === 'cancelar') {
      if (!body.justificativa) {
        return NextResponse.json({ error: "Justificativa de cancelamento obrigatória." }, { status: 400 });
      }

      // O (14): Justificativa, P (15): Status
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!O${rowIndex}:P${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[body.justificativa, "CANCELADO"]] },
      });

      acaoLog = "CANCELAR";
      detalhesLog = `Cancelado por ${usuarioLogado}. Motivo: ${body.justificativa}`;
    }

    // --- AÇÃO: TROCAR TÉCNICO ---
    else if (body.action === 'trocar_tecnico') {
      if (!body.novoTecnico) return NextResponse.json({ error: "Novo técnico é obrigatório" }, { status: 400 });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!N${rowIndex}`, // Coluna N: Atendente
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[body.novoTecnico]] },
      });
      
      acaoLog = "TROCA";
      detalhesLog = `Responsabilidade transferida para ${body.novoTecnico} por ${usuarioLogado}`;
    }
    
    else {
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }

    // --- GRAVAÇÃO DO LOG DE AUDITORIA ---
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "LOGS!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[dataHoraLog, usuarioLogado, acaoLog, detalhesLog]],
      },
    });

    return NextResponse.json({ message: "Operação realizada com sucesso!" });

  } catch (error: any) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}