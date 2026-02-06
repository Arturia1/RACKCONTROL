-- CreateTable
CREATE TABLE "Rack" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "locais" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "rackNome" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "locais" TEXT NOT NULL,
    "chamadoAssyst" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "manutencao" BOOLEAN NOT NULL DEFAULT false,
    "horarioAbertura" TEXT NOT NULL,
    "horaFechamento" TEXT,
    "cor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "atendente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "usuario" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" INTEGER NOT NULL,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rack_nome_key" ON "Rack"("nome");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
