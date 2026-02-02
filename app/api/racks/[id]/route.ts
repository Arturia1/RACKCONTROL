import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rowIndex = parseInt(id);
    const sheets = await getSheetsInstance();

    const dataTermino = new Date().toLocaleString('pt-BR');

    // Atualiza Coluna K (STATUS) para FINALIZADO e Coluna N (TÉRMINO)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `RACKS!K${rowIndex}:N${rowIndex}`, 
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "FINALIZADO", // K
          "",           // L (Pula)
          "",           // M (Pula)
          dataTermino   // N (Data Término)
        ]],
      },
    });

    return NextResponse.json({ message: "Finalizado!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}