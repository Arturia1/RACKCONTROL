import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const rowIndex = parseInt(id);
    const sheets = await getSheetsInstance();

    // AÇÃO 1: ACEITAR O CHAMADO
    // Muda Status para ABERTO e preenche ATENDENTE (Coluna N)
    if (body.action === 'aceitar') {
      const tecnicoPatrimonio = body.tecnico || "Patrimônio";
      
      // Atualiza Colunas M (Status) e N (Atendente)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!M${rowIndex}:N${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["ABERTO", tecnicoPatrimonio]] },
      });

      return NextResponse.json({ message: "Atendimento iniciado!" });
    }

    // AÇÃO 2: FINALIZAR O CHAMADO
    // Preenche Hora Fechamento (L) e Status (M)
    else {
      const horaFechamento = new Date().toLocaleTimeString('pt-BR');
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `RACKS!L${rowIndex}:M${rowIndex}`, 
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            horaFechamento, // Coluna L
            "FINALIZADO"    // Coluna M
          ]],
        },
      });

      return NextResponse.json({ message: "Atendimento finalizado!" });
    }

  } catch (error: any) {
    console.error("Erro no PATCH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}