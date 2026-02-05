import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // O ID agora é EXATAMENTE o número da linha no Excel
    const rowIndex = parseInt(id);

    if (isNaN(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();
    const dataHora = new Date().toLocaleString("pt-BR");
    let acaoLog = "";
    let detalhesLog = "";
    let usuarioLog = body.tecnico || body.novoTecnico || "Local";

    if (body.action === 'aceitar') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!M${rowIndex}:N${rowIndex}`, // Atualiza Status e Atendente
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["ABERTO", body.tecnico]] },
      });
      acaoLog = "ACEITAR";
      detalhesLog = `Assumido por ${body.tecnico}`;
    }

    else if (body.action === 'finalizar') {
      const horaFechamento = new Date().toLocaleTimeString('pt-BR');
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!L${rowIndex}:M${rowIndex}`, // Atualiza Fechamento e Status
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[horaFechamento, "FINALIZADO"]] },
      });
      acaoLog = "FINALIZAR";
      detalhesLog = "Atendimento concluído";
    }

    else if (body.action === 'trocar_tecnico') {
      if (!body.novoTecnico) return NextResponse.json({ error: "Técnico obrigatório" }, { status: 400 });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!N${rowIndex}`, // Atualiza só o Atendente
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[body.novoTecnico]] },
      });
      acaoLog = "TROCA";
      detalhesLog = `Transferido para ${body.novoTecnico}`;
    }
    
    else {
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }

    // Log
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "LOGS!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[dataHora, usuarioLog, acaoLog, detalhesLog]],
      },
    });

    return NextResponse.json({ message: "Atualizado!" });

  } catch (error: any) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}