import { getSheetsInstance, SHEET_ID } from "./googleSheets";
// import bcrypt from "bcryptjs"; // Se der erro de tipo, pode comentar por enquanto ou usar any

// --- AUDITORIA ---
export async function registrarLog(usuario: string, acao: string, detalhes: string) {
  try {
    const sheets = await getSheetsInstance();
    const dataHora = new Date().toLocaleString("pt-BR");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "LOGS!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[dataHora, usuario, acao, detalhes]],
      },
    });
  } catch (e) {
    console.error("Falha ao registrar log", e);
  }
}

// --- AUTENTICAÇÃO ---
export async function buscarUsuarioPorEmail(email: string) {
  const sheets = await getSheetsInstance();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "USUARIOS!A:E", 
  });

  const rows = response.data.values || [];
  // Ignora cabeçalho e procura o email na coluna C (índice 2)
  const userRow = rows.slice(1).find((row) => row[2] === email);

  if (!userRow) return null;

  return {
    id: userRow[0],
    name: userRow[1],
    email: userRow[2],
    passwordHash: userRow[3],
    role: userRow[4], // ADMIN, TECNICO, CONSULTA
  };
}