import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

// --- GET: BUSCAR DADOS NA NOVA ESTRUTURA (A até P) ---
export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A37:P", // Abrange as 16 colunas configuradas
    });

    const rows = response.data.values || [];
    const ticketsValidos = rows.map((row, index) => {
      if (!row[0] || row[0].trim() === "") return null;

      return {
        id: index + 37,
        RACK: row[0] || "",
        SETORES: row[1] || "",
        COR: row[2] || "CINZA",
        NIVEL: row[3] || "",
        SALA_TIPO: row[4] || "",
        LOCAIS: row[5] || "",
        CHAMADO: row[6] || "",
        SOLICITANTE: row[7] || "",
        MANUTENCAO: row[8] || "",
        DATA: row[9] || "",
        HORARIO_ABERTURA: row[10] || "",
        HORAFECHAMENTO: row[11] || "",
        OBSERVACOES: row[12] || "",
        ATENDENTE: row[13] || "",
        JUSTIFICATIVA: row[14] || "",
        STATUS: row[15] || "AGUARDANDO",
      };
    }).filter(item => item !== null);

    return NextResponse.json(ticketsValidos.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  }
}

// --- POST: CRIAR TICKET COM 16 COLUNAS E AUDITORIA ---
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); // Captura o usuário logado para auditoria
    const body = await req.json();
    const sheets = await getSheetsInstance();

    // 1. Busca metadados no Inventário (Aba DB)
    const dbResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "DB!A:F", 
    });
    const dbRows = dbResponse.data.values || [];
    
    const rackInput = body.rackNome?.toString().toUpperCase().trim();
    const rackInfo = dbRows.find(row => 
      row[0]?.toString().toUpperCase().trim() === rackInput
    );

    // 2. Prepara variáveis de tempo e identificação
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Auditoria: Prioriza o nome da sessão de login
    const solicitanteReal = session?.user?.name || body.tecnico || "CATI";

    // 3. Monta a nova linha rigorosamente na ordem A-P (16 colunas)
    const novaLinha = [
      rackInput,                      // A: RACK
      rackInfo ? rackInfo[1] : "N/I", // B: SETORES ATENDIDOS
      rackInfo ? rackInfo[2] : "CINZA", // C: COR
      rackInfo ? rackInfo[3] : "-",     // D: NÍVEL
      rackInfo ? rackInfo[4] : "-",     // E: SALA OU CORREDOR
      rackInfo ? rackInfo[5] : "-",     // F: LOCAIS DE REFERENCIA
      body.chamado,                   // G: CHAMADOS ASSYST
      solicitanteReal,                // H: TÉCNICO CATI
      body.manutencao ? "SIM" : "NÃO", // I: MANUTENÇÃO
      dataAtual,                      // J: DATA
      horaAtual,                      // K: HORA ABERTURA
      "",                             // L: HORA FECHAMENTO
      "",                             // M: OBSERVAÇÕES
      "",                             // N: ATENDENTE PATRIMÔNIO
      "",                             // O: JUSTIFICATIVA CANCELAMENTO
      "AGUARDANDO"                    // P: STATUS
    ];

    // 4. Localiza a próxima linha livre a partir da 37
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A37:A", 
    });
    
    const linhasOcupadas = checkResponse.data.values?.length || 0;
    const proximaLinha = 37 + linhasOcupadas;

    // 5. Grava as 16 colunas
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `RACKS!A${proximaLinha}:P${proximaLinha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [novaLinha] },
    });

    return NextResponse.json({ message: 'Ticket criado com sucesso na linha ' + proximaLinha });

  } catch (error: any) {
    console.error("Erro POST Racks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}