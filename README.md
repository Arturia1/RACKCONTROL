# 🗄️ RACKCONTROL

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge)
![Tech](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google_Sheets_API-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

> **Sistema de Gestão de Chamados para Data Centers e Infraestrutura de TI.** > Desenvolvido para rodar localmente ou em intranet, utilizando o **Google Sheets** como Banco de Dados em Tempo Real.

---

## 🚀 Sobre o Projeto

O **RackControl** foi criado para substituir planilhas manuais e sistemas complexos de abertura de chamados. A grande inovação deste projeto é a **eliminação de bancos de dados tradicionais** (MySQL/Postgres).

Toda a persistência de dados (chamados, logs, inventário) é feita diretamente em uma **Planilha do Google Sheets**, o que permite:
1.  **Auditoria Fácil:** Os gestores podem ver os dados brutos no Excel/Sheets a qualquer momento.
2.  **Zero Infraestrutura de DB:** Não precisa instalar Docker, SQL Server ou pagar hospedagem de banco.
3.  **Atualização em Tempo Real:** O painel Kanban se atualiza automaticamente.

---

## ✨ Funcionalidades

* ✅ **Abertura Inteligente:** Ao digitar o nome do Rack (ex: `50C1`), o sistema busca automaticamente o Setor, Nível (Andar) e a Cor de identificação.
* 📊 **Kanban Board:** Visualização clara de chamados `Aguardando`, `Em Atendimento` e `Finalizados`.
* 🔔 **Alertas Sonoros:** Notificação de áudio para a equipe quando um novo chamado chega.
* 🛡️ **Proteção de Dados:** O sistema grava novos chamados de forma segura (calculando a próxima linha vazia) para evitar sobrescrever dados antigos.
* 📝 **Logs de Auditoria:** Histórico automático de quem aceitou, trocou ou finalizou um chamado.

---

## ⚙️ Estrutura da Planilha (Importante)

Para o sistema funcionar, você precisa de uma Planilha no Google com **3 Abas** configuradas exatamente nesta ordem de colunas:

### 1. Aba `DB` (Inventário)
*Base de conhecimento dos Racks.*
* **A:** Nome do Rack (Ex: `50C1`)
* **B:** Setor (Ex: `FINANCEIRO`)
* **C:** Cor (Ex: `AZUL`)
* **D:** Nível/Andar (Ex: `TÉRREO`)
* **E:** Tipo (Ex: `RACK FECHADO`)
* **F:** Locais (Ex: `SALA 101`)

### 2. Aba `RACKS` (Chamados)
*Onde os tickets são gravados. O sistema começa a ler/gravar a partir da **Linha 37** (para preservar cabeçalhos ou dados fixos acima).*
* **A:** Rack
* **B:** Setor
* **C:** Nível
* **D:** Tipo
* **E:** Locais
* **F:** Chamado (Número Externo)
* **G:** Solicitante
* **H:** Manutenção Predial? (SIM/NÃO)
* **I:** Hora de Abertura
* **J:** Cor
* **K:** (Vazio/Reservado)
* **L:** Hora Fechamento
* **M:** Status (`AGUARDANDO` / `ABERTO` / `FINALIZADO`)
* **N:** Atendente

### 3. Aba `LOGS`
*Histórico de ações.*
* **A:** Data/Hora
* **B:** Usuário
* **C:** Ação
* **D:** Detalhes

---

## 🔧 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone [https://github.com/SEU-USUARIO/rackcontrol.git](https://github.com/SEU-USUARIO/rackcontrol.git)
cd rackcontrol
