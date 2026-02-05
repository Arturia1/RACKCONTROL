import { NextRequest, NextResponse } from "next/server";
import { getSheetsInstance, SHEET_ID } from "@/lib/googleSheets";

// Garante que não faça cache
export const dynamic = 'force-dynamic';

// --- GET: BUSCAR APENAS DA LINHA 37 PARA BAIXO ---
export async function GET() {
  try {
    const sheets = await getSheetsInstance();
    
    // Lê estritamente da linha 37 em diante
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A37:N", 
    });

    const rows = response.data.values || [];
    
    // FILTRO RIGOROSO: Só aceita linhas que tenham algo escrito na Coluna A (Nome do Rack)
    const ticketsValidos = rows.map((row, index) => {
      if (!row[0] || row[0].toString().trim() === "") return null;

      return {
        // ID Matemático: Índice do array + 37 (Linha Real no Excel)
        id: index + 37, 
        
        RACK: row[0] || "",
        SETORES: row[1] || "",
        NIVEL: row[2] || "",
        TIPO: row[3] || "",
        LOCAIS: row[4] || "",
        CHAMADO: row[5] || "",
        SOLICITANTE: row[6] || "",
        MANUTENCAO: row[7] || "",
        HORARIO: row[8] || "",
        COR: row[9] || "CINZA", // Coluna J (Mantendo a ordem que funcionou as cores)
        
        HORAFECHAMENTO: row[11] || "",
        STATUS: row[12] || "AGUARDANDO",
        ATENDENTE: row[13] || "",
      };
    }).filter(item => item !== null); // Remove os nulos (linhas vazias)

    return NextResponse.json(ticketsValidos.reverse());

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao buscar tickets" }, { status: 500 });
  }
}

// --- POST: CRIAR NA PRÓXIMA LINHA LIVRE (A PARTIR DA 37) ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sheets = await getSheetsInstance();

    // 1. Busca dados no DB para preencher (Cor, Setor...)
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

    // 2. Prepara os dados (Mantendo a ordem "BOA" que funcionou as cores)
    // Ordem: Rack, Setor, Nivel, Tipo, Locais, Chamado... Cor na J
    const infoRack = body.rackNome.toUpperCase();
    const infoSetor = rackEncontrado ? rackEncontrado[1] : "N/I";
    const infoCor = rackEncontrado ? rackEncontrado[2] : "CINZA";    
    const infoNivel = rackEncontrado ? rackEncontrado[3] : "-";      
    const infoTipo = rackEncontrado ? rackEncontrado[4] : "";      
    const infoLocais = rackEncontrado ? rackEncontrado[5] : "-";     

    const dataHora = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    const solicitante = body.tecnico || "Técnico";

    const novaLinha = [
      infoRack,       // A: Rack
      infoSetor,      // B: Setor
      infoNivel,      // C: Nível
      infoTipo,       // D: Tipo
      infoLocais,     // E: Locais
      body.chamado,   // F: Chamado
      solicitante,    // G: Solicitante
      body.manutencao ? "SIM" : "NÃO", // H: Manutenção
      dataHora,       // I: Horário
      infoCor,        // J: COR (Fundamental para o visual!)
      "",             // K
      "",             // L
      "AGUARDANDO",   // M: Status
      ""              // N
    ];

    // 3. LÓGICA DA LINHA 37 (AQUI ESTÁ O SEGREDO)
    // Lemos apenas a coluna A a partir da linha 37 para contar quantos tickets já existem
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "RACKS!A37:A", 
    });
    
    const linhasOcupadas = checkResponse.data.values?.length || 0;
    // A próxima linha livre é: 37 + quantidade que já tem
    const proximaLinha = 37 + linhasOcupadas;

    // 4. GRAVA NA LINHA EXATA (Sem usar append genérico)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `RACKS!A${proximaLinha}:N${proximaLinha}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [novaLinha] },
    });

    return NextResponse.json({ message: 'Criado na linha ' + proximaLinha });

  } catch (error: any) {
    console.error("Erro POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}