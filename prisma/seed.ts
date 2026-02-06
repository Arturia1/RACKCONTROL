const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const racks = [
    { nome: "50C1", setor: "Perto do Patrimônio", cor: "AMARELO", nivel: "S3", tipo: "Rack p/corredor interno", locais: "Atende ao Patrimônio; Manutenção; Almoxarifado;" },
    { nome: "54C1", setor: "Perto do Setor Médico", cor: "AMARELO", nivel: "S1", tipo: "Rack p/corredor interno", locais: "Atende ao Setor Medico; Serviço Social; Psicologia;" },
    { nome: "58C1", setor: "Perto da 6ª Execução Fiscal", cor: "AMARELO", nivel: "1", tipo: "Rack p/corredor interno", locais: "Atende da 1ª a 6ª Execução Fiscal;" },
    { nome: "52C1", setor: "Perto da 3ª Infância e Juventude", cor: "AMARELO", nivel: "S2", tipo: "Rack p/corredor interno", locais: "Atende da 1ª a 4ª da Infância; Vários departamentos da Infância; Engenharia;" },
    { nome: "59C1", setor: "Perto da 12ª Fazenda Pública", cor: "AMARELO", nivel: "2", tipo: "Rack p/corredor interno", locais: "Atende da 6ª a 15ª Fazenda Pública;" },
    { nome: "56C1", setor: "Perto da CEJUSC", cor: "AMARELO", nivel: "0", tipo: "Rack p/corredor interno", locais: "Atende a CEJUSC; Diretoria do FCB;" },
    { nome: "56B1", setor: "Dentro dos Plenos", cor: "AMARELO", nivel: "0", tipo: "Rack interno", locais: "Atende aos Plenos;" },
    { nome: "63B2", setor: "Perto da 1ª Cível", cor: "AZUL", nivel: "4", tipo: "Rack p/corredor externo", locais: "Atende da 1ª a 3ª Cível;" },
    { nome: "56A4", setor: "Cati", cor: "AZUL", nivel: "0", tipo: "Rack p/corredor interno", locais: "Atende ao CATI;" },
    { nome: "DIR", setor: "Dentro da Presidência", cor: "AZUL", nivel: "6", tipo: "Rack interno", locais: "Atende a Presidência;" },
    { nome: "59A4", setor: "Perto da SEJUD", cor: "AZUL", nivel: "2", tipo: "Rack p/corredor interno", locais: "Atende as SEJUDs de 1ª grau;" },
    { nome: "59A3", setor: "Perto da Assessoria da SEJUD", cor: "AZUL", nivel: "2", tipo: "Rack p/corredor interno", locais: "Atende a SEJUD da Fazenda;" },
    { nome: "63A4", setor: "Perto da 9ª Cível", cor: "AZUL", nivel: "4", tipo: "Rack p/corredor interno", locais: "Atende a 4ª a 11ª Cível;" },
    { nome: "58A4", setor: "Perto da Distribuição", cor: "AZUL", nivel: "1", tipo: "Rack p/corredor interno", locais: "Atende a Recepção dos Policiais;" },
    { nome: "61A4", setor: "Perto da 5ª Sucessão", cor: "AZUL", nivel: "3", tipo: "Rack p/corredor interno", locais: "Atende ao Cerimonial;" },
    { nome: "65A4", setor: "Perto do Gabinete Des.", cor: "AZUL", nivel: "5", tipo: "Rack p/corredor interno", locais: "Atende a gabinete 23 ao 44;" },
    { nome: "65B3", setor: "Perto do Gabinete Des.", cor: "AZUL", nivel: "5", tipo: "Rack p/corredor interno", locais: "Atende a gabinete 01 ao 22;" },
    { nome: "61B1", setor: "Perto da 28ª Cível", cor: "VERDE", nivel: "3", tipo: "Rack p/corredor externo", locais: "Atende da 28ª a 33ª Cível;" },
    { nome: "58A2", setor: "Perto da 18ª Família", cor: "VERDE", nivel: "4", tipo: "Rack p/corredor interno", locais: "Atende da 1ª a 5ª Fazenda Pública;" },
    { nome: "61A2", setor: "Perto da 37ª Cível", cor: "VERDE", nivel: "3", tipo: "Rack p/corredor interno", locais: "Atende ao RH; Softplan;" },
    { nome: "54A2", setor: "Perto do CAJ", cor: "VERDE", nivel: "S1", tipo: "Rack p/corredor interno", locais: "Atende ao CAJ;" },
    { nome: "59A2", setor: "Perto da 6ª Família", cor: "VERDE", nivel: "2", tipo: "Rack p/corredor interno", locais: "Atende a 1ª a 11ª Família;" },
    { nome: "63A2", setor: "Perto da 19ª Cível", cor: "VERDE", nivel: "4", tipo: "Rack p/corredor interno", locais: "Atende a 13ª a 23ª Cível;" },
    { nome: "63B1", setor: "Perto da 27ª Cível", cor: "VERDE", nivel: "4", tipo: "Rack p/corredor externo", locais: "Atende a 25ª a 27ª Cível;" },
    { nome: "56A2", setor: "Perto da Sala 04 da SECAP", cor: "VERDE", nivel: "0", tipo: "Rack p/corredor interno", locais: "Atende a SECAP;" },
    { nome: "56A1", setor: "Dentro da NPR", cor: "VERDE", nivel: "0", tipo: "Rack interno", locais: "Atende a NPR;" },
    { nome: "58C3", setor: "Perto da 18ª Criminal", cor: "VERMELHO", nivel: "1", tipo: "Rack p/corredor interno", locais: "Atende da 1ª a 10ª Criminal;" },
    { nome: "61C3", setor: "Perto da 5ª Juri", cor: "VERMELHO", nivel: "3", tipo: "Rack p/corredor interno", locais: "Atende da 11ª a 16ª Criminal;" },
    { nome: "59C3", setor: "Perto da 20ª JECC", cor: "VERMELHO", nivel: "2", tipo: "Rack p/corredor interno", locais: "Atende a 7ª, 8ª, 14ª e 20ª JEC;" },
    { nome: "56C3", setor: "Perto da Audiência Criminal", cor: "VERMELHO", nivel: "0", tipo: "Rack p/corredor interno", locais: "Atende as salas de Audência;" },
    { nome: "52C3", setor: "Perto da 5ª Tráfico", cor: "VERMELHO", nivel: "S2", tipo: "Rack p/corredor interno", locais: "Atende a AAJ; CEMAN;" },
    { nome: "54C3", setor: "Perto da 1ª Tráfico", cor: "VERMELHO", nivel: "S1", tipo: "Rack p/corredor interno", locais: "Atende a 1ª a 4ª Tráfico;" },
    { nome: "54B3", setor: "Dentro da Vara Militar", cor: "VERMELHO", nivel: "S2", tipo: "Rack interno", locais: "Atende Vara Militar;" },
    { nome: "Xadrez", setor: "Perto do Xadrez", cor: "VERMELHO", nivel: "S2", tipo: "Rack interno", locais: "Atende ao Arquivo 03;" },
    { nome: "52B3", setor: "Perto Núcleo Digitalização", cor: "VERMELHO", nivel: "S2", tipo: "Rack interno", locais: "Atende Núcleo Digitalização;" }
  ]

  console.log('Limpando inventário antigo...')
  // await prisma.rack.deleteMany({}) // (Comentado na 1ª vez pra não dar erro se a tabela não existir)

  console.log('Criando racks...')
  for (const r of racks) {
    await prisma.rack.create({ data: r })
  }
  console.log('Inventário criado com sucesso!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })