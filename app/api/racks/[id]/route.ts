import { getSheetsInstance, SHEET_ID } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const sheets = await getSheetsInstance();
    const rowId = params.id;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `RACKS!K${rowId}`, // Coluna K (Status) na aba RACKS
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['FINALIZADO']],
      },
    });

    return NextResponse.json({ message: 'Finalizado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}