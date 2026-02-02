import { getSheetsInstance, SHEET_ID } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    
    // ALTERAÇÃO: Range alterado para A:N para ler a nova coluna de término
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A:N", 
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return NextResponse.json([]);

    const headers = rows[0];

    const data = rows.slice(1).map((row, index) => {
      let obj: any = { id: index + 2 };
      
      headers.forEach((header, i) => {
        if (header) {
          const cleanKey = header.toString().trim().toUpperCase();
          obj[cleanKey] = row[i] || "";
        }
      });
      return obj;
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro no GET:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = await getSheetsInstance();

    const nomeTecnicoFinal = body.manutencao === "Sim" 
      ? `${body.tecnico} (Manutenção)` 
      : body.tecnico;

    // NOVIDADE: Gera a data e hora exata da abertura no padrão brasileiro
    const dataHoraAbertura = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // ORDEM ATUALIZADA (A até N)
    const valores = [
      "", "", "", "", "", "",     // A-F
      nomeTecnicoFinal,           // G
      body.chamado,               // H
      body.manutencao,            // I
      dataHoraAbertura,           // J (Substitui body.dataAbertura pela hora real)
      "ABERTO",                   // K
      body.tecnicoCati,           // L
      body.rackNome,              // M
      ""                          // N (Coluna de DATA TÉRMINO inicia vazia)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A:N", // Alterado para N
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [valores] },
    });

    return NextResponse.json({ message: 'Ticket criado!' });
  } catch (error: any) {
    console.error("Erro no POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}