import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets"; // Removido RANGE_NAME

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowIndex = parseInt(id);

    if (isNaN(rowIndex)) {
       return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const sheets = await getSheetsInstance();

    // Atualiza a Coluna K (STATUS) para "FINALIZADO"
    // Note que usamos o nome da aba diretamente aqui
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Página1!K${rowIndex}`, 
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["FINALIZADO"]],
      },
    });

    return NextResponse.json({ message: "Atendimento finalizado!" });
  } catch (error: any) {
    console.error("Erro ao finalizar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}