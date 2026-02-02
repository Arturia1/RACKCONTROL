import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID, RANGE_NAME } from "@/lib/googleSheets";

// O tipo do contexto agora exige que params seja uma Promise
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Você DEVE dar await no params para pegar o ID
    const { id } = await params;
    const rowIndex = parseInt(id);

    const sheets = await getSheetsInstance();

    // 2. Atualiza a Coluna K (STATUS) para "FINALIZADO"
    // O range K é a 11ª coluna
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Página1!K${rowIndex}`, // Ajuste "Página1" se o nome da aba for outro
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["FINALIZADO"]],
      },
    });

    return NextResponse.json({ message: "Atendimento finalizado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao finalizar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}