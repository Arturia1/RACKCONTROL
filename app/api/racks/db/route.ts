import { getSheetsInstance, SHEET_ID } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "DB!A:F", 
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return NextResponse.json({});

    const mapaRacks: any = {};
    rows.slice(1).forEach((row) => {
      const nomeRack = row[0]?.toString().replace(/\s/g, '').toUpperCase();
      if (nomeRack) {
        mapaRacks[nomeRack] = {
          setor: row[1] || "",
          cor: row[2] || "Cinza",
          nivel: row[3] || "",
          tipo: row[4] || "",
          locais: row[5] || ""
        };
      }
    });

    return NextResponse.json(mapaRacks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}