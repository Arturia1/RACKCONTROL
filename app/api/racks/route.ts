import { getSheetsInstance, SHEET_ID } from '@/lib/googleSheets';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    // Lê até a Coluna N para pegar o Atendente
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
          // Remove espaços e acentos para criar chaves fáceis de usar
          const cleanKey = header.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
          obj[cleanKey] = row[i] || "";
        }
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

    // 1. CONSULTA DB (Aba de Referência)
    const dbResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "DB!A:F",
    });
    const dbRows = dbResponse.data.values || [];
    
    // Normaliza input para busca
    const rackInput = body.rackNome?.toString().replace(/\s/g, '').toUpperCase();
    const rackEncontrado = dbRows.find(row => 
      row[0]?.toString().replace(/\s/g, '').toUpperCase() === rackInput
    );

    // Preenche dados do Rack (ou usa o input se não achar no DB)
    const infoRack = rackEncontrado ? rackEncontrado[0] : body.rackNome.toUpperCase();
    const infoSetor = rackEncontrado ? rackEncontrado[1] : "";
    const infoCor = rackEncontrado ? rackEncontrado[2] : "Cinza";
    const infoNivel = rackEncontrado ? rackEncontrado[3] : "";
    const infoTipo = rackEncontrado ? rackEncontrado[4] : "";
    const infoLocais = rackEncontrado ? rackEncontrado[5] : "";

    // Dados de Tempo
    const dataAtual = new Date();
    const dataAbertura = dataAtual.toLocaleDateString('pt-BR'); 
    const horaAbertura = dataAtual.toLocaleTimeString('pt-BR');
    
    // Técnico que preencheu o formulário (CATI)
    const solicitanteCati = body.tecnico || "Não identificado"; 

    // MONTAGEM DA LINHA (Ordem exata das colunas A -> N)
    const valores = [
      infoRack,           // A: Rack
      infoSetor,          // B: Setor
      infoCor,            // C: Cor
      infoNivel,          // D: Nível
      infoTipo,           // E: Tipo
      infoLocais,         // F: Locais
      body.chamado,       // G: CHAMADOS ASSYST
      solicitanteCati,    // H: TÉCNICO CATI (Solicitante)
      body.manutencao,    // I: Manutenção
      dataAbertura,       // J: Data
      horaAbertura,       // K: Hora Abertura
      "",                 // L: Hora Fechamento (Vazio)
      "AGUARDANDO",       // M: Status Inicial
      ""                  // N: Atendente Patrimônio (Vazio)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A:N",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [valores] },
    });

    return NextResponse.json({ message: 'Ticket criado com sucesso!' });
  } catch (error: any) {
    console.error("Erro no POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}