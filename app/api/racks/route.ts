import { getSheetsInstance, SHEET_ID } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

const RANGE_NAME = "RACKS!A:M";

export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE_NAME,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return NextResponse.json([]);

    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      let obj: any = { id: index + 2 }; 
      headers.forEach((header, i) => {
        const key = header ? header.toString().trim() : `COL_${i}`;
        obj[key] = row[i] || "";
      });
      return obj;
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = await getSheetsInstance();
    
    // REGRA SOLICITADA: Se manutenção for Sim, adiciona o sufixo ao nome do técnico
    const nomeTecnicoFinal = body.manutencao === "Sim" 
      ? `${body.tecnico} (Manutenção)` 
      : body.tecnico;

    // Mapeamento Rigoroso das Colunas (A-M)
    const valores = [
      "", "", "", "", "", "",     // A até F
      nomeTecnicoFinal,           // G: TÉCNICO PATR. QUE ABRIU O RACK
      body.chamado,               // H: CHAMADOS ASSYST
      body.manutencao,            // I: RACK ABRETO PELA MANUTENÇÃO
      body.dataAbertura,          // J: DATA DE ABERTURA DO RACK
      "ABERTO",                   // K: STATUS
      body.tecnicoCati,           // L: TÉCNICO CATI
      body.rackNome               // M: RACK SOLICITADO
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE_NAME,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [valores] },
    });

    return NextResponse.json({ message: 'OK' });
  } catch (error: any) {
    console.error("ERRO NO POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}