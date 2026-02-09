🚀 RACKCONTROL: Gestão de Infraestrutura em Tempo Real
Status do Projeto: Versão para estudos e portfólio (Sanitizada conforme diretrizes da LGPD).

📖 Sobre o Projeto
O RACKCONTROL é uma solução full-stack desenvolvida para resolver um problema comum em centros de dados e infraestruturas de rede: a falta de visibilidade em tempo real sobre manutenções físicas em racks.

O sistema permite que técnicos de campo abram chamados instantâneos enquanto a equipe de Patrimônio monitora uma Dashboard Kanban que se atualiza automaticamente, utilizando o Google Sheets como um Banco de Dados Relacional e Gratuito.

✨ Funcionalidades Principais
🛡️ Sistema de Autenticação & RBAC: Diferentes níveis de acesso (Admin Rackcontrol, Solicitante, Admin Patrimônio, Visualizador) utilizando NextAuth.js.

📊 Kanban em Tempo Real: Painel dinâmico que monitora o status dos chamados (Aguardando, Em Atendimento, Finalizado, Cancelado).

🔊 Alerta Sonoro Inteligente: Notificação em áudio e Push Notification para novos chamados na fila, garantindo tempo de resposta mínimo.

📝 Auditoria Imutável: Registro detalhado de logs em aba separada, com observações técnicas que se tornam imutáveis após o encerramento do ticket.

📑 Integração Inteligente: Busca automática de metadados (Setor, Nível, Localização) baseada no ID do Rack via Google Sheets API.

🛠️ Stack Tecnológica
Framework: Next.js 15+ (App Router)

Estilização: Tailwind CSS

Autenticação: NextAuth.js (Auth.js)

Persistência: Google Sheets API v4

Linguagem: TypeScript

🏛️ Arquitetura e Decisões Técnicas
A escolha do Google Sheets como Backend foi uma decisão estratégica para este caso de uso, visando:

Custo Zero: Eliminação de custos de hospedagem de banco de dados.

Acessibilidade de Dados: Permite que gestores sem acesso ao sistema visualizem relatórios brutos diretamente na planilha.

Segurança (LGPD): Implementação de uma camada de API (Route Handlers) que filtra e sanitiza os dados antes de chegarem ao frontend, garantindo que informações sensíveis nunca sejam expostas.

🚀 Como Executar o Projeto
Clone o repositório:

Bash
git clone https://github.com/seu-usuario/rackcontrol.git
Instale as dependências:

Bash
npm install
Configure as Variáveis de Ambiente: Crie um arquivo .env.local baseado no .env.example fornecido no repositório.

Inicie o servidor de desenvolvimento:

Bash
npm run dev
⚖️ LGPD e Privacidade
Este repositório é uma versão de estudo. Nenhum dado real de infraestrutura, nomes de funcionários ou chaves de API privadas foram incluídos. Os dados contidos no arquivo users.json e na planilha de exemplo são meramente ilustrativos (Dummy Data).

👤 Autor
Arturia Lima Queiroz Desenvolvedora Backend & Especialista em Segurança 📍 Fortaleza, Ceará
