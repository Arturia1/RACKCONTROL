import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";
import { registrarLog } from "@/lib/security";
import { getServerSession } from "next-auth"; // Para pegar o usuário logado

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    // 🔒 BLOQUEIO: Apenas autenticados podem alterar
    if (!session || !session.user) {
       return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rowIndex = parseInt(id);
    const userEmail = session.user.email || "Desconhecido";

    // 🔒 CORREÇÃO DE SEGURANÇA: Impede edição do cabeçalho
    if (isNaN(rowIndex) || rowIndex < 2) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();

    // AÇÃO 1: ACEITAR CHAMADO
    if (body.action === 'aceitar') {
      const tecnicoPatrimonio = body.tecnico || session.user.name; // Usa o logado se não vier no body
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!M${rowIndex}:N${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["ABERTO", tecnicoPatrimonio]] },
      });
      
      await registrarLog(userEmail, "ACEITAR_CHAMADO", `Linha ${rowIndex} assumida por ${tecnicoPatrimonio}`);
      return NextResponse.json({ message: "Atendimento iniciado!" });
    }

    // AÇÃO 2: FINALIZAR CHAMADO
    else if (body.action === 'finalizar') {
      const horaFechamento = new Date().toLocaleTimeString('pt-BR');
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!L${rowIndex}:M${rowIndex}`, 
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[horaFechamento, "FINALIZADO"]] },
      });

      await registrarLog(userEmail, "FINALIZAR_CHAMADO", `Linha ${rowIndex} fechada.`);
      return NextResponse.json({ message: "Atendimento finalizado!" });
    }

    // AÇÃO 3: TROCAR TÉCNICO (NOVA FEATURE)
    else if (body.action === 'trocar_tecnico') {
      const novoTecnico = body.novoTecnico;
      if (!novoTecnico) return NextResponse.json({ error: "Novo técnico obrigatório" }, { status: 400 });

      // Atualiza apenas a coluna N (Atendente)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!N${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[novoTecnico]] },
      });

      await registrarLog(userEmail, "TROCAR_TECNICO", `Linha ${rowIndex} transferida para ${novoTecnico}`);
      return NextResponse.json({ message: "Técnico atualizado!" });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });

  } catch (error: any) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}