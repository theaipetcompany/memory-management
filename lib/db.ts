import { PrismaClient } from './generated/prisma/client'

export type GetDbParams = {
  connectionString: string
}

export function getDb({ connectionString }: GetDbParams) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })

  return prisma
}

const prisma = new PrismaClient()
export default prisma
