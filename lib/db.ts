import fs from 'fs/promises';
import path from 'path';

// Aponta para a pasta 'data' na raiz do projeto
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Interface para garantir que o TypeScript entenda seus dados
export interface Database {
  inventory: Array<{
    rack: string;
    setor: string;
    cor: string;
    nivel: string;
    tipo: string;
    locais: string;
  }>;
  tickets: any[];
  logs: any[];
}

// Função para ler os dados do arquivo
export async function getDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se der erro (ex: arquivo não existe), retorna vazio para não quebrar
    console.error("Erro ao ler DB:", error);
    return { inventory: [], tickets: [], logs: [] };
  }
}

// Função para salvar os dados no arquivo
export async function saveDb(data: Database) {
  // O 'null, 2' serve para deixar o JSON bonitinho e indentado
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}