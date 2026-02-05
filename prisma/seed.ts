const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('123456', 10)
  await prisma.user.create({
    data: {
      name: 'Arturia Admin',
      email: 'admin@rackcontrol.com',
      password: hash,
      role: 'ADMIN'
    }
  })
  console.log('Admin criado!')
}
main()