import { google } from "googleapis";

// Exporta o ID para ser usado nas rotas
export const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function getSheetsInstance() {
  // Tenta pegar o email de qualquer uma das duas variáveis possíveis
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key || !SHEET_ID) {
    throw new Error("Credenciais do Google Sheets não configuradas no .env.local. Verifique se as variáveis EMAIL e KEY existem.");
  }

  // Corrige a formatação da chave privada (especial para Vercel)
  const privateKey = key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}